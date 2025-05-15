#![no_std]

use soroban_sdk::{
    // Soroban SDK (22.0.x) in no_std mode
    contract, contractimpl, contracttype,
    token,
    Address, Env, Bytes,
};

// -----------------------------------------------------------------------------
// 1) We need a contract address for the token in 22.0.x. We will put the correct address here.
const TOKEN_CONTRACT_ID: &str = "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2RGCBQYD";

// 2) We'll store each user's data in the contract's persistent storage.
#[contracttype]
#[derive(Clone)]
pub struct UserData {
    pub beneficiary: Address,
    pub timeout: u64,
    pub revive_window: u64,
    pub last_checkin: u64,
    pub triggered_at: Option<u64>,
    pub finalized: bool,
}

// Simple helpers for load/save:
fn load_user_data(env: &Env, user: &Address) -> Option<UserData> {
    env.storage().persistent().get(user)
}

fn save_user_data(env: &Env, user: &Address, data: &UserData) {
    env.storage().persistent().set(user, data);
}

// -----------------------------------------------------------------------------
// Mark this as the contract with `#[contract]`.
#[contract]
pub struct DeadMansWallet;

// -----------------------------------------------------------------------------
// Implement contract logic with `#[contractimpl]` so the auto-generated
// client code (`DeadMansWalletClient`, etc.) works correctly.
#[contractimpl]
impl DeadMansWallet {
    // (A) Register: user sets beneficiary + timeouts
    //     In 22.0.x, we rely on transaction-level signatures to restrict access.
    pub fn register(env: Env, user: Address, beneficiary: Address, timeout: u64, revive_window: u64) {
        let now = env.ledger().timestamp();
        let data = UserData {
            beneficiary,
            timeout,
            revive_window,
            last_checkin: now,
            triggered_at: None,
            finalized: false,
        };
        save_user_data(&env, &user, &data);
    }

    // (B) Check-in: user updates `last_checkin`.
    pub fn check_in(env: Env, user: Address) {
        let mut data = load_user_data(&env, &user).expect("User not registered");
        if data.finalized {
            panic!("Already finalized.");
        }
        data.last_checkin = env.ledger().timestamp();
        save_user_data(&env, &user, &data);
    }

    // (C) Trigger: ANYONE can call if user is inactive beyond `timeout`.
    pub fn trigger(env: Env, user: Address) {
        let mut data = load_user_data(&env, &user).expect("User not registered");
        if data.finalized {
            panic!("Already finalized.");
        }
        if data.triggered_at.is_some() {
            panic!("Already triggered.");
        }
        let now = env.ledger().timestamp();
        if now <= data.last_checkin + data.timeout {
            panic!("User is still active.");
        }
        data.triggered_at = Some(now);
        save_user_data(&env, &user, &data);
    }

    // (D) Revive: user can cancel the trigger if within `revive_window`.
    pub fn revive(env: Env, user: Address) {
        let mut data = load_user_data(&env, &user).expect("User not registered");
        if data.finalized {
            panic!("Already finalized.");
        }
        let now = env.ledger().timestamp();
        match data.triggered_at {
            None => panic!("Not triggered, nothing to revive."),
            Some(t) => {
                if now <= t + data.revive_window {
                    data.triggered_at = None;
                    save_user_data(&env, &user, &data);
                } else {
                    panic!("Revive window passed.");
                }
            }
        }
    }

    // (E) Finalize: after the revive window, ANYONE can finalize (transfer funds).
    pub fn finalize(env: Env, user: Address, amount: i128) {
        let mut data = load_user_data(&env, &user).expect("User not registered");
        if data.finalized {
            panic!("Already finalized.");
        }
        let now = env.ledger().timestamp();
        let triggered_at = data.triggered_at.expect("User not triggered.");
        if now < triggered_at + data.revive_window {
            panic!("Revival window not yet passed.");
        }

        // Create Address directly from string
        let token_addr = Address::from_str(&env, TOKEN_CONTRACT_ID);

        let token_client = token::Client::new(&env, &token_addr);
        // Transfer from user -> beneficiary
        token_client.transfer(&user, &data.beneficiary, &amount);

        data.finalized = true;
        save_user_data(&env, &user, &data);
    }
}

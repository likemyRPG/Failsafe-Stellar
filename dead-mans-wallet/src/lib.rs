#![no_std]

use soroban_sdk::{
    // Soroban SDK (22.0.x) in no_std mode
    contract, contractimpl, contracttype,
    symbol_short, token,
    Address, Env, Vec, Symbol,
};

// Replace with your actual 32-byte token contract ID:
const TOKEN_CONTRACT_ID: &str = "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC";

// We can't store a &str as key in 22.0.x, so let's define a Symbol constant:
const REGISTERED_USERS_KEY: Symbol = symbol_short!("registry");

/// Data stored for each user.
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

/// Load/store user data keyed by their address.
fn load_user_data(env: &Env, user: &Address) -> Option<UserData> {
    env.storage().persistent().get(user)
}

fn save_user_data(env: &Env, user: &Address, data: &UserData) {
    env.storage().persistent().set(user, data);
}

/// Load/store a global registry of user addresses. We use `REGISTERED_USERS_KEY` (a Symbol).
fn load_registry(env: &Env) -> Vec<Address> {
    // No `unwrap_or_default()`, so do `unwrap_or_else(...)`.
    env.storage()
        .persistent()
        .get::<Symbol, Vec<Address>>(&REGISTERED_USERS_KEY)
        .unwrap_or_else(|| Vec::new(env))
}

fn save_registry(env: &Env, registry: &Vec<Address>) {
    env.storage()
        .persistent()
        .set(&REGISTERED_USERS_KEY, registry);
}

#[contract]
pub struct DeadMansWallet;

#[contractimpl]
impl DeadMansWallet {
    /// Register a user with beneficiary, timeouts, etc.
    pub fn register(env: Env, user: Address, beneficiary: Address, timeout: u64, revive_window: u64) {
        // Validate inputs
        if timeout == 0 {
            panic!("Timeout cannot be zero");
        }
        if revive_window == 0 {
            panic!("Revive window cannot be zero");
        }
        // Disallow re-registration
        if load_user_data(&env, &user).is_some() {
            panic!("User is already registered.");
        }

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

        // Add user to registry if not present
        let mut registry = load_registry(&env);
        if !registry.contains(&user) {
            registry.push_back(user.clone());
            save_registry(&env, &registry);
        }

        // Emit event
        env.events().publish((symbol_short!("register"), user.clone()), data.timeout);
    }

    /// Check-in updates last_checkin
    pub fn check_in(env: Env, user: Address) {
        let mut data = load_user_data(&env, &user).expect("User not registered");
        if data.finalized {
            panic!("User is already finalized.");
        }

        data.last_checkin = env.ledger().timestamp();
        save_user_data(&env, &user, &data);

        env.events().publish((symbol_short!("check_in"), user.clone()), data.last_checkin);
    }

    /// Trigger if user is inactive
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

        env.events().publish((symbol_short!("trigger"), user.clone()), now);
    }

    /// Revive if within the window
    pub fn revive(env: Env, user: Address) {
        let mut data = load_user_data(&env, &user).expect("User not registered");
        if data.finalized {
            panic!("Already finalized.");
        }

        let now = env.ledger().timestamp();
        match data.triggered_at {
            None => panic!("Not triggered; nothing to revive."),
            Some(t) => {
                if now <= t + data.revive_window {
                    data.triggered_at = None;
                    save_user_data(&env, &user, &data);
                    env.events().publish((symbol_short!("revive"), user.clone()), now);
                } else {
                    panic!("Revive window passed.");
                }
            }
        }
    }

    /// Finalize after the window, transferring user's funds to the beneficiary
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

        let token_addr = Address::from_str(&env, TOKEN_CONTRACT_ID);
        let token_client = token::Client::new(&env, &token_addr);
        token_client.transfer(&user, &data.beneficiary, &amount);

        data.finalized = true;
        save_user_data(&env, &user, &data);

        // Use a short symbol for the AI event to avoid the 9-char limit
        env.events().publish((symbol_short!("finalize"), user.clone()), amount);
        env.events().publish((symbol_short!("aiSig"), user.clone()), data.beneficiary.clone());
    }

    /// Finalize with multiple beneficiaries determined by admin/AI
    /// This allows distributing funds to multiple beneficiaries with different percentages
    pub fn finalize_admin(env: Env, user: Address, beneficiaries: Vec<Address>, amounts: Vec<i128>) {
        // Validate inputs
        if beneficiaries.len() != amounts.len() {
            panic!("Beneficiaries and amounts must have the same length");
        }
        if beneficiaries.len() == 0 {
            panic!("At least one beneficiary is required");
        }

        let mut data = load_user_data(&env, &user).expect("User not registered");
        if data.finalized {
            panic!("Already finalized.");
        }

        let now = env.ledger().timestamp();
        let triggered_at = data.triggered_at.expect("User not triggered.");
        if now < triggered_at + data.revive_window {
            panic!("Revival window not yet passed.");
        }

        // Transfer funds to each beneficiary
        let token_addr = Address::from_str(&env, TOKEN_CONTRACT_ID);
        let token_client = token::Client::new(&env, &token_addr);
        
        // Iterate through beneficiaries and amounts
        for i in 0..beneficiaries.len() {
            if amounts.get(i).unwrap() > 0 {
                token_client.transfer(&user, &beneficiaries.get(i).unwrap(), &amounts.get(i).unwrap());
            }
        }

        data.finalized = true;
        save_user_data(&env, &user, &data);

        // Emit events
        env.events().publish((symbol_short!("finAdm"), user.clone()), beneficiaries.len());
        for i in 0..beneficiaries.len() {
            env.events().publish(
                (symbol_short!("dist"), user.clone()), 
                (beneficiaries.get(i).unwrap().clone(), amounts.get(i).unwrap())
            );
        }
    }

    // Return the user's stored data (if any)
    pub fn get_user_data(env: Env, user: Address) -> Option<UserData> {
        load_user_data(&env, &user)
    }

    // Return the entire registry of addresses
    pub fn list_users(env: Env) -> Vec<Address> {
        load_registry(&env)
    }

    pub fn get_status(env: Env, user: Address) -> Symbol {
        match load_user_data(&env, &user) {
            None => symbol_short!("none"),
            Some(data) => {
                if data.finalized {
                    symbol_short!("finalized")
                } else if data.triggered_at.is_some() {
                    symbol_short!("triggered")
                } else {
                    symbol_short!("active")
                }
            }
        }
    }
}

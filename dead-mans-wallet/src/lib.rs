#![no_std]

//! Dead Man's Wallet Smart Contract
//! 
//! This contract implements a "dead man's switch" mechanism for managing digital assets.
//! It allows users to designate beneficiaries who will receive their assets if they
//! fail to check in within a specified timeout period.
//! 
//! Key features:
//! - User registration with beneficiary and timeout settings
//! - Regular check-ins to maintain active status
//! - Automatic triggering when user becomes inactive
//! - Revival window for users to reclaim control
//! - Finalization process to transfer assets to beneficiaries
//! - Support for single or multiple beneficiaries

use soroban_sdk::{
    // Soroban SDK (22.0.x) in no_std mode
    contract, contractimpl, contracttype,
    symbol_short, token,
    Address, Env, Vec, Symbol,
};

/// The contract ID of the token that will be managed by this wallet.
/// This should be replaced with the actual token contract ID in production.
const TOKEN_CONTRACT_ID: &str = "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC";

/// Storage key for the registry of all registered users
const REGISTERED_USERS_KEY: Symbol = symbol_short!("registry");

/// Represents the data stored for each registered user
#[contracttype]
#[derive(Clone)]
pub struct UserData {
    /// The address that will receive the assets if the user becomes inactive
    pub beneficiary: Address,
    /// Time period (in seconds) after which the wallet can be triggered if no check-in
    pub timeout: u64,
    /// Time window (in seconds) during which the user can revive after triggering
    pub revive_window: u64,
    /// Timestamp of the user's last check-in
    pub last_checkin: u64,
    /// Timestamp when the wallet was triggered (if applicable)
    pub triggered_at: Option<u64>,
    /// Whether the wallet has been finalized and assets distributed
    pub finalized: bool,
}

/// Loads user data from persistent storage
/// 
/// # Arguments
/// * `env` - The contract environment
/// * `user` - The address of the user
/// 
/// # Returns
/// * `Option<UserData>` - The user's data if they are registered, None otherwise
fn load_user_data(env: &Env, user: &Address) -> Option<UserData> {
    env.storage().persistent().get(user)
}

/// Saves user data to persistent storage
/// 
/// # Arguments
/// * `env` - The contract environment
/// * `user` - The address of the user
/// * `data` - The user data to store
fn save_user_data(env: &Env, user: &Address, data: &UserData) {
    env.storage().persistent().set(user, data);
}

/// Loads the registry of all registered user addresses
/// 
/// # Arguments
/// * `env` - The contract environment
/// 
/// # Returns
/// * `Vec<Address>` - Vector of all registered user addresses
fn load_registry(env: &Env) -> Vec<Address> {
    env.storage()
        .persistent()
        .get::<Symbol, Vec<Address>>(&REGISTERED_USERS_KEY)
        .unwrap_or_else(|| Vec::new(env))
}

/// Saves the registry of all registered user addresses
/// 
/// # Arguments
/// * `env` - The contract environment
/// * `registry` - The registry to store
fn save_registry(env: &Env, registry: &Vec<Address>) {
    env.storage()
        .persistent()
        .set(&REGISTERED_USERS_KEY, registry);
}

#[contract]
pub struct DeadMansWallet;

#[contractimpl]
impl DeadMansWallet {
    /// Registers a new user with their beneficiary and timeout settings
    /// 
    /// # Arguments
    /// * `env` - The contract environment
    /// * `user` - The address of the user to register
    /// * `beneficiary` - The address that will receive the assets if the user becomes inactive
    /// * `timeout` - Time period (in seconds) after which the wallet can be triggered
    /// * `revive_window` - Time window (in seconds) during which the user can revive after triggering
    /// 
    /// # Panics
    /// * If timeout or revive_window is zero
    /// * If the user is already registered
    pub fn register(env: Env, user: Address, beneficiary: Address, timeout: u64, revive_window: u64) {
        // Validate inputs
        if timeout == 0 {
            panic!("Timeout cannot be zero");
        }
        if revive_window == 0 {
            panic!("Revive window cannot be zero");
        }
        // Require authentication from the user
        user.require_auth();
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

    /// Updates the user's last check-in timestamp
    /// 
    /// # Arguments
    /// * `env` - The contract environment
    /// * `user` - The address of the user checking in
    /// 
    /// # Panics
    /// * If the user is not registered
    /// * If the wallet has already been finalized
    pub fn check_in(env: Env, user: Address) {
        // Require authentication from the user
        user.require_auth();
        
        let mut data = load_user_data(&env, &user).expect("User not registered");
        
        if data.finalized {
            panic!("User is already finalized.");
        }

        data.last_checkin = env.ledger().timestamp();
        save_user_data(&env, &user, &data);

        env.events().publish((symbol_short!("check_in"), user.clone()), data.last_checkin);
    }

    /// Triggers the wallet if the user has been inactive beyond their timeout period
    /// 
    /// # Arguments
    /// * `env` - The contract environment
    /// * `user` - The address of the user to trigger
    /// 
    /// # Panics
    /// * If the user is not registered
    /// * If the wallet has already been finalized
    /// * If the wallet has already been triggered
    /// * If the user is still within their timeout period
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

    /// Allows the user to revive their wallet if within the revival window
    /// 
    /// # Arguments
    /// * `env` - The contract environment
    /// * `user` - The address of the user to revive
    /// 
    /// # Panics
    /// * If the user is not registered
    /// * If the wallet has already been finalized
    /// * If the wallet has not been triggered
    /// * If the revival window has passed
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

    /// Finalizes the wallet and transfers assets to the beneficiary
    /// 
    /// # Arguments
    /// * `env` - The contract environment
    /// * `user` - The address of the user to finalize
    /// * `amount` - The amount of tokens to transfer
    /// 
    /// # Panics
    /// * If the user is not registered
    /// * If the wallet has already been finalized
    /// * If the wallet has not been triggered
    /// * If the revival window has not passed
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

    /// Finalizes the wallet and distributes assets to multiple beneficiaries
    /// 
    /// # Arguments
    /// * `env` - The contract environment
    /// * `user` - The address of the user to finalize
    /// * `beneficiaries` - Vector of beneficiary addresses
    /// * `amounts` - Vector of amounts to transfer to each beneficiary
    /// 
    /// # Panics
    /// * If the user is not registered
    /// * If the wallet has already been finalized
    /// * If the wallet has not been triggered
    /// * If the revival window has not passed
    /// * If beneficiaries and amounts vectors have different lengths
    /// * If no beneficiaries are provided
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

    /// Retrieves the stored data for a user
    /// 
    /// # Arguments
    /// * `env` - The contract environment
    /// * `user` - The address of the user to query
    /// 
    /// # Returns
    /// * `Option<UserData>` - The user's data if they are registered, None otherwise
    pub fn get_user_data(env: Env, user: Address) -> Option<UserData> {
        load_user_data(&env, &user)
    }

    /// Returns a list of all registered user addresses
    /// 
    /// # Arguments
    /// * `env` - The contract environment
    /// 
    /// # Returns
    /// * `Vec<Address>` - Vector of all registered user addresses
    pub fn list_users(env: Env) -> Vec<Address> {
        load_registry(&env)
    }

    /// Returns the current status of a user's wallet
    /// 
    /// # Arguments
    /// * `env` - The contract environment
    /// * `user` - The address of the user to query
    /// 
    /// # Returns
    /// * `Symbol` - The status of the wallet:
    ///   - "none" if not registered
    ///   - "finalized" if assets have been distributed
    ///   - "triggered" if the wallet has been triggered but not finalized
    ///   - "active" if the wallet is in normal operation
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

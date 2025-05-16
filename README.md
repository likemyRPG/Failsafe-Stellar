# Failsafe: Summary

Failsafe is a smart contract solution built on Stellar's Soroban platform, designed to provide secure and automated estate planning for crypto assets. By leveraging Stellar's fast, low-cost infrastructure and Soroban's Rust-based smart contracts, we've created a system that ensures your digital assets are protected and properly distributed in case of unexpected events.

[Learn more about why we built Failsafe →](WHY.md)

**Topics**: `stellar`, `rust`, `smart-contracts`, `consensus-toronto-2025`

## Demo, UI & Canva slides
UI Screenshots: [https://imgur.com/a/sj8zbSl](https://imgur.com/a/sj8zbSl)
Demo Video: [Loom](https://www.loom.com/share/19f4c71c1d684b0a93ff07c84d9ce370?sid=cfc4110f-382b-4008-a572-30bfa49003d6)
Canva Slides: [Canva](https://www.canva.com/design/DAGnklFAg7s/RR3wNpstzNrX09b9jgiE0g/edit?utm_content=DAGnklFAg7s&utm_campaign=designshare&utm_medium=link2&utm_source=sharebutton)

## Problem Statement

**Problem**: Many individuals hold crypto assets but face two critical risks:

1. **Key Loss**: Users frequently lose access to their private keys through device failure, forgotten passwords, or lost seed phrases. Industry research estimates over 20% of all Bitcoin (worth billions) is permanently inaccessible due to lost keys.

2. **Unexpected Incapacitation**: If a holder becomes suddenly inactive or incapacitated, their assets remain locked without a contingency plan. Typical solutions involve manually sharing private keys or partial custody, which is insecure, cumbersome, and prone to human error.

**Solution**: **Failsafe** addresses both issues by:

- Creating a "safety net" that automatically detects user inactivity on-chain and transfers funds to chosen beneficiaries
- Providing passkey-based authentication to eliminate seed phrase and private key management completely
- Allowing recovery through a "revive window" if the user regains access
- Requiring simple "check-ins" rather than complex key management

**Intelligent Distribution**: Our solution offers two distribution methods:
1. **Direct Assignment**: Manually select specific beneficiaries for your assets
2. **AI-Powered Distribution**: Let our intelligent system analyze your life events, online presence, and relationship data to automatically adjust beneficiary allocations based on changing circumstances in your life

This AI-driven approach ensures your assets are distributed according to your current life situation, even if you haven't manually updated your beneficiary list recently.

## User Base

1. **Crypto Holders**: People who want an on-chain contingency plan for their assets.
2. **Estate Planners**: Families or beneficiaries to ensure seamless asset transfer if the holder is unavailable.
3. **Developers**: Projects that need an inactivity-based fallback or vault mechanism in their dApps.

## Impact

* **Prevent Permanent Key Loss**: Eliminates the risk of permanently losing access to crypto assets due to lost or forgotten private keys by using passkey authentication instead.
* **Secure Estate Transfer**: Ensures crypto assets aren't lost in the event a user can no longer manage their wallet, whether due to death, disability, or extended absence.
* **User-Friendly**: Simple "check-in" function that can be triggered from a front-end or even automatically via reminders or push notifications.
* **No Third Party**: Everything is enforced by a Soroban (Stellar) smart contract, removing the need to trust an intermediary.

## Why Stellar? (Featuring Passkeys)

* **Soroban**: Stellar's new smart contract platform is fast, low-fee, and developer-friendly.
* **Passkeys**: We leverage [**Passkey Kit**](https://github.com/kalepail/passkey-kit) to let users sign and authenticate quickly, **replacing** cumbersome private keys with FIDO2/WebAuthn-based passkeys. This eliminates the risk of lost seed phrases or private keys entirely.
* **Seamless UX**: By using **Passkeys** and **Launchtube** for frictionless wallet creation, users can manage their "Failsafe" with just a few taps—no need to store a separate seed phrase or private key that could be lost.
* **Worldwide Reach**: Stellar's payment rails allow beneficiaries to move funds or swap them into local currencies easily.

## Experience Building on Stellar

We found **Soroban** straightforward to work with once we:

* Understood the no_std environment in Rust.
* Learned about the changes from classic SDK usage to Soroban's approach (e.g., referencing addresses, local storage, events).
* Experimented with **Launchtube** for quick test deployment on the standard Testnet.
* Integrated **Passkeys** for user authentication.

The steep Rust learning curve and limited developer tooling compared to EVM chains (like hardhat, foundry, or ethers.js) presented initial challenges, but the documentation and examples helped us overcome these hurdles.

Overall, the developer ecosystem is evolving rapidly, and we overcame some version mismatch issues but ended up with a robust solution.

---

# MVP (Minimal Viable Product)

## Public Code Repository

**URL**: [https://github.com/likemyRPG/Failsafe-Stellar](https://github.com/likemyRPG/Failsafe-Stellar)

* **Description**: "Failsafe on Stellar: A Soroban-based inactivity protocol with Passkeys integration for secure, user-friendly estate transfer."
* **Keywords/Topics**:
  * `stellar`
  * `rust`
  * `smart-contracts`
  * `consensus-toronto-2025`
  

### README Highlights

1. **List of Implemented Features**:
   * Register user with beneficiary, inactivity timeout, revival window
   * Check-in function to reset inactivity timer
   * Trigger function to finalize inactivity
   * Revive function to reclaim wallet if within grace period
   * Finalize function to transfer funds to beneficiary
   * **AI-powered fund distribution** that adapts to life events and relationship changes
   * **Passkeys integration** for user authentication without risk of lost private keys
   * **No seed phrases to manage or lose** - authentication via device biometrics only
   * Deployed to **Stellar Testnet** with **Launchtube**
   * Events for monitoring (register, check_in, trigger, revive, finalize)

2. **List of Technologies**:
   * **Soroban (Rust)** for the smart contract
   * [**js-stellar-sdk**](https://github.com/stellar/js-stellar-sdk) for the front-end interactions
   * [**Passkey Kit**](https://github.com/kalepail/passkey-kit) for user authentication using
   * [**Launchtube**](https://github.com/stellar/launchtube) for contract deployment
   * React + TypeScript for the UI
   * GitHub Actions for automated builds/tests (optional)

3. **Links**:
   * **Stellar Docs**: [Stellar Docs](https://developers.stellar.org/)
   * **Contract IDs & Stellar Expert**:
     * `DeadMansWallet` contract: `CBF4ACGDRL47K65642Z7HUG6EDVQXH4WZGTJAROYJ77O677RYIDSKTIL`
       [View on Stellar Expert](https://stellar.expert/explorer/testnet/contract/CBF4ACGDRL47K65642Z7HUG6EDVQXH4WZGTJAROYJ77O677RYIDSKTIL)


4. **Client Code**:
   * The front-end in `web/` integrates the **Passkeys** sign-in flow and calls the Soroban contract methods via `js-stellar-sdk`.

---
# Technical Documentation

## Architecture & Diagrams

```
                +-----------+          
                |  Frontend |  <-- React + Passkeys
                +-----+-----+
                      |
                      | (HTTP + WebAuthn)
                      v
               +---------------+
               |  Node API     | 
               +-------+-------+
                       |
                       v  (RPC to Soroban)
        +-----------------------------------+
        |        Soroban Contract          | <-- Deployed on Stellar Testnet
        |  Dead Man's Wallet (Rust/wasm)   |
        |  + store UserData per Address    |
        |  + timeouts, triggers, finalizes |
        +-----------------------------------+
```

## Components

1. **Soroban Contract** (`dead-mans-wallets/src/lib.rs`):
   * Manages user state, inactivity detection, triggers, finalization.
   * Emits events for register, check_in, trigger, revive, finalize.
   * Stores user data in persistent storage keyed by user address.

2. **Frontend (Next.js)** (`src/app/`):
   * Integrates **Passkeys** (via [kalepail/passkey-kit](https://github.com/kalepail/passkey-kit)) for user authentication.
   * Calls the contract's register/check_in/finalize methods with `js-stellar-sdk`.
   * Displays the current user's status, next check-in deadline, etc.

3. **Backend**:
   * Used for fast response times on frontend while keeping everything in sync with contract

## Design Choices

* **Storage**:
  * **Smart Contract Storage**: We use Soroban's persistent storage to maintain critical contract state:
    * `UserData` struct stored per user address containing:
      * Beneficiary address
      * Timeout period
      * Revival window
      * Last check-in timestamp
      * Trigger status
      * Finalization status
    * Global registry of all registered user addresses
  * **MySQL Database**: We use a MySQL database with Prisma ORM to store additional data and enable faster querying for the frontend:
    * `DeadMansWallet`: Stores wallet configurations, check-in periods, and deadlines
    * `Beneficiary`: Manages beneficiary information and share percentages
    * `AiProfile`: Stores AI configuration for intelligent distribution
    * `AiOutput`: Caches AI-generated distribution results
    * `LogEntry`: Maintains an audit trail of wallet activities
  * This hybrid approach combines the security of on-chain storage with the performance benefits of a traditional database.

* **Events**:
  * We emit the following events for monitoring and indexing:
    * `register`: When a user registers with their timeout settings
    * `check_in`: When a user performs a check-in
    * `trigger`: When a wallet is triggered due to inactivity
    * `revive`: When a user revives their wallet within the revival window
    * `finalize`: When assets are transferred to beneficiaries
    * `aiSig`: When AI-based distribution is triggered
    * `finAdm`: When admin finalization occurs
    * `dist`: When funds are distributed to individual beneficiaries

* **Passkeys Implementation**:
  * We leverage [Passkey Kit](https://github.com/kalepail/passkey-kit) for FIDO2/WebAuthn-based authentication
  * Users can authenticate using their device's biometrics or security key
  * No seed phrases or private keys to manage or lose
  * Secure signing of Soroban transactions without manual key handling
  * Seamless integration with the frontend for a frictionless user experience

* **Challenges Overcome**:
  * **Rust Learning Curve**: Adapted to Rust's strict type system and ownership model
  * **Soroban Environment**: Worked within Soroban's `no_std` environment constraints
  * **Storage Limitations**: Implemented efficient storage patterns using Soroban's persistent storage
  * **Multi-beneficiary Support**: Implemented complex distribution logic while maintaining security

---

## Deployed Contract IDs

| Contract       | Network | Contract ID       | Explorer Link                                                                     |
| -------------- | ------- | ----------------- | --------------------------------------------------------------------------------- |
| DeadMansWallet | Testnet | `CBF4ACGDRL47K65642Z7HUG6EDVQXH4WZGTJAROYJ77O677RYIDSKTIL` | [Stellar Expert (Testnet)](https://stellar.expert/explorer/testnet/contract/CBF4ACGDRL47K65642Z7HUG6EDVQXH4WZGTJAROYJ77O677RYIDSKTIL) |

---

## Conclusion

**Failsafe** demonstrates a novel, user-friendly approach to estate transfer using **Soroban** on the **Stellar Testnet**, with integrated **Passkeys** for secure, passwordless login. The entire system is **open-source** on GitHub, built in **Rust** (smart contract) plus a **React** front-end, deployed with **Launchtube**.

**Enjoy exploring** the code, docs, and demos. If you have questions or want to contribute, check out our **GitHub issues** or open a Pull Request!

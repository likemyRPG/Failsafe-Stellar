This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

# Dead Man's Wallet: Summary

## Problem Statement

**Problem**: Many individuals hold crypto assets but worry about "What happens if I suddenly become inactive or incapacitated?" Typically, that risk is mitigated by manually sharing private keys or partial custody. This is insecure, cumbersome, and prone to human error.

**Solution**: **Dead Man's Wallet** automatically detects user inactivity on-chain and transfers their funds to a chosen beneficiary if they fail to "check in" within a specified timeframe. A "revive window" allows the user to cancel the process if they become active again.

## User Base

1. **Crypto Holders**: People who want an on-chain contingency plan for their assets.
2. **Estate Planners**: Families or beneficiaries to ensure seamless asset transfer if the holder is unavailable.
3. **Developers**: Projects that need an inactivity-based fallback or vault mechanism in their dApps.

## Impact

* **Secure Estate Transfer**: Eliminates worry about lost crypto in the event a user can no longer manage their wallet.
* **User-Friendly**: Simple "check-in" function that can be triggered from a front-end or even automatically via reminders or push notifications.
* **No Third Party**: Everything is enforced by a Soroban (Stellar) smart contract, removing the need to trust an intermediary.

## Why Stellar? (Featuring Passkeys)

* **Soroban**: Stellar's new smart contract platform is fast, low-fee, and developer-friendly.
* **Passkeys**: We leverage [**Passkey Kit**](https://github.com/kalepail/passkey-kit) to let users sign and authenticate quickly, **replacing** cumbersome private keys with FIDO2/WebAuthn-based passkeys.
* **Seamless UX**: By using **Passkeys** and **Launchtube** for frictionless wallet creation, users can manage their "Dead Man's Wallet" with just a few taps—no need to store a separate seed phrase or private key.
* **Worldwide Reach**: Stellar's payment rails allow beneficiaries to move funds or swap them into local currencies easily.

## Experience Building on Stellar

We found **Soroban** straightforward to work with once we:

* Understood the no_std environment in Rust.
* Learned about the changes from classic SDK usage to Soroban's approach (e.g., referencing addresses, local storage, events).
* Experimented with **Launchtube** for quick test deployment on the standard Testnet.
* Integrated **Passkeys** for user authentication.

Overall, the developer ecosystem is evolving rapidly, and we overcame some version mismatch issues but ended up with a robust solution.

---

# MVP (Minimal Viable Product)

## Public Code Repository

**URL**: [https://github.com/example-org/stellar-dead-mans-wallet](https://github.com/example-org/stellar-dead-mans-wallet)

* **Unique Repo Name**: `stellar-dead-mans-wallet`
* **Description**: "Dead Man's Wallet on Stellar: A Soroban-based inactivity protocol with Passkeys integration for secure, user-friendly estate transfer."
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
   * **Passkeys integration** for user authentication
   * Deployed to **Stellar Testnet** with **Launchtube**
   * Events for monitoring (register, check_in, trigger, revive, finalize)

2. **List of Technologies**:
   * **Soroban (Rust)** for the smart contract
   * **js-stellar-sdk** for the front-end interactions
   * **Passkey Kit** for user authentication
   * **Launchtube** for contract deployment
   * React + TypeScript for the UI
   * GitHub Actions for automated builds/tests (optional)

3. **Links**:
   * **Why** narrative: [docs/why.md](https://github.com/example-org/stellar-dead-mans-wallet/docs/why.md)
   * **Technical Design Docs**: [docs/design.md](https://github.com/example-org/stellar-dead-mans-wallet/docs/design.md)
   * **Contract IDs & Stellar Expert**:
     * `DeadMansWallet` contract: `CDZ2QXYGRRPHEZ3E3QOK3R6BI5FYWIX277YFUFXX2LBZDYM2BYZSX2OF`
       [View on Stellar Expert](https://stellar.expert/explorer/testnet/contract/CDZ2QXYGRRPHEZ3E3QOK3R6BI5FYWIX277YFUFXX2LBZDYM2BYZSX2OF)


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
  * We store `UserData` in Soroban's contract storage keyed by `Address`.
  * This ensures all logic is on-chain, no external DB needed for core features.
* **Events**:
  * We emit events (`register`, `check_in`, `trigger`, `revive`, `finalize`) to enable off-chain monitoring or indexing.
* **Passkeys Implementation**:
  * We rely on `passkey-kit` for FIDO2-based key creation and signing.
  * This simplifies user login while letting them sign Soroban transactions without manually handling private keys.
* **Challenges Overcome**:
  * **Reference-types** issues while compiling. We disabled them for Soroban.
  * **No `env.caller()`** in older Soroban SDK versions. We pass user addresses explicitly.

---

## Deployed Contract IDs

| Contract       | Network | Contract ID       | Explorer Link                                                                     |
| -------------- | ------- | ----------------- | --------------------------------------------------------------------------------- |
| DeadMansWallet | Testnet | `CDZ2QXYGRRPHEZ3E3QOK3R6BI5FYWIX277YFUFXX2LBZDYM2BYZSX2OF` | [Stellar Expert (Testnet)](https://stellar.expert/explorer/testnet/contract/CDZ2QXYGRRPHEZ3E3QOK3R6BI5FYWIX277YFUFXX2LBZDYM2BYZSX2OF) |

---

## Conclusion

**Dead Man's Wallet** demonstrates a novel, user-friendly approach to estate transfer using **Soroban** on the **Stellar Testnet**, with integrated **Passkeys** for secure, passwordless login. The entire system is **open-source** on GitHub, built in **Rust** (smart contract) plus a **React** front-end, deployed with **Launchtube**.

**Enjoy exploring** the code, docs, and demos. If you have questions or want to contribute, check out our **GitHub issues** or open a Pull Request!

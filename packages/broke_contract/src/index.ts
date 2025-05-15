import { Buffer } from "buffer";
import { Address } from '@stellar/stellar-sdk';
import {
  AssembledTransaction,
  Client as ContractClient,
  ClientOptions as ContractClientOptions,
  MethodOptions,
  Result,
  Spec as ContractSpec,
} from '@stellar/stellar-sdk/contract';
import type {
  u32,
  i32,
  u64,
  i64,
  u128,
  i128,
  u256,
  i256,
  Option,
  Typepoint,
  Duration,
} from '@stellar/stellar-sdk/contract';
export * from '@stellar/stellar-sdk'
export * as contract from '@stellar/stellar-sdk/contract'
export * as rpc from '@stellar/stellar-sdk/rpc'

if (typeof window !== 'undefined') {
  //@ts-ignore Buffer exists
  window.Buffer = window.Buffer || Buffer;
}


export const networks = {
  testnet: {
    networkPassphrase: "Test SDF Network ; September 2015",
    contractId: "CAGY624X5A4I5QZ7RVPXWKBPE2KPUMIVTXOUSL2DFY5OO3Y3QGJBNICJ",
  }
} as const


/**
 * Data stored for each user.
 */
export interface UserData {
  beneficiary: string;
  finalized: boolean;
  last_checkin: u64;
  revive_window: u64;
  timeout: u64;
  triggered_at: Option<u64>;
}

export const Errors = {

}

export interface Client {
  /**
   * Construct and simulate a register transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Register a user with beneficiary, timeouts, etc.
   */
  register: ({user, beneficiary, timeout, revive_window}: {user: string, beneficiary: string, timeout: u64, revive_window: u64}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a check_in transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Check-in updates last_checkin
   */
  check_in: ({user}: {user: string}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a trigger transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Trigger if user is inactive
   */
  trigger: ({user}: {user: string}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a revive transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Revive if within the window
   */
  revive: ({user}: {user: string}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a finalize transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Finalize after the window, transferring user's funds to the beneficiary
   */
  finalize: ({user, amount}: {user: string, amount: i128}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a get_user_data transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_user_data: ({user}: {user: string}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<Option<UserData>>>

  /**
   * Construct and simulate a list_users transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  list_users: (options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<Array<string>>>

  /**
   * Construct and simulate a get_status transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_status: ({user}: {user: string}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<string>>

}
export class Client extends ContractClient {
  static async deploy<T = Client>(
    /** Options for initalizing a Client as well as for calling a method, with extras specific to deploying. */
    options: MethodOptions &
      Omit<ContractClientOptions, "contractId"> & {
        /** The hash of the Wasm blob, which must already be installed on-chain. */
        wasmHash: Buffer | string;
        /** Salt used to generate the contract's ID. Passed through to {@link Operation.createCustomContract}. Default: random. */
        salt?: Buffer | Uint8Array;
        /** The format used to decode `wasmHash`, if it's provided as a string. */
        format?: "hex" | "base64";
      }
  ): Promise<AssembledTransaction<T>> {
    return ContractClient.deploy(null, options)
  }
  constructor(public readonly options: ContractClientOptions) {
    super(
      new ContractSpec([ "AAAAAQAAABpEYXRhIHN0b3JlZCBmb3IgZWFjaCB1c2VyLgAAAAAAAAAAAAhVc2VyRGF0YQAAAAYAAAAAAAAAC2JlbmVmaWNpYXJ5AAAAABMAAAAAAAAACWZpbmFsaXplZAAAAAAAAAEAAAAAAAAADGxhc3RfY2hlY2tpbgAAAAYAAAAAAAAADXJldml2ZV93aW5kb3cAAAAAAAAGAAAAAAAAAAd0aW1lb3V0AAAAAAYAAAAAAAAADHRyaWdnZXJlZF9hdAAAA+gAAAAG",
        "AAAAAAAAADBSZWdpc3RlciBhIHVzZXIgd2l0aCBiZW5lZmljaWFyeSwgdGltZW91dHMsIGV0Yy4AAAAIcmVnaXN0ZXIAAAAEAAAAAAAAAAR1c2VyAAAAEwAAAAAAAAALYmVuZWZpY2lhcnkAAAAAEwAAAAAAAAAHdGltZW91dAAAAAAGAAAAAAAAAA1yZXZpdmVfd2luZG93AAAAAAAABgAAAAA=",
        "AAAAAAAAAB1DaGVjay1pbiB1cGRhdGVzIGxhc3RfY2hlY2tpbgAAAAAAAAhjaGVja19pbgAAAAEAAAAAAAAABHVzZXIAAAATAAAAAA==",
        "AAAAAAAAABtUcmlnZ2VyIGlmIHVzZXIgaXMgaW5hY3RpdmUAAAAAB3RyaWdnZXIAAAAAAQAAAAAAAAAEdXNlcgAAABMAAAAA",
        "AAAAAAAAABtSZXZpdmUgaWYgd2l0aGluIHRoZSB3aW5kb3cAAAAABnJldml2ZQAAAAAAAQAAAAAAAAAEdXNlcgAAABMAAAAA",
        "AAAAAAAAAEdGaW5hbGl6ZSBhZnRlciB0aGUgd2luZG93LCB0cmFuc2ZlcnJpbmcgdXNlcidzIGZ1bmRzIHRvIHRoZSBiZW5lZmljaWFyeQAAAAAIZmluYWxpemUAAAACAAAAAAAAAAR1c2VyAAAAEwAAAAAAAAAGYW1vdW50AAAAAAALAAAAAA==",
        "AAAAAAAAAAAAAAANZ2V0X3VzZXJfZGF0YQAAAAAAAAEAAAAAAAAABHVzZXIAAAATAAAAAQAAA+gAAAfQAAAACFVzZXJEYXRh",
        "AAAAAAAAAAAAAAAKbGlzdF91c2VycwAAAAAAAAAAAAEAAAPqAAAAEw==",
        "AAAAAAAAAAAAAAAKZ2V0X3N0YXR1cwAAAAAAAQAAAAAAAAAEdXNlcgAAABMAAAABAAAAEQ==" ]),
      options
    )
  }
  public readonly fromJSON = {
    register: this.txFromJSON<null>,
        check_in: this.txFromJSON<null>,
        trigger: this.txFromJSON<null>,
        revive: this.txFromJSON<null>,
        finalize: this.txFromJSON<null>,
        get_user_data: this.txFromJSON<Option<UserData>>,
        list_users: this.txFromJSON<Array<string>>,
        get_status: this.txFromJSON<string>
  }
}
import { Buffer } from "buffer";
import { Client as ContractClient, Spec as ContractSpec, } from '@stellar/stellar-sdk/contract';
export * from '@stellar/stellar-sdk';
export * as contract from '@stellar/stellar-sdk/contract';
export * as rpc from '@stellar/stellar-sdk/rpc';
if (typeof window !== 'undefined') {
    //@ts-ignore Buffer exists
    window.Buffer = window.Buffer || Buffer;
}
export const networks = {
    testnet: {
        networkPassphrase: "Test SDF Network ; September 2015",
        contractId: "CBF4ACGDRL47K65642Z7HUG6EDVQXH4WZGTJAROYJ77O677RYIDSKTIL",
    }
};
export const Errors = {};
export class Client extends ContractClient {
    options;
    static async deploy(
    /** Options for initalizing a Client as well as for calling a method, with extras specific to deploying. */
    options) {
        return ContractClient.deploy(null, options);
    }
    constructor(options) {
        super(new ContractSpec(["AAAAAQAAABpEYXRhIHN0b3JlZCBmb3IgZWFjaCB1c2VyLgAAAAAAAAAAAAhVc2VyRGF0YQAAAAYAAAAAAAAAC2JlbmVmaWNpYXJ5AAAAABMAAAAAAAAACWZpbmFsaXplZAAAAAAAAAEAAAAAAAAADGxhc3RfY2hlY2tpbgAAAAYAAAAAAAAADXJldml2ZV93aW5kb3cAAAAAAAAGAAAAAAAAAAd0aW1lb3V0AAAAAAYAAAAAAAAADHRyaWdnZXJlZF9hdAAAA+gAAAAG",
            "AAAAAAAAADBSZWdpc3RlciBhIHVzZXIgd2l0aCBiZW5lZmljaWFyeSwgdGltZW91dHMsIGV0Yy4AAAAIcmVnaXN0ZXIAAAAEAAAAAAAAAAR1c2VyAAAAEwAAAAAAAAALYmVuZWZpY2lhcnkAAAAAEwAAAAAAAAAHdGltZW91dAAAAAAGAAAAAAAAAA1yZXZpdmVfd2luZG93AAAAAAAABgAAAAA=",
            "AAAAAAAAAB1DaGVjay1pbiB1cGRhdGVzIGxhc3RfY2hlY2tpbgAAAAAAAAhjaGVja19pbgAAAAEAAAAAAAAABHVzZXIAAAATAAAAAA==",
            "AAAAAAAAABtUcmlnZ2VyIGlmIHVzZXIgaXMgaW5hY3RpdmUAAAAAB3RyaWdnZXIAAAAAAQAAAAAAAAAEdXNlcgAAABMAAAAA",
            "AAAAAAAAABtSZXZpdmUgaWYgd2l0aGluIHRoZSB3aW5kb3cAAAAABnJldml2ZQAAAAAAAQAAAAAAAAAEdXNlcgAAABMAAAAA",
            "AAAAAAAAAEdGaW5hbGl6ZSBhZnRlciB0aGUgd2luZG93LCB0cmFuc2ZlcnJpbmcgdXNlcidzIGZ1bmRzIHRvIHRoZSBiZW5lZmljaWFyeQAAAAAIZmluYWxpemUAAAACAAAAAAAAAAR1c2VyAAAAEwAAAAAAAAAGYW1vdW50AAAAAAALAAAAAA==",
            "AAAAAAAAAI9GaW5hbGl6ZSB3aXRoIG11bHRpcGxlIGJlbmVmaWNpYXJpZXMgZGV0ZXJtaW5lZCBieSBhZG1pbi9BSQpUaGlzIGFsbG93cyBkaXN0cmlidXRpbmcgZnVuZHMgdG8gbXVsdGlwbGUgYmVuZWZpY2lhcmllcyB3aXRoIGRpZmZlcmVudCBwZXJjZW50YWdlcwAAAAAOZmluYWxpemVfYWRtaW4AAAAAAAMAAAAAAAAABHVzZXIAAAATAAAAAAAAAA1iZW5lZmljaWFyaWVzAAAAAAAD6gAAABMAAAAAAAAAB2Ftb3VudHMAAAAD6gAAAAsAAAAA",
            "AAAAAAAAAAAAAAANZ2V0X3VzZXJfZGF0YQAAAAAAAAEAAAAAAAAABHVzZXIAAAATAAAAAQAAA+gAAAfQAAAACFVzZXJEYXRh",
            "AAAAAAAAAAAAAAAKbGlzdF91c2VycwAAAAAAAAAAAAEAAAPqAAAAEw==",
            "AAAAAAAAAAAAAAAKZ2V0X3N0YXR1cwAAAAAAAQAAAAAAAAAEdXNlcgAAABMAAAABAAAAEQ=="]), options);
        this.options = options;
    }
    fromJSON = {
        register: (this.txFromJSON),
        check_in: (this.txFromJSON),
        trigger: (this.txFromJSON),
        revive: (this.txFromJSON),
        finalize: (this.txFromJSON),
        finalize_admin: (this.txFromJSON),
        get_user_data: (this.txFromJSON),
        list_users: (this.txFromJSON),
        get_status: (this.txFromJSON)
    };
}

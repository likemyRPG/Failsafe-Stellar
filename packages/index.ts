import * as Client from "./broke_contract/src"; // import the package we just added as a dependency

// instantiate and export the Client class from the bindings package
export default new Client.Client({
  ...Client.networks.testnet, // use testnet instead of futurenet
  rpcUrl: 'https://soroban-testnet.stellar.org', // this is required to invoke the contract through RPC calls
  allowHttp: true // allow HTTP connections for testnet
});
#!/usr/bin/env node
const { Keypair } = require('@stellar/stellar-sdk');

// Generate a new random keypair
const keypair = Keypair.random();

console.log('============ STELLAR KEYPAIR ============');
console.log(`Public Key: ${keypair.publicKey()}`);
console.log(`Secret Key: ${keypair.secret()}`);
console.log('========================================');
console.log('');
console.log('INSTRUCTIONS:');
console.log('1. Save the Secret Key in your .env.local file as SERVER_SECRET_KEY');
console.log('2. Fund the Public Key with XLM before using it');
console.log('   - Testnet: Use https://laboratory.stellar.org/#account-creator?network=test');
console.log('   - Mainnet: Transfer XLM from an exchange or another wallet');
console.log('');
console.log('WARNING: Keep your Secret Key secure! Never share it or commit it to version control.') 
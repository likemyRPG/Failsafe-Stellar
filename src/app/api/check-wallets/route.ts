import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import broke_contract from '../../../../packages';
import { Buffer } from 'buffer';
import { Keypair } from '@stellar/stellar-sdk';

// Configuration
const RPC_URL = 'https://soroban-testnet.stellar.org';
const NETWORK_PASSPHRASE = 'Test SDF Network ; September 2015';

// Get contract ID from environment variable
const CONTRACT_ID = process.env.CONTRACT_ID || broke_contract.options.contractId;
// Get secret key from environment variable
const SERVER_SECRET_KEY = process.env.SERVER_SECRET_KEY || 'SC2MBZU44X54GVZCCGUM6A3ANFGTESKYEF4EMH2EGL4BS32GPIOZLYCE';

// Function to log events and store them in the database

export async function POST(request: NextRequest) {
  try {
    // Validate environment variables are set
    if (!SERVER_SECRET_KEY) {
      return NextResponse.json(
        { error: 'SERVER_SECRET_KEY environment variable is not set' },
        { status: 500 }
      );
    }

    if (!CONTRACT_ID) {
      return NextResponse.json(
        { error: 'CONTRACT_ID environment variable is not set' },
        { status: 500 }
      );
    }

    // Create a keypair from the secret key
    const serverKeypair = Keypair.fromSecret(SERVER_SECRET_KEY);
    const serverPublicKey = serverKeypair.publicKey();
    console.log(`Using server account: ${serverPublicKey}`);

    // Step 1: Get all users from the blockchain
    const txListUsers = await broke_contract.list_users();
    const result = await txListUsers.simulate();
    const users = result.result;

    console.log(users);
    
    console.log(`Found ${users.length} users in the blockchain contract`);
    
    // Results tracking
    const results = {
      totalUsers: users.length,
      usersNotInDatabase: 0,
      usersAlreadyTriggered: 0,
      usersTriggered: 0,
      usersActive: 0,
      errors: 0
    };
    
    // Step 2: For each user, check their status in the database
    for (const userAddress of users) {
      try {
        console.log(`Checking user: ${userAddress}`);
        
        // Find the user in our database
        const wallet = await prisma.deadMansWallet.findUnique({
          where: { address: userAddress }
        });
        
        if (!wallet) {
          console.log(`User ${userAddress} not found in database, skipping`);
          results.usersNotInDatabase++;
          continue;
        }
        
        // Check if the wallet is already triggered
        const txGetStatus = await broke_contract.get_status({ user: userAddress });
        const statusResult = await txGetStatus.simulate();
        const status = statusResult.result;
        
        if (status === 'triggered' || status === 'finalized') {
          console.log(`User ${userAddress} is already ${status}, skipping`);
          results.usersAlreadyTriggered++;
          continue;
        }
        
        // Check if the last check-in period has passed
        const now = new Date();
        const nextCheckInDeadline = wallet.nextCheckInDeadline;
        
        if (now > nextCheckInDeadline) {
          console.log(`User ${userAddress} has missed their check-in deadline (${nextCheckInDeadline.toISOString()}), triggering the contract`);
          
          // Trigger the contract for this user
          const txTrigger = await broke_contract.trigger({ user: userAddress });
          await txTrigger.signAndSend();
          
          results.usersTriggered++;
        } else {
          const timeLeft = nextCheckInDeadline.getTime() - now.getTime();
          const daysLeft = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
          const hoursLeft = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          
          console.log(`User ${userAddress} is still active. Time left: ${daysLeft} days, ${hoursLeft} hours`);
          results.usersActive++;
        }
      } catch (error) {
        console.error(`Error processing user ${userAddress}:`, error);
        results.errors++;
      }
    }
    
    return NextResponse.json(
      { 
        message: 'Wallet check completed successfully',
        results
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error checking wallets:', error);
    
    return NextResponse.json(
      { error: 'Failed to check wallets', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// GET endpoint to learn how to use this API
export async function GET(request: NextRequest) {
  return NextResponse.json(
    {
      message: 'Use POST method to run a dead man\'s wallet check',
      note: 'This will check all wallets and trigger the dead man\'s switch for any that have passed their deadline',
      setup: 'Ensure SERVER_SECRET_KEY and CONTRACT_ID environment variables are set before using this API'
    },
    { status: 200 }
  );
} 
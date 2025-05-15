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
const SERVER_SECRET_KEY = process.env.SERVER_SECRET_KEY;

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
    console.log('AAAA', SERVER_SECRET_KEY);
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
      usersAlreadyFinalized: 0,
      usersInGracePeriod: 0,
      usersFinalized: 0,
      usersWithAI: 0,
      usersWithoutAI: 0,
      errors: 0
    };
    
    // Step 2: For each user, check their status in the database and contract
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
        
        // Check wallet status in the contract
        const txGetStatus = await broke_contract.get_status({ user: userAddress });
        const statusResult = await txGetStatus.simulate();
        const status = statusResult.result;
        
        if (status === 'finalized') {
          console.log(`User ${userAddress} is already finalized, skipping`);
          results.usersAlreadyFinalized++;
          continue;
        }
        
        // Check if the wallet is already triggered
        if (status === 'triggered') {
          console.log(`User ${userAddress} is already triggered, checking grace period`);
          results.usersAlreadyTriggered++;
          
          // GRACE PERIOD CHECK
          // Get the user data from the contract to check triggered_at timestamp
          const txGetUserData = await broke_contract.get_user_data({ user: userAddress });
          const userDataResult = await txGetUserData.simulate();
          const userData = userDataResult.result;
          
          if (!userData || !userData.triggered_at) {
            console.log(`User ${userAddress} missing triggered_at data, skipping grace period check`);
            continue;
          }
          
          // Check if we're past the grace period (revive window)
          const triggeredAt = userData.triggered_at;
          const reviveWindow = userData.revive_window;
          const now = Math.floor(Date.now() / 1000); // Current timestamp in seconds
          
          if (now < triggeredAt + reviveWindow) {
            console.log(`User ${userAddress} still in grace period, skipping finalization`);
            results.usersInGracePeriod++;
            continue;
          }
          
          console.log(`User ${userAddress} past grace period, finalizing...`);
          
          // Check if AI is set up for this wallet
          const aiProfile = await prisma.aiProfile.findUnique({
            where: { address: userAddress }
          });
          
          const isAIConfigured = aiProfile && aiProfile.isEnabled && aiProfile.prompt;
          
          if (!isAIConfigured) {
            // For non-AI wallets, use regular finalize with the original beneficiary
            console.log(`Using regular finalize for ${userAddress}`);
            
            // Assume some amount - ideally you would fetch the actual balance
            const amount = BigInt(100000000); // 10 XLM in stroops
            
            const txFinalize = await broke_contract.finalize({
              user: userAddress,
              amount: amount
            });
            
            await txFinalize.signAndSend();
            results.usersFinalized++;
            results.usersWithoutAI++;
          } else {
            // For AI-enabled wallets, call the execute endpoint
            console.log(`Using AI finalize for ${userAddress}`);
            
            // Call the execute endpoint
            const executeResponse = await fetch(`${request.nextUrl.origin}/api/ai/execute`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ address: userAddress }),
            });
            
            if (!executeResponse.ok) {
              throw new Error(`AI execution failed with status ${executeResponse.status}`);
            }
            
            const aiResult = await executeResponse.json();
            
            if (!aiResult.result) {
              throw new Error('AI execution did not return a result');
            }
            
            // Parse the AI result to get beneficiary allocations
            let allocationData: Record<string, { amount: number, name: string }>;
            try {
              // It may already be an object if API returns JSON
              if (typeof aiResult.result === 'string') {
                allocationData = JSON.parse(aiResult.result);
              } else {
                allocationData = aiResult.result;
              }
            } catch (error) {
              const e = error as Error;
              throw new Error(`Failed to parse AI result: ${e.message}`);
            }
            
            // Transform allocations into vectors for the finalizeAdmin function
            const beneficiaries = [];
            const amounts = [];
            const totalAmount = BigInt(100000000); // 10 XLM in stroops, adjust as needed

            for (const [address, data] of Object.entries(allocationData)) {
              if (data.amount > 0) {
                beneficiaries.push(address);
                // Calculate actual amount based on percentage
                const amount = BigInt(Math.floor((Number(totalAmount) * data.amount) / 100));
                amounts.push(amount);
              }
            }
            
            if (beneficiaries.length > 0) {
              // Call finalizeAdmin with the beneficiary allocations
              // Using any type here since the contract interface is being updated
              const txFinalizeAdmin = await (broke_contract as any).finalize_admin({
                user: userAddress,
                beneficiaries: beneficiaries,
                amounts: amounts
              });
              
              await txFinalizeAdmin.signAndSend();
              results.usersFinalized++;
              results.usersWithAI++;
            } else {
              throw new Error('No valid beneficiaries found in AI result');
            }
          }
          
          continue;
        }
        
        // At this point, the wallet is active and not triggered
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
        message: 'Wallet check and finalization completed successfully',
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
      note: 'This will check all wallets, trigger any that have passed their deadline, and finalize any triggered wallets that are past their grace period',
      setup: 'Ensure SERVER_SECRET_KEY and CONTRACT_ID environment variables are set before using this API'
    },
    { status: 200 }
  );
} 
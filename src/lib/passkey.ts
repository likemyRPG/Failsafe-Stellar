import { PasskeyKit, PasskeyServer, SACClient } from "passkey-kit";
import { Account, Keypair, StrKey } from "@stellar/stellar-sdk";
import { Buffer } from "buffer";
import { toast } from "react-toastify";
import { Server } from "@stellar/stellar-sdk/minimal/rpc";

// Configuration constants
export const NETWORK_PASSPHRASE = "Test SDF Network ; September 2015";
// Use correct Soroban testnet RPC endpoints - try multiple variations if needed
export const RPC_URL = "https://soroban-testnet.stellar.org";
export const FALLBACK_RPC_URL = "https://soroban-testnet.stellar.org:443";
export const FORCE_LOCAL_WALLET = true; // Force local wallets since the testnet WASM is not available

// Debug mode
const DEBUG = true;

// Override PasskeyKit.prototype.createWallet to add logging
const originalCreateWallet = PasskeyKit.prototype.createWallet;
PasskeyKit.prototype.createWallet = async function(domain, displayName) {
    if (DEBUG) {
        console.log("PasskeyKit.createWallet called with:", { domain, displayName });
    }
    
    try {
        const result = await originalCreateWallet.call(this, domain, displayName);
        if (DEBUG) {
            console.log("PasskeyKit.createWallet succeeded with result:", result);
        }
        return result;
    } catch (error) {
        if (DEBUG) {
            console.error("PasskeyKit.createWallet failed with error:", error);
            if (error instanceof Error) {
                console.error("Error message:", error.message);
                console.error("Error stack:", error.stack);
            }
        }
        throw error;
    }
};

const contract = require("@stellar/stellar-sdk/contract");
const basicNodeSigner = contract.basicNodeSigner;

// Get RPC client for primary or fallback server
function createRpcClient() {
  try {
    // Try primary server with explicit allowHttp
    return new Server(RPC_URL, {
      allowHttp: true, // Explicitly allow HTTP connections
      timeout: 30000 // 30 seconds timeout
    });
  } catch (e) {
    console.warn("Failed to connect to primary RPC server:", e);
    try {
      // Try fallback server with explicit allowHttp
      return new Server(FALLBACK_RPC_URL, {
        allowHttp: true, // Explicitly allow HTTP connections
        timeout: 30000 // 30 seconds timeout
      });
    } catch (e) {
      console.error("Failed to connect to fallback RPC server:", e);
      // Emergency fallback - create a basic server - still need allowHttp
      return new Server(RPC_URL, { allowHttp: true });
    }
  }
}

export const rpc = createRpcClient();

export const mockPubkey = StrKey.encodeEd25519PublicKey(Buffer.alloc(32));
export const mockSource = new Account(mockPubkey, "0");

export const fundKeypair = new Promise<Keypair>(async (resolve) => {
    const now = new Date();
    now.setMinutes(0, 0, 0);
    const nowData = new TextEncoder().encode(now.getTime().toString());
    const hashBuffer = await crypto.subtle.digest("SHA-256", nowData);
    const keypair = Keypair.fromRawEd25519Seed(Buffer.from(hashBuffer));
    rpc.requestAirdrop(keypair.publicKey()).catch(() => {});
    resolve(keypair);
});

export const fundPubkey = (await fundKeypair).publicKey();
export const fundSigner = basicNodeSigner(
    await fundKeypair,
    NETWORK_PASSPHRASE
);

// Initialize PasskeyKit with configuration for testnet
export const account = new PasskeyKit({
    rpcUrl: RPC_URL,
    networkPassphrase: NETWORK_PASSPHRASE,
    timeoutInSeconds: 25, // Reduced timeout to meet Launchtube's 30-second requirement
    // Use the known working hash from the environment variables
    walletWasmHash: "ecd990f0b45ca6817149b6175f79b32efb442f35731985a084131e8265c4cd90"
    // Note: factoryContractId is not supported in this version of PasskeyKit
    // If wallet creation fails, you may need to use a different version of PasskeyKit
    // that includes factory contract ID support
});

// Create the server instance with Launchtube configuration
export const server = new PasskeyServer({
    rpcUrl: RPC_URL,
    launchtubeUrl: "https://testnet.launchtube.xyz/",
    launchtubeJwt: "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIzMDAzNGNlOWYwODliMjU1YmFiYWZjYjc5M2ZkN2ExMmQ0N2MwYjIxYTI1YzJmNWEzNTk2Yzk0Y2VkZDQ3ZmJlIiwiZXhwIjoxNzU0NTM2NDM3LCJjcmVkaXRzIjoxMDAwMDAwMDAwLCJpYXQiOjE3NDcyNzg4Mzd9.Tx07I_lyhrTWzvtyKqD92-m36VCpuzXEPwfHvN07Tag"
});


// Initialize SAC client
export const sac = new SACClient({
  rpcUrl: RPC_URL,
  networkPassphrase: NETWORK_PASSPHRASE
});

export const native = sac.getSACClient(
    "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC"
);

export const ousd = sac.getSACClient(
    "CCIL2PEJSWL3VYFAJMQSY4BG2UEQ7GHTGAV5YKYNNDOTXQXLPTTBJJWW"
);

export const send_transaction = async (xdr: string, fee = 10_000, maxRetries = 3) => {
    const submittingToast = toast.info("Submitting transaction...", {
        position: "top-right",
        autoClose: false,
        hideProgressBar: false,
        closeOnClick: false,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
    });

    try {
        // Use the server to submit transaction via Launchtube
        console.log("Submitting transaction via PasskeyServer");
        
        // Submit the transaction through Launchtube
        const result = await server.submitXdr(xdr, {
            sim: false,
            fee: fee
        });
        
        // Close the submitting toast if it exists
        if (submittingToast) {
            toast.dismiss(submittingToast);
        }
        
        // Show success notification
        toast.success("Transaction submitted successfully!", {
            position: "top-right",
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
        });
        
        return result;
    } catch (error) {
        // Dismiss the submitting toast if it's still showing
        toast.dismiss(submittingToast);
        
        console.error("Transaction submission failed:", error);
        
        toast.error("Transaction failed. Please try again.", {
            position: "top-right",
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
        });
        
        throw error;
    }
};

// Direct WebAuthn function for creating passkeys (following PasskeyKit demo patterns)
export async function createLocalPasskey(domain: string, username: string) {
    console.log("Creating local passkey for", username);
    
    try {
        // Generate a random challenge
        const challenge = new Uint8Array(32);
        window.crypto.getRandomValues(challenge);
        
        // Generate a random user ID
        const userId = new Uint8Array(16);
        window.crypto.getRandomValues(userId);
        
        // Add proper types for WebAuthn
        interface AuthenticatorSelectionCriteria {
            authenticatorAttachment?: 'platform' | 'cross-platform';
            requireResidentKey?: boolean;
            residentKey?: 'discouraged' | 'preferred' | 'required';
            userVerification?: 'discouraged' | 'preferred' | 'required';
        }
        
        // Create credential options following WebAuthn standards
        const credentialOptions: any = {
            challenge: challenge.buffer,
            rp: {
                name: domain || "Stellar Wallet",
                id: window.location.hostname
            },
            user: {
                id: userId.buffer,
                name: username,
                displayName: username
            },
            pubKeyCredParams: [
                { type: "public-key", alg: -7 }, // ES256
                { type: "public-key", alg: -257 } // RS256
            ],
            timeout: 60000,
            attestation: "direct" as const,
            authenticatorSelection: {
                authenticatorAttachment: "platform" as const,
                requireResidentKey: true,
                residentKey: "required" as const,
                userVerification: "required" as const
            }
        };
        
        // Create the credential
        const credential = await navigator.credentials.create({
            publicKey: credentialOptions
        });
        
        if (!credential) {
            throw new Error("Failed to create credential");
        }
        
        // Cast to PublicKeyCredential type
        const pkCredential = credential as any;
        
        // Extract information for creating a local wallet
        const keyId = pkCredential.id;
        const contractId = `LOCAL_${keyId.substring(0, 20)}`;
        
        console.log("Local passkey created successfully:", { 
            keyId, 
            contractId
        });
        
        return { 
            keyId, 
            contractId, 
            credential: pkCredential
        };
    } catch (error) {
        console.error("Error creating local passkey:", error);
        throw error;
    }
}

// Simplified function to fund a wallet using the PasskeyServer
export const fundWithLaunchtube = async (targetAccount: string, amount = 10_000_000) => {
    try {
        console.log("Attempting to fund account using Launchtube via PasskeyServer:", targetAccount);
        
        // Create the transfer transaction
        const { built, ...transfer } = await native.transfer({
            from: fundPubkey,
            to: targetAccount,
            amount: BigInt(amount)
        });
        
        // Convert to XDR
        await transfer.signAuthEntries({
			address: fundPubkey,
			signAuthEntry: fundSigner.signAuthEntry,
		});
        const res = await server.send(built!);
        
        return {
            success: true,
            source: 'launchtube',
            res,
            message: "Successfully funded account via Launchtube"
        };
    } catch (error) {
        console.error("Error funding with Launchtube:", error);
        return {
            success: false,
            error,
            message: "Error funding with Launchtube: " + 
                (error instanceof Error ? error.message : String(error))
        };
    }
};

// Add a direct funding helper function
export const fundAccountDirectly = async (targetAccount: string) => {
    try {
        console.log("Direct funding attempt for account:", targetAccount);
        console.log("Using fund pubkey:", fundPubkey);
        
        // Try using SAC client
        try {
            console.log("Attempting with SAC client");
            const transferResponse = await native.transfer({
                from: fundPubkey, 
                to: targetAccount,
                amount: BigInt(10_000_000) // 1 XLM
            });
            
            console.log("SAC transfer response:", transferResponse);
            console.log("SAC transfer type:", typeof transferResponse);
            console.log("SAC transfer properties:", Object.keys(transferResponse));
            
            // Try to sign and send - fix the type issues
            if (transferResponse && typeof transferResponse.sign === 'function') {
                console.log("Signing transaction with fundSigner");
                try {
                    const signed = transferResponse.sign({
                        [fundPubkey]: fundSigner
                    });
                    
                    console.log("Signed transaction:", signed);
                    
                    // Only proceed if we have a valid signed transaction
                    if (signed && typeof signed === 'object') {
                        console.log("Signed transaction properties:", Object.keys(signed as object));
                        
                        // Type-safe check if signAndSend exists
                        const signedObj = signed as unknown as { signAndSend?: Function };
                        if (signedObj && typeof signedObj.signAndSend === 'function') {
                            console.log("Sending transaction");
                            const result = await signedObj.signAndSend();
                            console.log("Transaction result:", result);
                            return { success: true, result };
                        } else {
                            console.error("signAndSend method not available on signed tx");
                        }
                    }
                } catch (signError) {
                    console.error("Signing error:", signError);
                }
            } else {
                console.error("sign method not available on transaction");
            }
        } catch (sacError) {
            console.error("SAC client transfer error:", sacError);
            
            // Log detailed error
            if (sacError instanceof Error) {
                console.error("Error message:", sacError.message);
                console.error("Error stack:", sacError.stack);
            }
        }
        
        // Try using friendbot as fallback
        try {
            console.log("Attempting with friendbot");
            const friendbotUrl = `https://friendbot.stellar.org/?addr=${encodeURIComponent(targetAccount)}`;
            const response = await fetch(friendbotUrl);
            const responseData = await response.json();
            
            console.log("Friendbot response:", responseData);
            
            if (response.ok) {
                console.log("Friendbot funding successful");
                return { success: true, source: "friendbot", result: responseData };
            } else {
                console.log("Friendbot funding failed");
            }
        } catch (friendbotError) {
            console.error("Friendbot error:", friendbotError);
        }
        
        return { success: false, error: "All funding methods failed" };
    } catch (e) {
        console.error("General funding error:", e);
        return { success: false, error: e };
    }
};

// Add a function to get the public key associated with a contract
export const getPublicKeyFromContract = async (contractId: string) => {
    if (contractId.startsWith('G')) {
        // Already a public key
        return contractId;
    }
    
    try {
        console.log("Trying to get public key from contract:", contractId);
        // Query the Soroban RPC to get info about the contract
        const response = await fetch(`https://soroban-testnet.stellar.org/api/v1/accounts/${contractId}`);
        const data = await response.json();
        console.log("Account data:", data);
        
        if (data && data.id) {
            return data.id;
        }
        
        return null;
    } catch (e) {
        console.error("Error getting public key from contract:", e);
        return null;
    }
};

// Improved direct funding method that uses the explorer API and works with contract accounts
export const fundWithExplorer = async (contractId: string) => {
    try {
        console.log("Attempting direct explorer funding for account:", contractId);
        
        // First try with the contract ID directly (might be a public key)
        let directFriendbot = `https://friendbot.stellar.org/?addr=${encodeURIComponent(contractId)}`;
        let response = await fetch(directFriendbot);
        
        if (response.ok) {
            const result = await response.json();
            console.log("Direct friendbot funding successful:", result);
            return { success: true, source: 'friendbot', result };
        }
        
        console.log("Direct funding failed, trying explorer lookup...");
        
        // Try to query the Stellar Explorer API to get the associated public key
        try {
            const explorerResponse = await fetch(`https://api.testnet.stellar.expert/explorer/testnet/account/${contractId}`);
            const explorerData = await explorerResponse.json();
            console.log("Explorer account data:", explorerData);
            
            if (explorerData && explorerData.data && explorerData.data.account && explorerData.data.account.public_key) {
                const publicKey = explorerData.data.account.public_key;
                console.log("Found public key via explorer:", publicKey);
                
                // Fund the public key
                const friendbotUrl = `https://friendbot.stellar.org/?addr=${encodeURIComponent(publicKey)}`;
                const fbResponse = await fetch(friendbotUrl);
                
                if (fbResponse.ok) {
                    const result = await fbResponse.json();
                    console.log("Public key funding successful:", result);
                    return { success: true, source: 'friendbot-via-explorer', result };
                } else {
                    const errorData = await fbResponse.json();
                    console.log("Public key funding failed:", errorData);
                }
            }
        } catch (explorerError) {
            console.error("Explorer lookup error:", explorerError);
        }
        
        // Try with the Laboratory API
        try {
            console.log("Trying to get master account for contract using Laboratory API");
            const masterResponse = await fetch(`https://horizon-testnet.stellar.org/accounts/${contractId}`);
            
            if (masterResponse.ok) {
                const masterData = await masterResponse.json();
                console.log("Master account data:", masterData);
                
                if (masterData && masterData.account_id) {
                    const masterKey = masterData.account_id;
                    console.log("Found master key:", masterKey);
                    
                    // Fund the master key
                    const friendbotUrl = `https://friendbot.stellar.org/?addr=${encodeURIComponent(masterKey)}`;
                    const fbResponse = await fetch(friendbotUrl);
                    
                    if (fbResponse.ok) {
                        const result = await fbResponse.json();
                        console.log("Master key funding successful:", result);
                        return { success: true, source: 'friendbot-via-laboratory', result };
                    } else {
                        const errorData = await fbResponse.json();
                        console.log("Master key funding failed:", errorData);
                    }
                }
            }
        } catch (labError) {
            console.error("Laboratory lookup error:", labError);
        }
        
        // Last resort: Try using the Soroban network details endpoint
        try {
            console.log("Trying Soroban network details endpoint");
            const networkResponse = await fetch("https://soroban-testnet.stellar.org/");
            if (networkResponse.ok) {
                const networkData = await networkResponse.json();
                console.log("Network details:", networkData);
                
                if (networkData && networkData.friendbotUrl) {
                    // Use the network's specified friendbot URL
                    const sorobanFriendbotUrl = `${networkData.friendbotUrl}?addr=${encodeURIComponent(contractId)}`;
                    console.log("Using Soroban-specific friendbot URL:", sorobanFriendbotUrl);
                    
                    const fbResponse = await fetch(sorobanFriendbotUrl);
                    if (fbResponse.ok) {
                        const result = await fbResponse.json();
                        console.log("Soroban friendbot funding successful:", result);
                        return { success: true, source: 'soroban-friendbot', result };
                    } else {
                        const errorData = await fbResponse.json();
                        console.log("Soroban friendbot funding failed:", errorData);
                    }
                }
            }
        } catch (networkError) {
            console.error("Network details lookup error:", networkError);
        }
        
        // Manual fund using the direct Stellar Laboratory method
        try {
            console.log("Trying manual funding via Stellar Laboratory");
            // Generate a URL that the user can click to fund their wallet
            const labUrl = `https://laboratory.stellar.org/#account-creator?network=test&account=${contractId}`;
            console.log("Manual funding URL (for user):", labUrl);
            
            // Open the URL in a new tab
            window.open(labUrl, '_blank');
            
            return { 
                success: false, 
                manualUrl: labUrl,
                message: "Automatic funding failed. We've opened the Stellar Laboratory in a new tab where you can fund your account manually."
            };
        } catch (e) {
            console.error("Manual funding error:", e);
        }
        
        return { success: false, error: "All funding methods failed" };
    } catch (e) {
        console.error("General funding error:", e);
        return { success: false, error: e };
    }
};

// Add a function to fund a contract by finding and funding its creator account
export const fundContractCreator = async (contractId: string, amount = 10_000_000) => {
    try {
        console.log("Attempting to find and fund creator of contract:", contractId);
        
        // Step 1: Try to find the creator account of this contract
        let creatorAccount = null;
        
        // Try Stellar Expert API first
        try {
            const expertUrl = `https://api.testnet.stellar.expert/explorer/testnet/account/${contractId}`;
            console.log("Querying Stellar Expert for contract info:", expertUrl);
            const expertResponse = await fetch(expertUrl);
            const expertData = await expertResponse.json();
            console.log("Stellar Expert response:", expertData);
            
            if (expertData && expertData.data && expertData.data.account) {
                // Look for the creator in the data
                if (expertData.data.account.sponsor) {
                    creatorAccount = expertData.data.account.sponsor;
                    console.log("Found sponsor account:", creatorAccount);
                } else if (expertData.data.account.parent) {
                    creatorAccount = expertData.data.account.parent;
                    console.log("Found parent account:", creatorAccount);
                } else if (expertData.data.account._links && expertData.data.account._links.creator) {
                    creatorAccount = expertData.data.account._links.creator.split('/').pop();
                    console.log("Found creator account:", creatorAccount);
                }
            }
        } catch (expertError) {
            console.error("Error querying Stellar Expert:", expertError);
        }
        
        // If no creator found, try Horizon API
        if (!creatorAccount) {
            try {
                const horizonUrl = `https://horizon-testnet.stellar.org/accounts/${contractId}`;
                console.log("Querying Horizon for contract info:", horizonUrl);
                const horizonResponse = await fetch(horizonUrl);
                
                if (horizonResponse.ok) {
                    const horizonData = await horizonResponse.json();
                    console.log("Horizon response:", horizonData);
                    
                    // Look for sponsor or source account
                    if (horizonData.sponsor) {
                        creatorAccount = horizonData.sponsor;
                        console.log("Found sponsor account from Horizon:", creatorAccount);
                    } else if (horizonData.source_account) {
                        creatorAccount = horizonData.source_account;
                        console.log("Found source account from Horizon:", creatorAccount);
                    }
                }
            } catch (horizonError) {
                console.error("Error querying Horizon:", horizonError);
            }
        }
        
        // If still no creator found, try Soroban RPC
        if (!creatorAccount) {
            try {
                const sorobanUrl = `https://soroban-testnet.stellar.org/api/v1/accounts/${contractId}`;
                console.log("Querying Soroban RPC for contract info:", sorobanUrl);
                const sorobanResponse = await fetch(sorobanUrl);
                
                if (sorobanResponse.ok) {
                    const sorobanData = await sorobanResponse.json();
                    console.log("Soroban RPC response:", sorobanData);
                    
                    if (sorobanData.sponsor) {
                        creatorAccount = sorobanData.sponsor;
                        console.log("Found sponsor account from Soroban RPC:", creatorAccount);
                    }
                }
            } catch (sorobanError) {
                console.error("Error querying Soroban RPC:", sorobanError);
            }
        }
        
        // If we found a creator account, try to fund it
        if (creatorAccount) {
            console.log("Found creator account to fund:", creatorAccount);
            
            // Try using Friendbot to fund the creator
            try {
                const friendbotUrl = `https://friendbot.stellar.org/?addr=${encodeURIComponent(creatorAccount)}`;
                console.log("Funding creator with Friendbot:", friendbotUrl);
                const friendbotResponse = await fetch(friendbotUrl);
                const friendbotResult = await friendbotResponse.json();
                
                console.log("Friendbot response:", friendbotResult);
                
                if (friendbotResponse.ok) {
                    return {
                        success: true,
                        message: "Successfully funded creator account with Friendbot",
                        creatorAccount,
                        source: "friendbot",
                        result: friendbotResult
                    };
                } else {
                    console.error("Friendbot funding failed:", friendbotResult);
                }
            } catch (friendbotError) {
                console.error("Error funding with Friendbot:", friendbotError);
            }
            
            // If Friendbot failed, open the Laboratory for manual funding
            const labUrl = `https://laboratory.stellar.org/#account-creator?network=test&account=${creatorAccount}`;
            window.open(labUrl, '_blank');
            
            return {
                success: false,
                manualUrl: labUrl,
                creatorAccount,
                message: "Opened Stellar Laboratory to manually fund the creator account"
            };
        }
        
        // If we couldn't find a creator account
        return {
            success: false,
            message: "Could not find creator account to fund",
            suggestion: "This might be a contract that cannot be directly funded. Try using the Stellar Laboratory to investigate."
        };
    } catch (error) {
        console.error("Error in fundContractCreator:", error);
        return {
            success: false,
            error,
            message: "Error finding or funding creator: " + (error instanceof Error ? error.message : String(error))
        };
    }
};

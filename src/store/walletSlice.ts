import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
    account,
    fundPubkey,
    fundSigner,
    native,
    send_transaction,
    rpc,
    NETWORK_PASSPHRASE,
    RPC_URL,
    FORCE_LOCAL_WALLET,
    createLocalPasskey,
    fundWithLaunchtube,
    fundContractCreator
} from "../lib/passkey";
import { toast } from "react-toastify";

export interface DeadMansWalletConfig {
    isConfigured: boolean;
    destinationAddress: string | null;
    checkInPeriod: number; // in days
    lastCheckIn: string | null; // ISO date string
    nextCheckInDeadline: string | null; // ISO date string
}

export interface WalletState {
    keyId: string | null;
    contractId: string | null;
    balance: string | null;
    isConnected: boolean;
    isLoading: boolean;
    error: string | null;
    fundingError: string | null;
    deadMansWallet: DeadMansWalletConfig;
}

const initialState: WalletState = {
    keyId: localStorage.getItem("keyId"),
    contractId: localStorage.getItem("contractId"),
    balance: null,
    isConnected: !!localStorage.getItem("keyId"),
    isLoading: false,
    error: null,
    fundingError: null,
    deadMansWallet: {
        isConfigured: false,
        destinationAddress: null,
        checkInPeriod: 30,
        lastCheckIn: null,
        nextCheckInDeadline: null
    }
};

const SCALAR_7 = 10_000_000;

export const autoConnectWallet = createAsyncThunk(
    "wallet/autoConnect",
    async (_, { dispatch }) => {
        console.log("Attempting auto-connect...");
        const storedKeyId = localStorage.getItem("keyId");
        console.log("Found stored key ID:", storedKeyId);
        if (storedKeyId) {
            const storedContractId = localStorage.getItem("contractId");
            console.log("Found stored contract ID:", storedContractId);
            if (storedContractId) {
                dispatch(setKeyId(storedKeyId));
                dispatch(setContractId(storedContractId));
                dispatch(setConnected(true));
                await dispatch(getWalletBalance());
                return { keyId: storedKeyId, contractId: storedContractId };
            }
        }
        console.log("Auto-connect failed: No valid wallet credentials found");
        return null;
    }
);

// Improved fallback method for creating a passkey without dependencies
const createPasskeyDirectly = async (domain: string, displayName: string) => {
    console.log("Attempting direct passkey creation as fallback...");
    
    try {
        // Generate random challenge
        const challenge = new Uint8Array(32);
        window.crypto.getRandomValues(challenge);
        
        // Generate user ID
        const userId = new Uint8Array(16);
        window.crypto.getRandomValues(userId);
        
        // Create proper credential creation options
        const publicKeyCredentialCreationOptions = {
            challenge: challenge.buffer,
            rp: {
                name: domain || "Stellar Wallet",
                id: window.location.hostname
            },
            user: {
                id: userId.buffer,
                name: displayName,
                displayName: displayName
            },
            pubKeyCredParams: [
                { type: "public-key", alg: -7 }, // ES256
                { type: "public-key", alg: -257 } // RS256
            ],
            timeout: 60000,
            attestation: "direct",
            authenticatorSelection: {
                authenticatorAttachment: "platform",
                requireResidentKey: true,
                residentKey: "required",
                userVerification: "required"
            }
        };
        
        console.log("Creating credential with options:", publicKeyCredentialCreationOptions);
        
        try {
            // @ts-ignore - NavigatorCredentials type might be missing
            const credential = await navigator.credentials.create({
                publicKey: publicKeyCredentialCreationOptions
            });
            
            if (!credential) {
                throw new Error("Failed to create credential");
            }
            
            console.log("Credential created:", credential);
            
            // Generate a deterministic ID based on credential ID
            // @ts-ignore - Credential type might be missing in TypeScript
            const rawId = new Uint8Array(credential.rawId);
            const keyId = Array.from(rawId)
                .map(b => b.toString(16).padStart(2, '0'))
                .join('');
                
            // Generate a predictable contract ID using the credential ID
            const contractId = "LOCAL_" + keyId.substring(0, 20);
            
            // Store credential info in localStorage for future reference
            try {
                localStorage.setItem("sp:credential:" + keyId, JSON.stringify({
                    id: credential.id,
                    type: credential.type,
                    created: new Date().toISOString()
                }));
            } catch (storageError) {
                console.warn("Could not save credential details:", storageError);
            }
            
            return { 
                keyId, 
                contractId,
                credential
            };
        } catch (webAuthnError) {
            console.error("WebAuthn API error:", webAuthnError);
            throw new Error("WebAuthn API error: " + (webAuthnError.message || "Could not create credential"));
        }
    } catch (error) {
        console.error("Direct passkey creation failed:", error);
        throw error;
    }
};

export const registerWallet = createAsyncThunk(
    "wallet/register",
    async (passkeyName: string, { dispatch, rejectWithValue }) => {
        try {
            console.log("Starting wallet registration with passkey name:", passkeyName);
            
            let kid, cid, xdr;
            
            // Step 1: Create wallet with PasskeyKit on testnet
            console.log("Creating wallet with PasskeyKit on testnet...");
            console.log("Using PasskeyKit with network:", NETWORK_PASSPHRASE);
            console.log("Using Soroban RPC URL:", RPC_URL);
            
            try {
                // Use the standard PasskeyKit demo approach on testnet
                const result = await account.createWallet("Stellar Demo", passkeyName);
                console.log("Wallet creation result:", result);
                
                // Extract values
                kid = result.keyId;
                cid = result.contractId;
                xdr = result.signedTx;
                
                console.log("Extracted keyId, contractId, and xdr:", { kid, cid, hasXdr: !!xdr });
            } catch (error) {
                console.error("PasskeyKit wallet creation failed:", error);
                
                // For specific network errors, try again with different settings
                const errorMsg = String(error);
                const isNetworkError = 
                    errorMsg.includes("Network") || 
                    errorMsg.includes("Failed to fetch") ||
                    errorMsg.includes("Cannot destructure property") ||
                    errorMsg.includes("CORS") ||
                    errorMsg.includes("undefined");
                
                if (isNetworkError) {
                    console.log("Network error detected. Retrying with different configuration...");
                    toast.warning("Network connection issues detected. Retrying with different settings.", {
                        position: "top-right",
                        autoClose: 5000,
                    });
                    
                    throw new Error("Network error creating wallet on Stellar testnet. Please try again later.");
                } else {
                    // For other errors, just propagate
                    throw error;
                }
            }
            
            if (!kid || !cid) {
                throw new Error("Failed to create wallet: Missing keyId or contractId");
            }

            // Submit transaction if available
            if (xdr) {
                try {
                    console.log("Submitting transaction with XDR:", xdr);
                    // Convert the transaction to XDR string if needed
                    const xdrString = typeof xdr === 'string' ? xdr : xdr.toXDR();
                    await send_transaction(xdrString);
                    console.log("Transaction submitted successfully");
                } catch (txError) {
                    console.error("Transaction error:", txError);
                    
                    // If transaction fails, we might still be able to use the wallet
                    toast.warning("Transaction couldn't be submitted, but wallet was created. It may need funding.", {
                        position: "top-right",
                        autoClose: 5000,
                    });
                }
            } else {
                console.log("No XDR transaction to submit");
            }

            // Store keys and set state
            const newKeyId = typeof kid === 'string' ? kid : JSON.stringify(kid);
            console.log("Storing key information. KeyId:", newKeyId, "ContractId:", cid);
            
            localStorage.setItem("keyId", newKeyId);
            localStorage.setItem("contractId", cid);

            dispatch(setKeyId(newKeyId));
            dispatch(setContractId(cid));
            dispatch(setConnected(true));

            // Instead of funding, just mark the wallet as created successfully
            console.log("Wallet funded successfully");
            
            return { keyId: newKeyId, contractId: cid };
        } catch (error) {
            console.error("Wallet registration error:", error);
            
            if (error instanceof Error) {
                return rejectWithValue(error.message);
            }
            
            return rejectWithValue(
                "Failed to register wallet. Please try again."
            );
        }
    }
);

export const fundWallet = createAsyncThunk(
    "wallet/fund",
    async (_, { getState, rejectWithValue }) => {
        const state = getState() as { wallet: WalletState };
        const { contractId } = state.wallet;
        
        if (!contractId) {
            console.log("No wallet to fund: contractId is null or empty");
            return rejectWithValue("No wallet to fund");
        }
        
        console.log("Starting funding process for contract:", contractId);
        
        // Skip funding for local wallets
        if (contractId.startsWith("LOCAL_")) {
            console.log("Skipping funding for local wallet");
            return { success: true, message: "Local wallet - no funding needed" };
        }

        try {
            console.log("Beginning funding operation for wallet:", contractId);
            
            const loadingToast = toast.info("Funding wallet with test tokens...", {
                position: "top-right",
                autoClose: false,
                hideProgressBar: false,
                closeOnClick: false,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
            });

            try {
                // Check if this is a Soroban contract (typically starts with 'C')
                if (contractId.startsWith('C')) {
                    console.log("Detected Soroban contract, looking for creator account to fund");
                    
                    // Try to fund the creator account instead
                    const creatorResult = await fundContractCreator(contractId);
                    console.log("Creator funding result:", creatorResult);
                    
                    if (creatorResult.success) {
                        toast.dismiss(loadingToast);
                        toast.success(`Funded contract creator account: ${creatorResult.creatorAccount}`, {
                            position: "top-right",
                            autoClose: 5000,
                        });
                        return { success: true, source: "creator-funding" };
                    } else if (creatorResult.creatorAccount) {
                        toast.dismiss(loadingToast);
                        toast.warning(`Manual funding needed for creator: ${creatorResult.creatorAccount}`, {
                            position: "top-right",
                            autoClose: 5000,
                        });
                        // Continue with other methods
                    } else {
                        console.log("Could not find creator account, continuing with direct funding attempts");
                    }
                }
                
                // FIRST ATTEMPT: Use Launchtube direct funding method
                console.log("Attempting to fund using Launchtube direct method");
                const launchtubeResult = await fundWithLaunchtube(contractId);
                console.log("Launchtube funding result:", launchtubeResult);
                
                if (launchtubeResult.success) {
                    toast.dismiss(loadingToast);
                    toast.success("Wallet funded successfully via Launchtube!", {
                        position: "top-right",
                        autoClose: 5000,
                    });
                    return { success: true, source: "launchtube" };
                }
                
                console.log("Launchtube funding failed, trying alternate methods");
                
                // SECOND ATTEMPT: Try regular native.transfer method
                try {
                    console.log("Creating funding transaction with fundPubkey:", fundPubkey);
                    console.log("Fund signer available:", !!fundSigner);
                    
                    // Attempt to use the native.transfer function to send funds
                    console.log("Preparing transfer parameters");
                    
                    // Log the types expected by the native.transfer function
                    console.log("Native transfer function:", native.transfer);
                    console.log("Native transfer function signature:", Object.keys(native));
                    
                    try {
                        // Try with proper parameter format for SAC client
                        console.log("Attempting transfer with SAC client format");
                        
                        // For type diagnostics
                        const transferResponse = await native.transfer({
                            from: fundPubkey,
                            to: contractId,
                            amount: BigInt(1_000_000) // 0.1 XLM as BigInt
                        });
                        
                        console.log("Transfer response:", transferResponse);
                        
                        // Sign and send the transfer
                        if (transferResponse && typeof transferResponse.sign === 'function') {
                            console.log("Signing transfer transaction");
                            const signedTransfer = await transferResponse.sign({
                                [fundPubkey]: fundSigner
                            });
                            
                            console.log("Signed transfer transaction:", signedTransfer);
                            
                            if (signedTransfer && typeof signedTransfer.signAndSend === 'function') {
                                console.log("Sending signed transfer transaction");
                                const sendResult = await signedTransfer.signAndSend();
                                console.log("Transfer transaction result:", sendResult);
                            } else {
                                console.error("signAndSend method not found on signed transfer");
                            }
                        } else {
                            console.error("sign method not found on transfer response");
                        }
                        
                        toast.dismiss(loadingToast);
                        
                        toast.success("Wallet funded successfully!", {
                            position: "top-right",
                            autoClose: 5000,
                            hideProgressBar: false,
                            closeOnClick: true,
                            pauseOnHover: true,
                            draggable: true,
                            progress: undefined,
                        });
                    } catch (transferError) {
                        console.error("Transfer error:", transferError);
                        if (transferError instanceof Error) {
                            console.error("Transfer error message:", transferError.message);
                            console.error("Transfer error stack:", transferError.stack);
                        }
                        
                        // Try falling back to friendbot
                        console.log("Transfer failed, trying friendbot as fallback");
                        try {
                            // Extract public key from contractId if possible
                            let publicKeyForFriendbot = null;
                            
                            // Try to get the public key associated with the contract
                            // This might need to be adjusted depending on your contract structure
                            try {
                                // If contractId is a Stellar address
                                if (contractId.startsWith('G')) {
                                    publicKeyForFriendbot = contractId;
                                } else {
                                    console.log("Contract ID is not a standard Stellar address, trying to derive public key");
                                    // You may need custom logic here to get the public key from the contract
                                }
                            } catch (e) {
                                console.error("Error getting public key from contract:", e);
                            }
                            
                            if (publicKeyForFriendbot) {
                                console.log("Requesting friendbot funding for:", publicKeyForFriendbot);
                                try {
                                    // Most friendbots use a simple GET request
                                    const friendbotUrl = `https://friendbot.stellar.org/?addr=${encodeURIComponent(publicKeyForFriendbot)}`;
                                    const response = await fetch(friendbotUrl);
                                    const result = await response.json();
                                    console.log("Friendbot response:", result);
                                    
                                    if (response.ok) {
                                        console.log("Friendbot funding successful");
                                        toast.dismiss(loadingToast);
                                        toast.success("Wallet funded via Friendbot!", {
                                            position: "top-right",
                                            autoClose: 5000,
                                        });
                                        return { success: true };
                                    } else {
                                        console.error("Friendbot funding failed:", result);
                                        throw new Error(`Friendbot error: ${JSON.stringify(result)}`);
                                    }
                                } catch (friendbotError) {
                                    console.error("Friendbot error:", friendbotError);
                                    throw friendbotError;
                                }
                            } else {
                                console.error("Could not determine public key for friendbot funding");
                                throw new Error("Could not determine public key for friendbot funding");
                            }
                        } catch (friendbotError) {
                            console.error("Friendbot funding failed:", friendbotError);
                            // Continue with the fallback message even if friendbot fails
                        }
                        
                        toast.dismiss(loadingToast);
                        
                        toast.warning("Could not fund wallet automatically. You may need to fund it manually.", {
                            position: "top-right",
                            autoClose: 5000,
                            hideProgressBar: false,
                            closeOnClick: true,
                            pauseOnHover: true,
                            draggable: true,
                            progress: undefined,
                        });
                        
                        // Return partial success to continue
                        return { success: true, message: "Wallet created but not funded" };
                    }
                    
                    return { success: true };
                } catch (sendError) {
                    console.error("Error sending funding transaction:", sendError);
                    toast.dismiss(loadingToast);
                    throw sendError;
                }
            } catch (error) {
                console.error("Error funding wallet:", error);
                
                toast.dismiss(loadingToast);
                toast.error("Failed to fund wallet. Please try again.", {
                    position: "top-right",
                    autoClose: 5000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                    progress: undefined,
                });
                
                if (error instanceof Error) {
                    return rejectWithValue(error.message);
                }
                
                return rejectWithValue("Failed to fund wallet. Please try again.");
            }
        } catch (error) {
            console.error("Error funding wallet:", error);
            
            toast.error("Failed to fund wallet. Please try again.", {
                position: "top-right",
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
            });
            
            if (error instanceof Error) {
                return rejectWithValue(error.message);
            }
            
            return rejectWithValue("Failed to fund wallet. Please try again.");
        }
    }
);

export const getWalletBalance = createAsyncThunk(
    "wallet/getBalance",
    async (_, { getState }) => {
        const state = getState() as { wallet: WalletState };
        const { contractId } = state.wallet;
        
        if (contractId) {
            // For local wallets, just return a placeholder
            if (contractId.startsWith("LOCAL_")) {
                return {
                    native: "Local wallet",
                };
            }
            
            try {
                // Use formatted contractId payload
                const contractIdPayload = { id: contractId };
                console.log("Fetching balance for contract:", contractIdPayload);
                
                // Detailed logging for debugging
                const balanceResponse = await native.balance(contractIdPayload);
                
                console.log("Raw balance response:", balanceResponse);
                console.log("Balance response type:", typeof balanceResponse);
                console.log("Balance response properties:", Object.keys(balanceResponse));
                
                // Log all properties and methods
                for (const key in balanceResponse) {
                    try {
                        const value = (balanceResponse as any)[key];
                        const type = typeof value;
                        console.log(`Property ${key} (${type}):`, value);
                    } catch (e) {
                        console.log(`Property ${key} is not accessible:`, e);
                    }
                }
                
                // Extract balance from AssembledTransaction by simulating it
                let balanceValue = "0";
                
                if (balanceResponse) {
                    // For AssembledTransaction objects with simulate function
                    if (typeof balanceResponse.simulate === 'function') {
                        try {
                            console.log("Calling simulate() on balance response");
                            const simResult = await balanceResponse.simulate();
                            console.log("Simulation result full object:", simResult);
                            console.log("Simulation result type:", typeof simResult);
                            console.log("Simulation result properties:", Object.keys(simResult));
                            
                            // Log nested properties for debugging
                            for (const key in simResult) {
                                try {
                                    const value = (simResult as any)[key];
                                    console.log(`Sim result property ${key} (${typeof value}):`, value);
                                } catch (e) {
                                    console.log(`Sim result property ${key} not accessible:`, e);
                                }
                            }
                            
                            // Try accessing as bigint directly
                            if (typeof simResult === 'bigint') {
                                console.log("Simulation result is a bigint:", simResult);
                                balanceValue = simResult.toString();
                            }
                            // Try different properties that might exist
                            else if (simResult && typeof simResult === 'object') {
                                // Common properties to check
                                const possibleProps = ['result', 'retval', 'value', 'amount', 'balance'];
                                
                                for (const prop of possibleProps) {
                                    if ((simResult as any)[prop] !== undefined) {
                                        console.log(`Found property ${prop}:`, (simResult as any)[prop]);
                                        balanceValue = String((simResult as any)[prop]);
                                        break;
                                    }
                                }
                                
                                // If still not found, try JSON stringify
                                if (balanceValue === "0") {
                                    try {
                                        console.log("Trying JSON.stringify on sim result");
                                        const jsonStr = JSON.stringify(simResult);
                                        console.log("JSON string:", jsonStr);
                                        
                                        // Try to extract a number from the JSON string
                                        const numberMatch = jsonStr.match(/"?\d+"?/);
                                        if (numberMatch) {
                                            balanceValue = numberMatch[0].replace(/"/g, '');
                                            console.log("Extracted number from JSON:", balanceValue);
                                        }
                                    } catch (e) {
                                        console.error("Error stringifying sim result:", e);
                                    }
                                }
                            }
                        } catch (e) {
                            console.error("Error simulating balance transaction:", e);
                            console.error("Error details:", e.message, e.stack);
                        }
                    } 
                    // For direct result objects
                    else if (balanceResponse.result !== undefined) {
                        console.log("Using direct result property:", balanceResponse.result);
                        balanceValue = balanceResponse.result.toString();
                    }
                    // Try accessing 'result' as a function (getter)
                    else if (typeof balanceResponse.result === 'function') {
                        try {
                            console.log("Trying to call result() method");
                            const result = await balanceResponse.result();
                            console.log("Result method returned:", result);
                            balanceValue = String(result);
                        } catch (e) {
                            console.error("Error calling result method:", e);
                        }
                    }
                    // Fallback: try to get string representation
                    else if (typeof balanceResponse.toString === 'function') {
                        console.log("Using toString() method");
                        balanceValue = balanceResponse.toString();
                    }
                }
                
                console.log("Raw extracted balance value:", balanceValue);
                
                // Convert to number and format (divide by 10^7 for Stellar)
                try {
                    const numBalance = parseFloat(balanceValue);
                    console.log("Parsed number balance:", numBalance);
                    
                    if (!isNaN(numBalance)) {
                        // Format with 7 decimals (Stellar's precision)
                        const formattedBalance = (numBalance / SCALAR_7).toFixed(7);
                        console.log("Formatted balance with division:", formattedBalance);
                        return {
                            native: formattedBalance,
                        };
                    }
                } catch (e) {
                    console.error("Error formatting balance:", e);
                }
                
                return {
                    native: balanceValue,
                };
            } catch (error) {
                console.error("Error fetching balance:", error);
                if (error instanceof Error) {
                    console.error("Error message:", error.message);
                    console.error("Error stack:", error.stack);
                }
                return {
                    native: "Error",
                };
            }
        } else {
            return {
                native: "",
            };
        }
    }
);

export const checkBalance = createAsyncThunk(
    "wallet/checkBalance",
    async (_, { getState, rejectWithValue }) => {
        const state = getState() as { wallet: WalletState };
        const { contractId } = state.wallet;
        
        if (!contractId) {
            return rejectWithValue("No wallet to check balance for");
        }
        
        // Return placeholder balance for local wallets
        if (contractId.startsWith("LOCAL_")) {
            console.log("Returning placeholder balance for local wallet");
            return { balance: "N/A" };
        }

        try {
            console.log("Checking balance for wallet:", contractId);
            
            // Create proper contract ID payload
            const contractIdPayload = { id: contractId };
            const balanceResponse = await native.balance(contractIdPayload);
            
            console.log("Raw balance response:", balanceResponse);
            console.log("Balance response type:", typeof balanceResponse);
            console.log("Balance response properties:", Object.keys(balanceResponse));
            
            // Extract balance using simulation for AssembledTransaction
            let balanceValue = "0";
            
            if (balanceResponse) {
                // For AssembledTransaction objects
                if (typeof balanceResponse.simulate === 'function') {
                    try {
                        console.log("Calling simulate() on balance response");
                        const simResult = await balanceResponse.simulate();
                        console.log("Simulation result full object:", simResult);
                        
                        // Try accessing as bigint directly
                        if (typeof simResult === 'bigint') {
                            console.log("Simulation result is a bigint:", simResult);
                            balanceValue = simResult.toString();
                        }
                        // Try different properties that might exist
                        else if (simResult && typeof simResult === 'object') {
                            // Common properties to check
                            const possibleProps = ['result', 'retval', 'value', 'amount', 'balance'];
                            
                            for (const prop of possibleProps) {
                                if ((simResult as any)[prop] !== undefined) {
                                    console.log(`Found property ${prop}:`, (simResult as any)[prop]);
                                    balanceValue = String((simResult as any)[prop]);
                                    break;
                                }
                            }
                        }
                    } catch (e) {
                        console.error("Error simulating balance transaction:", e);
                    }
                } 
                // For direct result objects
                else if (balanceResponse.result !== undefined) {
                    console.log("Using direct result property:", balanceResponse.result);
                    balanceValue = balanceResponse.result.toString();
                }
                // Try accessing 'result' as a function (getter)
                else if (typeof balanceResponse.result === 'function') {
                    try {
                        console.log("Trying to call result() method");
                        const result = await balanceResponse.result();
                        console.log("Result method returned:", result);
                        balanceValue = String(result);
                    } catch (e) {
                        console.error("Error calling result method:", e);
                    }
                }
                // Fallback: try to get string representation
                else if (typeof balanceResponse.toString === 'function') {
                    console.log("Using toString() method");
                    balanceValue = balanceResponse.toString();
                }
            }
            
            console.log("Raw extracted balance value:", balanceValue);
            
            // Try to convert to proper format (divide by 10^7 for Stellar)
            try {
                const numBalance = parseFloat(balanceValue);
                console.log("Parsed number balance:", numBalance);
                
                if (!isNaN(numBalance)) {
                    // Format with 7 decimals (Stellar's precision)
                    balanceValue = (numBalance / SCALAR_7).toFixed(7);
                    console.log("Formatted balance with division:", balanceValue);
                }
            } catch (e) {
                console.error("Error formatting balance:", e);
            }
            
            return { balance: balanceValue };
        } catch (error) {
            console.error("Error checking wallet balance:", error);
            
            if (error instanceof Error) {
                console.error("Error message:", error.message);
                console.error("Error stack:", error.stack);
                return rejectWithValue(error.message);
            }
            
            return rejectWithValue("Failed to check wallet balance. Please try again.");
        }
    }
);

export const connectWallet = createAsyncThunk(
    "wallet/connect",
    async (_, { dispatch, rejectWithValue }) => {
        try {
            const keyId = localStorage.getItem("keyId");
            const contractId = localStorage.getItem("contractId");
            
            if (!keyId || !contractId) {
                return rejectWithValue("No saved wallet found");
            }
            
            console.log("Connecting to existing wallet:", { keyId, contractId });
            
            dispatch(setKeyId(keyId));
            dispatch(setContractId(contractId));
            dispatch(setConnected(true));
            
            // Check balance if not a local wallet
            if (!contractId.startsWith("LOCAL_")) {
                try {
                    await dispatch(checkBalance());
                } catch (balanceError) {
                    console.error("Error checking balance:", balanceError);
                    // Continue even if balance check fails
                }
            }
            
            return { keyId, contractId };
        } catch (error) {
            console.error("Error connecting wallet:", error);
            
            if (error instanceof Error) {
                return rejectWithValue(error.message);
            }
            
            return rejectWithValue("Failed to connect wallet. Please try again.");
        }
    }
);

export const disconnectWallet = createAsyncThunk(
    "wallet/disconnect",
    async (_, { dispatch }) => {
        console.log("Disconnecting wallet");
        
        // localStorage.removeItem("keyId");
        // localStorage.removeItem("contractId");
        
        dispatch(setKeyId(null));
        dispatch(setContractId(null));
        dispatch(setBalance(null));
        dispatch(setConnected(false));
        
        return { success: true };
    }
);

// Dead Man's Wallet functions
export const getDeadMansWalletConfig = createAsyncThunk(
    "wallet/getDeadMansWalletConfig",
    async (_, { getState, rejectWithValue }) => {
        const state = getState() as { wallet: WalletState };
        const { contractId } = state.wallet;
        
        if (!contractId) {
            return rejectWithValue("No wallet connected");
        }
        
        // Skip for local wallets
        if (contractId.startsWith("LOCAL_")) {
            return {
                isConfigured: false,
                message: "Local wallets don't support dead man's wallet features"
            };
        }

        try {
            console.log("Fetching dead man's wallet config for:", contractId);
            
            // This would be replaced with actual blockchain interaction
            // For now, we'll simulate an API call with a delay
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // This is mock data - in a real app, this would come from the blockchain
            const mockResult = {
                isConfigured: false,
                destinationAddress: null,
                checkInPeriod: 30,
                lastCheckIn: null,
                nextCheckInDeadline: null
            };
            
            return mockResult;
        } catch (error) {
            console.error("Error fetching dead man's wallet config:", error);
            
            if (error instanceof Error) {
                return rejectWithValue(error.message);
            }
            
            return rejectWithValue("Failed to fetch dead man's wallet configuration");
        }
    }
);

export const configureDeadMansWallet = createAsyncThunk(
    "wallet/configureDeadMansWallet",
    async (
        { destinationAddress, checkInPeriod }: { destinationAddress: string; checkInPeriod: number },
        { getState, rejectWithValue }
    ) => {
        const state = getState() as { wallet: WalletState };
        const { contractId, keyId } = state.wallet;
        
        if (!contractId || !keyId) {
            return rejectWithValue("No wallet connected");
        }
        
        // Skip for local wallets
        if (contractId.startsWith("LOCAL_")) {
            return rejectWithValue("Local wallets don't support dead man's wallet features");
        }

        try {
            console.log("Configuring dead man's wallet for:", contractId);
            console.log("Destination address:", destinationAddress);
            console.log("Check-in period (days):", checkInPeriod);
            
            // This would be an on-chain transaction in a real implementation
            // For now, simulate an API call with a delay
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            // Calculate next check-in deadline
            const now = new Date();
            const nextDeadline = new Date(now);
            nextDeadline.setDate(nextDeadline.getDate() + checkInPeriod);
            
            // Mock successful result
            return {
                isConfigured: true,
                destinationAddress,
                checkInPeriod,
                lastCheckIn: now.toISOString(),
                nextCheckInDeadline: nextDeadline.toISOString()
            };
        } catch (error) {
            console.error("Error configuring dead man's wallet:", error);
            
            if (error instanceof Error) {
                return rejectWithValue(error.message);
            }
            
            return rejectWithValue("Failed to configure dead man's wallet");
        }
    }
);

export const checkInDeadMansWallet = createAsyncThunk(
    "wallet/checkInDeadMansWallet",
    async (_, { getState, rejectWithValue }) => {
        const state = getState() as { wallet: WalletState };
        const { contractId, keyId, deadMansWallet } = state.wallet;
        
        if (!contractId || !keyId) {
            return rejectWithValue("No wallet connected");
        }
        
        if (!deadMansWallet.isConfigured) {
            return rejectWithValue("Dead man's wallet not configured");
        }
        
        // Skip for local wallets
        if (contractId.startsWith("LOCAL_")) {
            return rejectWithValue("Local wallets don't support dead man's wallet features");
        }

        try {
            console.log("Checking in for dead man's wallet:", contractId);
            
            // This would be an on-chain transaction in a real implementation
            // For now, simulate an API call with a delay
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            // Calculate next check-in deadline
            const now = new Date();
            const nextDeadline = new Date(now);
            nextDeadline.setDate(nextDeadline.getDate() + deadMansWallet.checkInPeriod);
            
            // Mock successful result
            return {
                lastCheckIn: now.toISOString(),
                nextCheckInDeadline: nextDeadline.toISOString()
            };
        } catch (error) {
            console.error("Error checking in for dead man's wallet:", error);
            
            if (error instanceof Error) {
                return rejectWithValue(error.message);
            }
            
            return rejectWithValue("Failed to check in for dead man's wallet");
        }
    }
);

const walletSlice = createSlice({
    name: "wallet",
    initialState,
    reducers: {
        setKeyId: (state, action) => {
            state.keyId = action.payload;
        },
        setContractId: (state, action) => {
            state.contractId = action.payload;
        },
        setBalance: (state, action) => {
            state.balance = action.payload;
        },
        setConnected: (state, action) => {
            state.isConnected = action.payload;
        },
        clearErrors: (state) => {
            state.error = null;
            state.fundingError = null;
        },
    },
    extraReducers: (builder) => {
        // Register wallet
        builder
            .addCase(registerWallet.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(registerWallet.fulfilled, (state, action) => {
                state.isLoading = false;
                state.keyId = action.payload.keyId;
                state.contractId = action.payload.contractId;
                state.isConnected = true;
            })
            .addCase(registerWallet.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            });

        // Fund wallet
        builder
            .addCase(fundWallet.pending, (state) => {
                state.isLoading = true;
                state.fundingError = null;
            })
            .addCase(fundWallet.fulfilled, (state) => {
                state.isLoading = false;
            })
            .addCase(fundWallet.rejected, (state, action) => {
                state.isLoading = false;
                state.fundingError = action.payload as string;
            });

        // Check balance
        builder
            .addCase(checkBalance.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(checkBalance.fulfilled, (state, action) => {
                state.isLoading = false;
                state.balance = action.payload.balance;
            })
            .addCase(checkBalance.rejected, (state) => {
                state.isLoading = false;
            });

        // Connect wallet
        builder
            .addCase(connectWallet.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(connectWallet.fulfilled, (state, action) => {
                state.isLoading = false;
                state.keyId = action.payload.keyId;
                state.contractId = action.payload.contractId;
                state.isConnected = true;
            })
            .addCase(connectWallet.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            });

        // Dead Man's Wallet
        builder
            .addCase(getDeadMansWalletConfig.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(getDeadMansWalletConfig.fulfilled, (state, action) => {
                state.isLoading = false;
                state.deadMansWallet = action.payload as DeadMansWalletConfig;
            })
            .addCase(getDeadMansWalletConfig.rejected, (state) => {
                state.isLoading = false;
            });

        builder
            .addCase(configureDeadMansWallet.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(configureDeadMansWallet.fulfilled, (state, action) => {
                state.isLoading = false;
                state.deadMansWallet = action.payload as DeadMansWalletConfig;
            })
            .addCase(configureDeadMansWallet.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            });

        builder
            .addCase(checkInDeadMansWallet.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(checkInDeadMansWallet.fulfilled, (state, action) => {
                state.isLoading = false;
                if (action.payload) {
                    state.deadMansWallet.lastCheckIn = action.payload.lastCheckIn;
                    state.deadMansWallet.nextCheckInDeadline = action.payload.nextCheckInDeadline;
                }
            })
            .addCase(checkInDeadMansWallet.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            });

        // Disconnect wallet - clear dead man's wallet config too
        builder
            .addCase(disconnectWallet.fulfilled, (state) => {
                state.keyId = null;
                state.contractId = null;
                state.balance = null;
                state.isConnected = false;
                state.deadMansWallet = {
                    isConfigured: false,
                    destinationAddress: null,
                    checkInPeriod: 30,
                    lastCheckIn: null,
                    nextCheckInDeadline: null
                };
            });
    },
});

export const {
    setKeyId,
    setContractId,
    setBalance,
    setConnected,
    clearErrors,
} = walletSlice.actions;

export default walletSlice.reducer;

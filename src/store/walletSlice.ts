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
    createLocalPasskey
} from "../lib/passkey";
import { toast } from "react-toastify";

export interface WalletState {
    keyId: string | null;
    contractId: string | null;
    balance: string | null;
    isConnected: boolean;
    isLoading: boolean;
    error: string | null;
    fundingError: string | null;
}

const initialState: WalletState = {
    keyId: localStorage.getItem("keyId"),
    contractId: localStorage.getItem("contractId"),
    balance: null,
    isConnected: !!localStorage.getItem("keyId"),
    isLoading: false,
    error: null,
    fundingError: null,
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
            
            // Check if we should force local wallet creation
            if (FORCE_LOCAL_WALLET) {
                console.log("FORCE_LOCAL_WALLET is enabled, creating local wallet directly");
                try {
                    const result = await createLocalPasskey("Stellar Wallet", passkeyName);
                    console.log("Local passkey creation succeeded:", result);
                    
                    kid = result.keyId;
                    cid = result.contractId;
                    // No XDR in local mode
                } catch (error) {
                    console.error("Local passkey creation failed:", error);
                    throw error;
                }
            } else {
                // Step 1: Create wallet with PasskeyKit
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
                    xdr = result.xdr;
                    
                    console.log("Extracted keyId, contractId, and xdr:", { kid, cid, hasXdr: !!xdr });
                } catch (error) {
                    console.error("PasskeyKit wallet creation failed:", error);
                    
                    // For specific network errors, try local wallet as fallback
                    const errorMsg = String(error);
                    const isNetworkError = 
                        errorMsg.includes("Network") || 
                        errorMsg.includes("Failed to fetch") ||
                        errorMsg.includes("Cannot destructure property 'length'") ||
                        errorMsg.includes("CORS");
                    
                    if (isNetworkError) {
                        console.log("Network error detected. Using local wallet as fallback");
                        toast.warning("Network connection issues detected. Creating a local wallet instead.", {
                            position: "top-right",
                            autoClose: 5000,
                        });
                        
                        try {
                            const fallbackResult = await createLocalPasskey("Stellar Demo", passkeyName);
                            console.log("Fallback passkey creation succeeded:", fallbackResult);
                            
                            kid = fallbackResult.keyId;
                            cid = fallbackResult.contractId;
                            // No XDR in fallback mode
                        } catch (fallbackError) {
                            console.error("Fallback passkey creation also failed:", fallbackError);
                            throw fallbackError;
                        }
                    } else {
                        // For other errors, just propagate
                        throw error;
                    }
                }
            }
            
            if (!kid || !cid) {
                throw new Error("Failed to create wallet: Missing keyId or contractId");
            }

            // Submit transaction if available
            if (xdr) {
                try {
                    console.log("Submitting transaction with XDR:", xdr);
                    await send_transaction(xdr);
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
                console.log("No XDR transaction to submit (local wallet)");
            }

            // Store keys and set state
            const newKeyId = typeof kid === 'string' ? kid : JSON.stringify(kid);
            console.log("Storing key information. KeyId:", newKeyId, "ContractId:", cid);
            
            localStorage.setItem("keyId", newKeyId);
            localStorage.setItem("contractId", cid);

            dispatch(setKeyId(newKeyId));
            dispatch(setContractId(cid));
            dispatch(setConnected(true));

            // Fund wallet if it's not a local wallet
            if (!cid.startsWith("LOCAL_")) {
                try {
                    console.log("Funding wallet...");
                    await dispatch(fundWallet());
                    console.log("Wallet funded successfully");
                } catch (fundError) {
                    console.error("Funding error:", fundError);
                    // Continue even if funding fails
                    toast.warning("Could not fund wallet automatically. Your wallet may have zero balance.", {
                        position: "top-right",
                        autoClose: 5000,
                    });
                }
            } else {
                console.log("Skipping funding for local wallet:", cid);
            }
            
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
            return rejectWithValue("No wallet to fund");
        }
        
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

            const tx = await native.transfer(
                fundPubkey, 
                fundSigner, 
                contractId, 
                "10000000"
            );
            
            console.log("Funding transaction created:", tx);
            
            try {
                // Submit the transaction with retry logic
                const result = await send_transaction(tx);
                console.log("Funding transaction submitted:", result);
                
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
                
                return { success: true };
            } catch (sendError) {
                console.error("Error sending funding transaction:", sendError);
                toast.dismiss(loadingToast);
                throw sendError;
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
            const nativeBalance = await native.balance({ id: contractId });
            return {
                native: nativeBalance.result.toString(),
            };
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
            
            const balance = await native.balance(contractId);
            console.log("Wallet balance:", balance);
            
            return { balance };
        } catch (error) {
            console.error("Error checking wallet balance:", error);
            
            if (error instanceof Error) {
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
        
        localStorage.removeItem("keyId");
        localStorage.removeItem("contractId");
        
        dispatch(setKeyId(null));
        dispatch(setContractId(null));
        dispatch(setBalance(null));
        dispatch(setConnected(false));
        
        return { success: true };
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

        // Disconnect wallet
        builder
            .addCase(disconnectWallet.fulfilled, (state) => {
                state.keyId = null;
                state.contractId = null;
                state.balance = null;
                state.isConnected = false;
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

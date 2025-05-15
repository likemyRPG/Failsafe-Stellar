import { PasskeyKit, SACClient } from "passkey-kit";
import { Account, Keypair, StrKey } from "@stellar/stellar-sdk";
import { Buffer } from "buffer";
import { toast } from "react-toastify";
import { Server } from "@stellar/stellar-sdk/lib/rpc";

// Configuration constants
export const NETWORK_PASSPHRASE = "Test SDF Network ; September 2015";
export const RPC_URL = "https://soroban-testnet.stellar.org";
export const FORCE_LOCAL_WALLET = false;

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

// Create RPC client with retry logic
const createRpcClient = () => {
    try {
        console.log(`Connecting to RPC at ${RPC_URL}`);
        return new Server(RPC_URL, { allowHttp: true });
    } catch (error) {
        console.error(`Failed to connect to RPC at ${RPC_URL}:`, error);
        console.warn("Using fallback RPC configuration");
        return new Server(RPC_URL, { allowHttp: true });
    }
};

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

// Initialize PasskeyKit with minimal configuration (similar to the demo)
export const account = new PasskeyKit({
    rpcUrl: RPC_URL,
    networkPassphrase: NETWORK_PASSPHRASE,
    timeoutInSeconds: 120
});

export const sac = new SACClient({
    rpcUrl: RPC_URL,
    networkPassphrase: NETWORK_PASSPHRASE,
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

    const data = new FormData();
    const jwt =
        "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxYzUxMDdmZjU4MzM4MDFkMDBmNmZhMjI3NzAzODY0NzNhMjY1ZmM5ZDhlZTVjMGYwN2U0NGIzYTRmNzAzMjU5IiwiZXhwIjoxNzMwNTQzNjQ5LCJjcmVkaXRzIjoxMDAwMDAwMDAwLCJpYXQiOjE3MjMyODYwNDl9.GwJfFIQ9q8m0qYusqHZQCNhJGf7ktB3o18Oq5Q3u9hI";

    data.set("xdr", xdr);
    data.set("fee", fee.toString());

    let lastError;
    // Implement retry logic
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            console.log(`Transaction attempt ${attempt}/${maxRetries}`);
            const response = await fetch("https://testnet.launchtube.xyz", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${jwt}`,
                },
                body: data,
            });

            if (response.ok) {
                const result = await response.json();

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
            } else {
                const errorData = await response.json();
                lastError = errorData;
                // Only retry for specific error types that might be temporary
                if (response.status >= 500 || response.status === 429) {
                    // Wait before retry (exponential backoff)
                    await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
                    continue;
                }
                throw errorData;
            }
        } catch (error) {
            lastError = error;
            // Wait before retry
            if (attempt < maxRetries) {
                await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
            }
        }
    }

    console.error("Transaction failed after retries:", lastError);

    // Show error notification
    toast.error("Transaction failed. Please try again.", {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
    });

    throw lastError || new Error("Transaction failed after maximum retries");
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
        
        // Create credential options following PasskeyKit demo patterns
        const credentialOptions = {
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
            attestation: "direct",
            authenticatorSelection: {
                authenticatorAttachment: "platform",
                requireResidentKey: true,
                residentKey: "required",
                userVerification: "required"
            }
        };
        
        // Create the credential
        const credential = await navigator.credentials.create({
            publicKey: credentialOptions
        }) as PublicKeyCredential;
        
        // Extract information for creating a local wallet
        const keyId = credential.id;
        const contractId = `LOCAL_${keyId.substring(0, 20)}`;
        
        console.log("Local passkey created successfully:", { 
            keyId, 
            contractId
        });
        
        return { 
            keyId, 
            contractId, 
            credential 
        };
    } catch (error) {
        console.error("Error creating local passkey:", error);
        throw error;
    }
}

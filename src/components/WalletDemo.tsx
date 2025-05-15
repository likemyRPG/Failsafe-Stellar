'use client'
import React, { useState, useCallback, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../store/store";
import {
    connectWallet,
    checkBalance,
    registerWallet,
    disconnectWallet,
    WalletState,
    clearErrors
} from "../store/walletSlice";
import { Spinner } from "@heroui/react";
import ConnectedWallet from "./ConnectedWallet";
import { ConnectView } from "./ConnectView";
import { InitialView } from "./InitialView";
import { RegisterView } from "./RegisterView";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { CardContainer, GradientText, StyledPaper } from "./StyledComponents";
import { toast } from "react-toastify";

type ViewState = "initial" | "connect" | "register";

const WalletDemo: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { isConnected, isLoading, error } = useSelector<
        RootState,
        WalletState
    >((state: RootState) => state.wallet);
    const [passkeyName, setPasskeyName] = useState<string>("");
    const [viewState, setViewState] = useState<ViewState>("initial");

    useEffect(() => {
        // Auto-connect from localStorage on initial load
        if (localStorage.getItem("keyId") && localStorage.getItem("contractId")) {
            dispatch(connectWallet());
        }
    }, [dispatch]);

    useEffect(() => {
        if (isConnected) {
            dispatch(checkBalance());
            setViewState("initial");
        }
    }, [isConnected, dispatch]);

    const handleConnect = useCallback(
        async (type: "signin" | "register") => {
            try {
                // Clear any previous errors
                dispatch(clearErrors());
                
                if (type === "register") {
                    if (!passkeyName) {
                        toast.error("Please enter a name for your passkey", {
                            position: "top-right",
                            hideProgressBar: false,
                        });
                        return;
                    }
                    
                    // Show toast notification for local wallet creation
                    toast.info("Creating local wallet - no blockchain connection needed", {
                        position: "top-right",
                        autoClose: 5000,
                    });
                    
                    await dispatch(registerWallet(passkeyName)).unwrap();
                } else {
                    await dispatch(connectWallet()).unwrap();
                }
            } catch (error) {
                console.error("Failed to connect:", error);
                
                // Show more user-friendly error for common WebAuthn errors
                if (error instanceof Error) {
                    if (error.name === "NotAllowedError") {
                        toast.error("Authentication was cancelled or timed out. Please try again.");
                    } else if (error.name === "NotSupportedError") {
                        toast.error("Your browser doesn't support WebAuthn/passkeys. Please use a modern browser like Chrome, Edge, or Safari.");
                    } else {
                        toast.error(`Connection error: ${error.message}`);
                    }
                } else if (typeof error === 'string') {
                    toast.error(error);
                } else {
                    toast.error("Failed to connect. Please try again.");
                }
            }
        },
        [passkeyName, dispatch]
    );

    const handleDisconnect = useCallback(() => {
        dispatch(disconnectWallet());
    }, [dispatch]);

    const renderContent = (): React.ReactNode => {
        if (isLoading && !isConnected) {
            return (
                <div className="flex flex-col justify-center items-center py-10">
                    <Spinner color="primary" size="lg" className="mb-3" />
                    <p className="text-foreground-600 dark:text-gray-400">Connecting to wallet...</p>
                </div>
            );
        }

        switch (viewState) {
            case "initial":
                if (isConnected) {
                    return <ConnectedWallet />;
                }
                return (
                    <InitialView
                        onConnectClick={() => setViewState("connect")}
                    />
                );
            case "connect":
                return (
                    <ConnectView
                        loading={isLoading}
                        onBackClick={() => setViewState("initial")}
                        onNewWalletClick={() => setViewState("register")}
                        onSignInClick={() => handleConnect("signin")}
                    />
                );
            case "register":
                return (
                    <RegisterView
                        loading={isLoading}
                        passkeyName={passkeyName}
                        onPasskeyNameChange={(
                            e: React.ChangeEvent<HTMLInputElement>
                        ) => setPasskeyName(e.target.value)}
                        onBackClick={() => setViewState("connect")}
                        onRegisterClick={() => handleConnect("register")}
                    />
                );
        }
    };

    return (
        <div className="min-h-screen px-4">
            <div className="fixed top-0 left-0 w-full z-10 bg-white/70 dark:bg-gray-900/70 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800">
                <div className="container mx-auto px-4 py-3 flex justify-center items-center">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-md flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                        </div>
                        <h1 className="text-xl font-bold">
                            <GradientText>Dead Man's Wallet</GradientText>
                        </h1>
                    </div>
                </div>
            </div>
            
            <div className="flex flex-col justify-center pt-20 pb-10">
                <div className="mb-4 text-center">
                    <p className="text-foreground-600 dark:text-gray-400 max-w-md mx-auto text-sm">
                        A secure dead man's switch for your Stellar assets - ensuring your funds reach the right people in case of inactivity
                    </p>
                </div>
                
                <ToastContainer theme="dark" position="bottom-right" />
                
                <CardContainer className="mx-auto max-w-[440px]">
                    {renderContent()}
                    
                    {error && (
                        <div className="mt-3 text-danger-500 dark:text-red-400 text-center p-2 px-3 bg-danger-50 dark:bg-red-900/20 rounded-lg border border-danger-200 dark:border-red-900/30 text-sm">
                            {error}
                        </div>
                    )}
                </CardContainer>
                
                <div className="mt-8 text-center text-xs text-foreground-500 dark:text-gray-500">
                    Powered by Stellar Blockchain • Testnet Version
                </div>
            </div>
        </div>
    );
};

export default WalletDemo;

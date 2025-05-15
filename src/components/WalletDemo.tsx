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
import { StyledPaper } from "./StyledComponents";

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
                        alert("Please enter a name for your passkey.");
                        return;
                    }
                    await dispatch(registerWallet(passkeyName)).unwrap();
                } else {
                    await dispatch(connectWallet()).unwrap();
                }
            } catch (error) {
                console.error("Failed to connect:", error);
                
                // More specific error handling based on error message
                if (error instanceof Error) {
                    alert(`Connection error: ${error.message}`);
                } else if (typeof error === 'string') {
                    alert(error);
                } else {
                    alert("Failed to connect. Please try again.");
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
                <div className="flex justify-center items-center h-full min-h-[200px]">
                    <Spinner />
                    <p className="ml-2">Connecting...</p>
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
        <div className="h-screen flex items-center justify-center">
            <ToastContainer />
            <StyledPaper>
                {renderContent()}
                {error && (
                    <div className="mt-4 text-danger text-center">
                        {error}
                    </div>
                )}
            </StyledPaper>
        </div>
    );
};

export default WalletDemo;

import React from "react";
import { ActionButton, SecondaryButton, BackButton } from "./StyledComponents";

interface ConnectViewProps {
    loading: boolean;
    onBackClick: () => void;
    onNewWalletClick: () => void;
    onSignInClick: () => void;
}

export const ConnectView: React.FC<ConnectViewProps> = ({
    loading,
    onBackClick,
    onNewWalletClick,
    onSignInClick,
}) => (
    <div className="w-full">
        <div className="flex flex-col gap-4">
            <BackButton
                onClick={onBackClick}
            >
                Back
            </BackButton>
            <h2 className="text-xl font-semibold my-2 text-center">
                Connect Wallet
            </h2>
            <ActionButton
                onClick={onNewWalletClick}
                isDisabled={loading}
                fullWidth
            >
                New Wallet
            </ActionButton>
            <SecondaryButton
                onClick={onSignInClick}
                isDisabled={loading}
                fullWidth
            >
                {loading ? "Loading..." : "Sign In"}
            </SecondaryButton>
        </div>
    </div>
);

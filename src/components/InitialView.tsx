import React from "react";
import { Divider } from "@heroui/react";
import { ActionButton } from "./StyledComponents";

interface InitialViewProps {
    onConnectClick: () => void;
}

export const InitialView: React.FC<InitialViewProps> = ({
    onConnectClick,
}) => (
    <div className="w-full">
        <h1 className="text-xl font-semibold mb-2">
            Smart Wallets in React
        </h1>
        <Divider className="mb-4 bg-white/30" />
        <p className="mb-4 text-sm opacity-70">
            Connect your wallet to explore the features of our demo
            application.
        </p>
        <ActionButton
            onClick={onConnectClick}
            fullWidth
        >
            Connect Wallet
        </ActionButton>
    </div>
);

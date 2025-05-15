import React from "react";
import { Card } from "@heroui/react";
import { BackButton, StyledTextField, ActionButton } from "./StyledComponents";

interface RegisterViewProps {
    loading: boolean;
    passkeyName: string;
    onPasskeyNameChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
    onBackClick: () => void;
    onRegisterClick: () => void;
}

export const RegisterView: React.FC<RegisterViewProps> = ({
    loading,
    passkeyName,
    onPasskeyNameChange,
    onBackClick,
    onRegisterClick,
}) => (
    <div className="w-full">
        <BackButton
            onClick={onBackClick}
        >
            Back
        </BackButton>
        <h2
            className="text-xl font-semibold my-4 text-center"
        >
            Register Wallet
        </h2>
        <StyledTextField
            value={passkeyName}
            onChange={onPasskeyNameChange}
            placeholder="Enter passkey name"
            fullWidth
        />
        <ActionButton
            onClick={onRegisterClick}
            isDisabled={loading}
            fullWidth
        >
            {loading ? "Loading..." : "Register"}
        </ActionButton>
    </div>
);

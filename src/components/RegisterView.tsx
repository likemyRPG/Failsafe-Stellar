import React from "react";
import { Button, Input } from "@heroui/react";

type RegisterViewProps = {
  loading: boolean;
  passkeyName: string;
  onPasskeyNameChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBackClick: () => void;
  onRegisterClick: () => void;
};

export const RegisterView: React.FC<RegisterViewProps> = ({
  loading,
  passkeyName,
  onPasskeyNameChange,
  onBackClick,
  onRegisterClick,
}) => {
  return (
    <div className="flex flex-col space-y-6">
      <div className="text-center">
        <h1 className="text-xl font-bold mb-2">Create New Wallet</h1>
        <p className="text-default-500 text-sm">
          Set up a new wallet with passkey authentication
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-sm block mb-1">
            Give your wallet a name:
          </label>
          <Input
            type="text"
            placeholder="Enter wallet name"
            value={passkeyName}
            onChange={onPasskeyNameChange}
            isDisabled={loading}
            isClearable
            className="w-full"
          />
          <p className="text-xs text-default-500 mt-1">
            This name will help you identify this wallet in your passkey manager
          </p>
        </div>

        <Button
          color="primary"
          className="w-full mt-4"
          onClick={onRegisterClick}
          isLoading={loading}
          isDisabled={loading || !passkeyName.trim()}
        >
          Create Wallet
        </Button>
      </div>

      <div className="pt-2">
        <Button
          variant="light"
          className="w-full"
          onClick={onBackClick}
          isDisabled={loading}
        >
          Go back
        </Button>
      </div>
    </div>
  );
};

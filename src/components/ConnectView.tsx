import React from "react";
import { Button, Divider } from "@heroui/react";

type ConnectViewProps = {
  loading: boolean;
  onSignInClick: () => void;
  onNewWalletClick: () => void;
  onBackClick: () => void;
};

export const ConnectView: React.FC<ConnectViewProps> = ({
  loading,
  onSignInClick,
  onNewWalletClick,
  onBackClick,
}) => {
  return (
    <div className="flex flex-col space-y-6">
      <div className="text-center">
        <h1 className="text-xl font-bold mb-2">Access Your Dead Man's Wallet</h1>
        <p className="text-default-500 text-sm">
          Choose how you want to continue
        </p>
      </div>

      <div className="space-y-4">
        <Button
          color="primary"
          className="w-full"
          onClick={onSignInClick}
          isLoading={loading}
          isDisabled={loading}
        >
          Sign in with existing wallet
        </Button>

        <div className="flex items-center gap-4 px-2 py-2">
          <Divider className="flex-1" />
          <span className="text-sm text-default-500">or</span>
          <Divider className="flex-1" />
        </div>

        <Button
          color="secondary"
          variant="flat"
          className="w-full"
          onClick={onNewWalletClick}
          isDisabled={loading}
        >
          Create new wallet
        </Button>
      </div>

      <div className="pt-4">
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

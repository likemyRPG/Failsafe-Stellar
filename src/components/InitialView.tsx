import React from "react";
import { Button } from "@heroui/react";

type InitialViewProps = {
  onConnectClick: () => void;
};

export const InitialView: React.FC<InitialViewProps> = ({ onConnectClick }) => {
  return (
    <div className="flex flex-col space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold">Dead Man's Wallet</h1>
        <p className="text-default-500">
          A secure way to ensure your crypto assets reach your beneficiaries
        </p>
      </div>

      <div className="space-y-4">
        <div className="p-4 bg-default-50 rounded-lg">
          <h2 className="font-medium mb-2">How it works:</h2>
          <ol className="space-y-2 list-decimal list-inside text-sm">
            <li>Connect your Stellar wallet</li>
            <li>Set a designated beneficiary address</li>
            <li>Choose your check-in period (e.g., 30 days)</li>
            <li>Check in regularly to verify you're still in control</li>
            <li>If you miss a check-in, funds are sent to your beneficiary</li>
          </ol>
        </div>

        <div className="p-4 bg-primary-50 text-primary-700 rounded-lg">
          <h2 className="font-medium mb-2">Perfect for:</h2>
          <ul className="space-y-1 list-disc list-inside text-sm">
            <li>Estate planning for crypto assets</li>
            <li>Ensuring loved ones can access your funds</li>
            <li>Protection against lost access or unexpected events</li>
          </ul>
        </div>
      </div>

      <Button
        color="primary"
        variant="solid"
        className="w-full"
        onClick={onConnectClick}
      >
        Get Started
      </Button>
    </div>
  );
};

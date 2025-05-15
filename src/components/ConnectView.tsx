import React from "react";
import { Divider } from "@heroui/react";
import { ActionButton, BackButton, SecondaryButton } from "./StyledComponents";

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
    <div className="flex flex-col w-full gap-3">
      <BackButton onClick={onBackClick} isDisabled={loading} className="mb-1">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Back
      </BackButton>
      
      <div className="relative flex justify-center items-center py-4">
        <div className="relative">
          <div className="w-14 h-14 rounded-xl flex items-center justify-center bg-gray-900 dark:bg-gray-800">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          </div>
        </div>
        
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-700 to-transparent opacity-70"></div>
      </div>
      
      <p className="text-center text-sm text-gray-600 dark:text-gray-400 mb-2">
        Choose how you want to access your wallet
      </p>

      <div className="space-y-3">
        <ActionButton
          className="w-full justify-center text-sm h-10"
          onClick={onSignInClick}
          isLoading={loading}
          isDisabled={loading}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
          </svg>
          Sign in with existing wallet
        </ActionButton>

        <div className="flex items-center gap-2 py-1">
          <Divider className="flex-1 bg-gray-200 dark:bg-gray-700/60" />
          <span className="text-xs text-gray-500 dark:text-gray-400">or</span>
          <Divider className="flex-1 bg-gray-200 dark:bg-gray-700/60" />
        </div>

        <SecondaryButton
          className="w-full justify-center text-sm h-10"
          onClick={onNewWalletClick}
          isDisabled={loading}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Create new wallet
        </SecondaryButton>
      </div>
    </div>
  );
};

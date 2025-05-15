import React from "react";
import { ActionButton, BackButton, InfoBox, StyledTextField } from "./StyledComponents";

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
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
        </div>
        
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-700 to-transparent opacity-70"></div>
      </div>
      
      <InfoBox 
        color="primary" 
        icon={
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        }
      >
        Your wallet will be secured with passkeys - a more secure alternative to passwords. No recovery phrase needed.
      </InfoBox>

      <div className="mt-1">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 block">
          Wallet Name
        </label>
        <StyledTextField
          type="text"
          placeholder="Enter a name for your wallet"
          value={passkeyName}
          onChange={onPasskeyNameChange}
          isDisabled={loading}
          isClearable
          className="w-full"
          startContent={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          }
        />
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">
          This name will identify your wallet in your passkey manager
        </p>
      </div>

      <ActionButton
        className="w-full justify-center mt-3 text-sm h-10"
        onClick={onRegisterClick}
        isLoading={loading}
        isDisabled={loading || !passkeyName.trim()}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        Create Secure Wallet
      </ActionButton>
    </div>
  );
};

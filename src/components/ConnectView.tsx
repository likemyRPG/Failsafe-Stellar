import React from "react";
import { Divider } from "@heroui/react";
import { ActionButton, BackButton, DecoratedHeader, FloatingIcon, GradientText, HoverCard, SecondaryButton } from "./StyledComponents";

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
    <div className="flex flex-col w-full gap-5">
      <BackButton onClick={onBackClick} isDisabled={loading} className="mb-1">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Back
      </BackButton>
      
      <div className="relative flex justify-center items-center py-5">
        <FloatingIcon>
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center btn-gradient shadow-glow">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            </div>
            <div className="absolute -bottom-2 -right-2 w-6 h-6 rounded-full bg-white dark:bg-[var(--card-background)] shadow-md flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
          </div>
        </FloatingIcon>
      </div>
      
      <div className="text-center mb-1">
        <DecoratedHeader className="text-xl mb-2">Wallet Access</DecoratedHeader>
        <p className="text-gray-600 dark:text-gray-300 text-sm">
          Choose how you want to access your <GradientText>Stellar wallet</GradientText>
        </p>
      </div>

      <div className="space-y-4">
        <HoverCard className="p-4">
          <ActionButton
            className="w-full justify-center text-sm h-11 gap-3"
            onClick={onSignInClick}
            isLoading={loading}
            isDisabled={loading}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
            Sign in with existing wallet
          </ActionButton>
        </HoverCard>

        <div className="flex items-center gap-2 py-1">
          <Divider className="flex-1 bg-gray-200 dark:bg-[var(--border-color)]/60" />
          <span className="text-xs text-gray-500 dark:text-gray-300 px-2">or</span>
          <Divider className="flex-1 bg-gray-200 dark:bg-[var(--border-color)]/60" />
        </div>

        <HoverCard className="p-4">
          <SecondaryButton
            className="w-full justify-center text-sm h-11 gap-3"
            onClick={onNewWalletClick}
            isDisabled={loading}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Create new wallet
          </SecondaryButton>
        </HoverCard>
      </div>
    </div>
  );
};

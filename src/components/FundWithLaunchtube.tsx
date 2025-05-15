import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fundWithLaunchtube } from '../lib/passkey';
import { toast } from 'react-toastify';
import { WalletState, checkBalance } from '../store/walletSlice';
import { ActionButton } from './StyledComponents';

interface AppState {
  wallet: WalletState;
}

const FundWithLaunchtube: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const dispatch = useDispatch();
  const contractId = useSelector((state: AppState) => state.wallet.contractId);
  
  const handleFundClick = async () => {
    if (!contractId) {
      toast.error("No wallet found to fund");
      return;
    }
    
    setIsLoading(true);
    
    try {
      const loadingToast = toast.info("Funding wallet via Launchtube...", {
        position: "top-right",
        autoClose: false,
        hideProgressBar: false,
        closeOnClick: false,
        pauseOnHover: true,
        draggable: true,
      });
      
      // Use the PasskeyServer to submit to Launchtube
      const result = await fundWithLaunchtube(contractId);
      
      toast.dismiss(loadingToast);
      
      if (result.success) {
        toast.success(`Successfully funded wallet!`, {
          position: "top-right",
          autoClose: 5000,
        });
        
        // Refresh balance after successful funding
        setTimeout(() => {
          dispatch(checkBalance() as any);
        }, 3000); // Wait 3 seconds before checking balance
      } else {
        toast.error(`Failed to fund wallet: ${result.message}`, {
          position: "top-right",
          autoClose: 5000,
        });
      }
    } catch (error) {
      console.error("Error funding wallet:", error);
      toast.error(`Error: ${error instanceof Error ? error.message : String(error)}`, {
        position: "top-right",
        autoClose: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="flex flex-col">
      <ActionButton
        onClick={handleFundClick}
        disabled={isLoading || !contractId}
        isLoading={isLoading}
        className="text-xs py-1.5 justify-center"
        size="sm"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.121 15.536c-1.171 1.952-3.07 1.952-4.242 0-1.172-1.953-1.172-5.119 0-7.072M8 10.5h4m-4 3h4m9-1.5a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Fund via Launchtube
      </ActionButton>
      
      {!contractId && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 text-center">
          Create a wallet first to enable funding
        </p>
      )}
    </div>
  );
};

export default FundWithLaunchtube; 
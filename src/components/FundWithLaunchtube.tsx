import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fundWithLaunchtube } from '../lib/passkey';
import { toast } from 'react-toastify';
import { WalletState, checkBalance } from '../store/walletSlice';

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
    <div className="mt-4">
      <button
        onClick={handleFundClick}
        disabled={isLoading || !contractId}
        className={`
          w-full py-2 px-4 rounded font-semibold
          ${isLoading ? 
            'bg-gray-400 cursor-not-allowed' : 
            'bg-blue-600 hover:bg-blue-700 text-white'}
        `}
      >
        {isLoading ? 'Funding...' : 'Fund Wallet via Launchtube'}
      </button>
      
      {!contractId && (
        <p className="text-sm text-gray-500 mt-1">
          Create a wallet first to enable funding
        </p>
      )}
    </div>
  );
};

export default FundWithLaunchtube; 
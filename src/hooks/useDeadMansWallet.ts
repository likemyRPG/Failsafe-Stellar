import { useEffect, useState } from 'react';
import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { WalletState, checkInDeadMansWallet } from '../store/walletSlice';
import { toast } from 'react-toastify';

export const useDeadMansWallet = () => {
  const dispatch = useDispatch();
  const { deadMansWallet, isConnected, contractId } = useSelector(
    (state: { wallet: WalletState }) => state.wallet
  );
  
  const [daysRemaining, setDaysRemaining] = useState(0);
  const [isUrgent, setIsUrgent] = useState(false);
  const [timeExpired, setTimeExpired] = useState(false);
  
  // Calculate days remaining and check expiration status
  useEffect(() => {
    if (!deadMansWallet.isConfigured || !deadMansWallet.nextCheckInDeadline) {
      setDaysRemaining(0);
      setIsUrgent(false);
      setTimeExpired(false);
      return;
    }
    
    const calculateRemainingTime = () => {
      const now = new Date();
      const deadline = new Date(deadMansWallet.nextCheckInDeadline as string);
      const differenceMs = deadline.getTime() - now.getTime();
      const differenceDays = Math.ceil(differenceMs / (1000 * 60 * 60 * 24));
      
      setDaysRemaining(differenceDays);
      setIsUrgent(differenceDays <= 3 && differenceDays > 0);
      setTimeExpired(differenceDays <= 0);
      
      // Show notification for urgent check-ins
      if (differenceDays === 3) {
        toast.warning(`Your dead man's wallet check-in is due in 3 days!`, {
          position: "top-right",
          autoClose: 10000,
          style: {
            background: "linear-gradient(to right, #f0f9ff, #e0f2fe)",
            color: "#0369a1",
            border: "1px solid #bae6fd",
            borderRadius: "0.75rem",
            padding: "12px 16px",
            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)"
          }
        });
      } else if (differenceDays === 1) {
        toast.error(`Your dead man's wallet check-in is due TOMORROW!`, {
          position: "top-right",
          autoClose: false,
          style: {
            background: "linear-gradient(to right, #fee2e2, #fecaca)",
            color: "#b91c1c",
            border: "1px solid #fca5a5",
            borderRadius: "0.75rem",
            padding: "12px 16px",
            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)"
          }
        });
      } else if (differenceDays <= 0) {
        // Create different messages based on configuration
        const aiMessage = deadMansWallet.aiEnabled 
          ? ' Your AI assistant has been activated.' 
          : '';
        
        const beneficiariesMessage = deadMansWallet.useAiOption && deadMansWallet.beneficiaries.length > 0
          ? ` Funds will be distributed to ${deadMansWallet.beneficiaries.length} beneficiaries.`
          : '';
        
        toast.error(`Your check-in deadline has EXPIRED! ${aiMessage}${beneficiariesMessage}`, {
          position: "top-right",
          autoClose: false,
          style: {
            background: "linear-gradient(to right, #7f1d1d, #991b1b)",
            color: "#fef2f2",
            border: "1px solid #b91c1c",
            borderRadius: "0.75rem",
            padding: "12px 16px", 
            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.2), 0 2px 4px -1px rgba(0, 0, 0, 0.1)"
          }
        });
        
        // If AI is enabled and time expired, notify user about AI activation
        if (deadMansWallet.aiEnabled && deadMansWallet.aiPrompt) {
          setTimeout(() => {
            const promptText = deadMansWallet.aiPrompt || '';
            toast.info(`AI assistant is executing with your instructions: "${promptText.substring(0, 50)}${promptText.length > 50 ? '...' : ''}"`, {
              position: "top-right",
              autoClose: false,
              style: {
                background: "linear-gradient(to right, #0f172a, #1e293b)",
                color: "#e2e8f0",
                border: "1px solid #334155",
                borderRadius: "0.75rem",
                padding: "12px 16px",
                boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.2), 0 2px 4px -1px rgba(0, 0, 0, 0.1)"
              }
            });
          }, 3000);
        }
      }
    };
    
    calculateRemainingTime();
    
    // Re-calculate every hour
    const intervalId = setInterval(calculateRemainingTime, 60 * 60 * 1000);
    
    return () => clearInterval(intervalId);
  }, [deadMansWallet.isConfigured, deadMansWallet.nextCheckInDeadline, deadMansWallet.aiEnabled, deadMansWallet.aiPrompt, deadMansWallet.useAiOption, deadMansWallet.beneficiaries]);
  
  // Format date for display
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Not set";
    
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // Handle check-in
  const handleCheckIn = async () => {
    if (!isConnected || !contractId) {
      toast.error("Wallet not connected");
      return;
    }
    
    if (!deadMansWallet.isConfigured) {
      toast.error("Dead man's wallet not configured");
      return;
    }
    
    try {
      // Just call the thunk and let it handle the API interaction
      const result = await dispatch(checkInDeadMansWallet() as any).unwrap();
      
      // Show success message
      toast.success("Check-in successful! Your funds are safe.", {
        position: "top-right",
        autoClose: 5000,
        style: {
          background: "linear-gradient(to right, #ecfdf5, #d1fae5)",
          color: "#065f46",
          border: "1px solid #6ee7b7",
          borderRadius: "0.75rem",
          padding: "12px 16px",
          boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)"
        }
      });
      
      return result;
    } catch (error) {
      console.error("Check-in error:", error);
      
      // More descriptive error message
      let errorMessage = "Failed to check in. Please try again.";
      if (error instanceof Error) {
        errorMessage = `Check-in failed: ${error.message}`;
      }
      
      toast.error(errorMessage, {
        position: "top-right",
        autoClose: 8000,
        style: {
          background: "linear-gradient(to right, #fee2e2, #fecaca)",
          color: "#b91c1c",
          border: "1px solid #fca5a5",
          borderRadius: "0.75rem",
          padding: "12px 16px",
          boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)"
        }
      });
      
      throw error; // Re-throw to propagate the error
    }
  };
  
  // Get a default AI prompt suggestion based on wallet settings
  const getDefaultAiPrompt = () => {
    // Check if we have beneficiaries
    const hasBeneficiaries = deadMansWallet.beneficiaries && deadMansWallet.beneficiaries.length > 0;
    const beneficiaryNames = hasBeneficiaries 
      ? deadMansWallet.beneficiaries.map(b => b.name).join(", ")
      : '';
    
    if (hasBeneficiaries) {
      return `If I haven't checked in for ${deadMansWallet.checkInPeriod} days, please distribute my funds to the following people: ${beneficiaryNames}. Please consider their financial needs and relationships to me when determining the allocation. Take into account any special circumstances they might have mentioned recently. Please help them understand how to access the funds, and assist them with the technical aspects of managing a crypto wallet if needed.`;
    } else if (deadMansWallet.destinationAddress) {
      return `If I haven't checked in for ${deadMansWallet.checkInPeriod} days, please monitor the transfer of funds to ${deadMansWallet.destinationAddress} and notify my emergency contacts via email. Then, please follow up with my beneficiary to ensure they received the funds and assist them with any questions about accessing or managing them.`;
    } else {
      return 'If I have not checked in for the specified period, please handle the distribution of my funds according to my recent communications and known wishes. Please ensure my beneficiaries understand how to access their funds and assist them with any technical questions they might have about crypto wallets.';
    }
  };
  
  return {
    deadMansWallet,
    daysRemaining,
    isUrgent,
    timeExpired,
    formatDate,
    handleCheckIn,
    getDefaultAiPrompt
  };
}; 
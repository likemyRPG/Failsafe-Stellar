import { useEffect, useState } from 'react';
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
        });
      } else if (differenceDays === 1) {
        toast.error(`Your dead man's wallet check-in is due TOMORROW!`, {
          position: "top-right",
          autoClose: false,
        });
      } else if (differenceDays <= 0) {
        toast.error(`Your check-in deadline has EXPIRED! Funds may be transferred soon.`, {
          position: "top-right",
          autoClose: false,
        });
      }
    };
    
    calculateRemainingTime();
    
    // Re-calculate every hour
    const intervalId = setInterval(calculateRemainingTime, 60 * 60 * 1000);
    
    return () => clearInterval(intervalId);
  }, [deadMansWallet.isConfigured, deadMansWallet.nextCheckInDeadline]);
  
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
      await dispatch(checkInDeadMansWallet() as any).unwrap();
      toast.success("Check-in successful! Your funds are safe.");
    } catch (error) {
      console.error("Check-in error:", error);
      toast.error("Failed to check in. Please try again.");
    }
  };
  
  return {
    deadMansWallet,
    daysRemaining,
    isUrgent,
    timeExpired,
    formatDate,
    handleCheckIn
  };
}; 
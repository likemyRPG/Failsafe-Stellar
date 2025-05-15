'use client'
import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  WalletState, 
  configureDeadMansWallet 
} from '../store/walletSlice';
import { 
  Button, 
  Card, 
  CardBody, 
  CardHeader, 
  Divider,
  Input, 
  Spinner,
  Modal, 
  ModalContent, 
  ModalHeader, 
  ModalBody, 
  ModalFooter,
  useDisclosure,
  Badge
} from "@heroui/react";
import { toast } from 'react-toastify';
import { useDeadMansWallet } from '../hooks/useDeadMansWallet';

// This will be replaced with actual Stellar chain interaction
const mockDeadManWalletSettings = {
  isConfigured: false,
  destinationAddress: '',
  checkInPeriod: 30, // days
  lastCheckIn: new Date().toISOString(),
  nextCheckInDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
};

const DeadMansWallet: React.FC = () => {
  const dispatch = useDispatch();
  const { isConnected, isLoading } = useSelector(
    (state: { wallet: WalletState }) => state.wallet
  );

  const { 
    deadMansWallet,
    daysRemaining,
    isUrgent,
    timeExpired,
    formatDate,
    handleCheckIn
  } = useDeadMansWallet();

  const [newDestinationAddress, setNewDestinationAddress] = useState('');
  const [newCheckInPeriod, setNewCheckInPeriod] = useState('30');
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [checkingIn, setCheckingIn] = useState(false);

  // In a real implementation, this would fetch settings from the blockchain
  const handleSaveSettings = async () => {
    if (!newDestinationAddress) {
      toast.error("Please enter a valid destination address");
      return;
    }

    if (!newCheckInPeriod || parseInt(newCheckInPeriod) < 1) {
      toast.error("Please enter a valid check-in period (minimum 1 day)");
      return;
    }

    try {
      // Configure dead man's wallet on the blockchain
      await dispatch(configureDeadMansWallet({
        destinationAddress: newDestinationAddress,
        checkInPeriod: parseInt(newCheckInPeriod)
      }) as any).unwrap();
      
      onClose(); // Close the modal
      toast.success("Dead man's wallet configured successfully!");
    } catch (error) {
      console.error("Error configuring dead man's wallet:", error);
      toast.error("Failed to configure wallet settings");
    }
  };

  const getBadgeColor = () => {
    if (timeExpired) return "danger";
    if (isUrgent) return "warning";
    return "primary";
  };

  // Helper to format time remaining in a friendly format
  const formatTimeRemaining = (timeInMs: number): string => {
    if (timeInMs <= 0) {
      return "Expired";
    }
    
    const days = Math.floor(timeInMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeInMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((timeInMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) {
      return `${days}d ${hours}h remaining`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m remaining`;
    } else {
      return `${minutes}m remaining`;
    }
  };
  
  // Calculate percentage of time remaining
  const getTimeRemainingPercentage = (): number => {
    if (!deadMansWallet.isConfigured || !deadMansWallet.lastCheckIn || !deadMansWallet.nextCheckInDeadline) {
      return 0;
    }
    
    const totalPeriodMs = Number(deadMansWallet.checkInPeriod) * 24 * 60 * 60 * 1000;
    const nextDeadline = new Date(deadMansWallet.nextCheckInDeadline).getTime();
    const now = Date.now();
    
    if (now >= nextDeadline) {
      return 0;
    }
    
    const elapsedMs = now - new Date(deadMansWallet.lastCheckIn).getTime();
    const remainingMs = totalPeriodMs - elapsedMs;
    
    return Math.max(0, Math.min(100, (remainingMs / totalPeriodMs) * 100));
  };

  // Function to handle checking in with loading state
  const handleCheckInWithLoader = async () => {
    setCheckingIn(true);
    try {
      await handleCheckIn();
    } finally {
      setCheckingIn(false);
    }
  };

  // Calculate time remaining in milliseconds for display
  const getTimeRemainingMs = (): number => {
    if (!deadMansWallet.isConfigured || !deadMansWallet.nextCheckInDeadline) {
      return 0;
    }
    
    const nextDeadline = new Date(deadMansWallet.nextCheckInDeadline).getTime();
    const now = Date.now();
    return Math.max(0, nextDeadline - now);
  };

  return (
    <Card>
      <CardHeader className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Dead Man's Wallet</h3>
        {deadMansWallet.isConfigured && (
          <Badge 
            color={getBadgeColor()} 
            size="sm"
            variant="flat"
          >
            {timeExpired ? "Expired" : `${daysRemaining} days left`}
          </Badge>
        )}
      </CardHeader>
      <CardBody>
        {!isConnected ? (
          <div className="text-center">
            <p className="mb-2">Connect your wallet to use this feature</p>
          </div>
        ) : isLoading ? (
          <div className="flex items-center justify-center">
            <Spinner size="sm" />
            <p className="ml-2">Loading...</p>
          </div>
        ) : (
          <div className="mt-4">
            {deadMansWallet.isConfigured ? (
              <div className="rounded-xl border border-gray-200 dark:border-gray-800/60 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm shadow-sm overflow-hidden">
                <div className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-b border-gray-200 dark:border-gray-800/60 flex items-center">
                  <div className="w-6 h-6 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-md flex items-center justify-center mr-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white">Dead Man's Switch Status</h3>
                </div>
                
                <div className="p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-medium dark:text-gray-300 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1.5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                      </svg>
                      Destination Address
                    </span>
                    <span className="text-xs text-gray-600 dark:text-gray-400 font-mono bg-gray-100 dark:bg-gray-800/60 px-2 py-1 rounded">
                      {deadMansWallet.destinationAddress}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-medium dark:text-gray-300 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1.5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Check-in Period
                    </span>
                    <span className="text-xs text-gray-600 dark:text-gray-400 font-medium bg-gray-100 dark:bg-gray-800/60 px-2 py-1 rounded">
                      {deadMansWallet.checkInPeriod} {Number(deadMansWallet.checkInPeriod) === 1 ? 'day' : 'days'}
                    </span>
                  </div>
                  
                  <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-800/60">
                    {deadMansWallet.nextCheckInDeadline && (
                      <div className="flex flex-col">
                        <div className="flex justify-between items-center mb-1.5">
                          <span className="text-xs font-medium dark:text-gray-300 flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1.5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Time Remaining
                          </span>
                          <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                            getTimeRemainingPercentage() > 50 
                              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                              : getTimeRemainingPercentage() > 25 
                                ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' 
                                : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                          }`}>
                            {timeExpired ? 'Expired!' : formatTimeRemaining(getTimeRemainingMs())}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mb-1">
                          <div 
                            className={`h-1.5 rounded-full ${
                              getTimeRemainingPercentage() > 50 
                                ? 'bg-gradient-to-r from-green-400 to-green-500' 
                                : getTimeRemainingPercentage() > 25 
                                  ? 'bg-gradient-to-r from-yellow-400 to-yellow-500' 
                                  : 'bg-gradient-to-r from-red-400 to-red-500'
                            }`}
                            style={{ width: `${getTimeRemainingPercentage()}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex gap-2 mt-4">
                      <Button
                        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white border-none text-xs py-1"
                        onClick={handleCheckInWithLoader}
                        isLoading={checkingIn}
                        size="sm"
                      >
                        Check In Now
                      </Button>
                      <Button
                        className="w-full border border-red-200 dark:border-red-900/30 text-red-500 dark:text-red-400 dark:bg-red-900/10 text-xs py-1"
                        onClick={() => {
                          setNewDestinationAddress(deadMansWallet.destinationAddress || '');
                          setNewCheckInPeriod(deadMansWallet.checkInPeriod.toString());
                          onOpen();
                        }}
                        variant="flat"
                        size="sm"
                      >
                        Edit Settings
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-gray-200 dark:border-gray-800/60 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm shadow-sm p-4">
                <div className="flex flex-col items-center text-center p-2">
                  <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-1">Dead Man's Switch Not Configured</h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-4">
                    Set up a dead man's switch to automatically transfer your funds if you don't check in regularly.
                  </p>
                  <Button
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white border-none text-xs"
                    onClick={() => onOpen()}
                    size="sm"
                  >
                    Configure Switch
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Configuration Modal */}
        <Modal isOpen={isOpen} onClose={onClose} className="backdrop-blur-sm">
          <ModalContent className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm border border-gray-200 dark:border-gray-800/60 rounded-xl shadow-xl dark:shadow-black/40">
            <ModalHeader className="border-b border-gray-200 dark:border-gray-800/60 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-t-xl">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-md flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Configure Dead Man's Wallet</h3>
              </div>
            </ModalHeader>
            <ModalBody className="px-5 py-4">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium dark:text-gray-300 mb-1.5 block flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                    </svg>
                    Destination Address
                  </label>
                  <Input
                    type="text"
                    placeholder="Enter Stellar address"
                    value={newDestinationAddress}
                    onChange={(e) => setNewDestinationAddress(e.target.value)}
                    className="bg-transparent border border-gray-300 dark:border-gray-700 rounded-lg text-sm"
                    variant="bordered"
                  />
                  <p className="mt-1.5 text-xs text-foreground-500 dark:text-gray-400 pl-5">
                    This address will receive your funds if you don't check in on time
                  </p>
                </div>
                
                <div>
                  <label className="text-sm font-medium dark:text-gray-300 mb-1.5 block flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Check-in Period (days)
                  </label>
                  <Input
                    type="number"
                    min={1}
                    max={365}
                    placeholder="Days between check-ins"
                    value={newCheckInPeriod}
                    onChange={(e) => setNewCheckInPeriod(e.target.value)}
                    className="bg-transparent border border-gray-300 dark:border-gray-700 rounded-lg text-sm"
                    variant="bordered"
                  />
                  <p className="mt-1.5 text-xs text-foreground-500 dark:text-gray-400 pl-5">
                    You must confirm you're alive within this many days
                  </p>
                </div>
                
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/30 rounded-lg text-blue-800 dark:text-blue-300 text-sm">
                  <div className="flex items-start">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>
                      If you don't check in within the specified period, your funds will be automatically transferred to the destination address.
                    </span>
                  </div>
                </div>
              </div>
            </ModalBody>
            <ModalFooter className="border-t border-gray-200 dark:border-gray-800/60 gap-2">
              <Button 
                variant="flat"
                className="border border-red-200 dark:border-red-900/30 text-red-500 dark:text-red-400 dark:bg-red-900/10 text-xs py-1"
                onClick={onClose}
                size="sm"
              >
                Cancel
              </Button>
              <Button 
                variant="solid"
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white border-none text-xs py-1"
                onClick={handleSaveSettings}
                isLoading={isLoading}
                size="sm"
              >
                Save Settings
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </CardBody>
    </Card>
  );
}

export default DeadMansWallet; 
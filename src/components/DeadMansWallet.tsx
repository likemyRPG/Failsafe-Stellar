'use client'
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  WalletState, 
  configureDeadMansWallet,
  Beneficiary
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
  Badge,
  Radio,
  RadioGroup,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Switch,
  Tooltip
} from "@heroui/react";
import { toast } from 'react-toastify';
import { useDeadMansWallet } from '../hooks/useDeadMansWallet';
// Import our custom styled components
import { ActionButton, SecondaryButton, GradientText, DecoratedHeader, FloatingIcon, HoverCard, InfoBox, Badge as CustomBadge, StyledTextField } from './StyledComponents';

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
    handleCheckIn,
    getDefaultAiPrompt
  } = useDeadMansWallet();

  const [newDestinationAddress, setNewDestinationAddress] = useState('');
  const [newCheckInPeriod, setNewCheckInPeriod] = useState('30');
  const [aiEnabled, setAiEnabled] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [useAiOption, setUseAiOption] = useState(true);
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
  const [newBeneficiary, setNewBeneficiary] = useState<Beneficiary>({
    name: '',
    walletAddress: '',
    relationship: '',
  });
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { 
    isOpen: isAddBeneficiaryOpen, 
    onOpen: onOpenAddBeneficiary, 
    onClose: onCloseAddBeneficiary 
  } = useDisclosure();
  const [checkingIn, setCheckingIn] = useState(false);

  // Initialize state from existing settings
  useEffect(() => {
    if (deadMansWallet.isConfigured) {
      setNewDestinationAddress(deadMansWallet.destinationAddress || '');
      setNewCheckInPeriod(deadMansWallet.checkInPeriod.toString());
      setAiEnabled(deadMansWallet.aiEnabled || false);
      setAiPrompt(deadMansWallet.aiPrompt || '');
      setUseAiOption(deadMansWallet.useAiOption);
      setBeneficiaries(deadMansWallet.beneficiaries || []);
    }
  }, [deadMansWallet]);

  // Beneficiary management functions
  const handleAddBeneficiary = () => {
    if (!newBeneficiary.name || !newBeneficiary.walletAddress) {
      toast.error("Name and wallet address are required for beneficiaries");
      return;
    }
    
    // Add new beneficiary to the list
    setBeneficiaries([...beneficiaries, { ...newBeneficiary }]);
    
    // Reset form
    setNewBeneficiary({
      name: '',
      walletAddress: '',
      relationship: '',
    });
    
    onCloseAddBeneficiary();
  };
  
  const handleRemoveBeneficiary = (index: number) => {
    const updatedBeneficiaries = [...beneficiaries];
    updatedBeneficiaries.splice(index, 1);
    setBeneficiaries(updatedBeneficiaries);
  };
  
  const handleEditBeneficiary = (index: number, updatedBeneficiary: Beneficiary) => {
    const updatedBeneficiaries = [...beneficiaries];
    updatedBeneficiaries[index] = updatedBeneficiary;
    setBeneficiaries(updatedBeneficiaries);
  };

  // In a real implementation, this would fetch settings from the blockchain
  const handleSaveSettings = async () => {
    if (useAiOption) {
      // AI allocation mode - validate beneficiaries or destination
      if (!aiEnabled && beneficiaries.length === 0) {
        toast.error("Please add at least one beneficiary or enable AI with instructions");
        return;
      }
      
      if (aiEnabled && !aiPrompt.trim()) {
        toast.error("Please enter AI instructions or disable AI");
        return;
      }
    } else {
      // Direct destination mode
      if (!newDestinationAddress) {
        toast.error("Please enter a valid destination address");
        return;
      }
    }

    // For initial setup only, validate check-in period
    if (!deadMansWallet.isConfigured && (!newCheckInPeriod || parseInt(newCheckInPeriod) < 1)) {
      toast.error("Please enter a valid check-in period (minimum 1 day)");
      return;
    }

    try {
      // Configure dead man's wallet on the blockchain
      await dispatch(configureDeadMansWallet({
        destinationAddress: useAiOption ? null : newDestinationAddress,
        checkInPeriod: deadMansWallet.isConfigured ? deadMansWallet.checkInPeriod : parseInt(newCheckInPeriod),
        aiEnabled,
        aiPrompt: aiEnabled ? aiPrompt : null,
        useAiOption,
        beneficiaries
      }) as any).unwrap();
      
      onClose(); // Close the modal
      toast.success("Failsafe configured successfully!");
    } catch (error) {
      console.error("Error configuring failsafe:", error);
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

  // When opening the modal, initialize AI fields from current config
  const openConfigModal = () => {
    setNewDestinationAddress(deadMansWallet.destinationAddress || '');
    setNewCheckInPeriod(deadMansWallet.checkInPeriod.toString());
    setAiEnabled(deadMansWallet.aiEnabled || false);
    setAiPrompt(deadMansWallet.aiPrompt || '');
    setUseAiOption(deadMansWallet.useAiOption);
    setBeneficiaries(deadMansWallet.beneficiaries || []);
    onOpen();
  };

  return (
    <div>

      <div>
        {!isConnected ? (
          <div className="text-center p-8">
            <FloatingIcon>
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-800/60 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
              </div>
            </FloatingIcon>
            <DecoratedHeader className="text-xl mb-3">Wallet Disconnected</DecoratedHeader>
            <p className="mb-4 text-gray-600 dark:text-gray-400 text-sm">Connect your wallet to use the Failsafe feature</p>
            <ActionButton size="sm">
              Connect Wallet
            </ActionButton>
          </div>
        ) : isLoading ? (
          <div className="flex items-center justify-center p-8">
            <Spinner className="text-accent" size="sm" />
            <p className="ml-3 text-gray-600 dark:text-gray-400">Loading failsafe details...</p>
          </div>
        ) : (
          <div className="mt-2">
            {deadMansWallet.isConfigured ? (
              <div className="glass-card rounded-xl overflow-hidden border border-[var(--border-color)] shadow-soft">
                <div className="p-3 bg-gradient-to-r from-[var(--accent-gradient-from)]/10 to-[var(--accent-gradient-to)]/10 dark:from-[var(--accent-gradient-from)]/5 dark:to-[var(--accent-gradient-to)]/5 border-b border-[var(--border-color)] flex items-center">
                  <div className="w-6 h-6 btn-gradient rounded-md flex items-center justify-center mr-2 shadow-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-sm font-medium text-gray-800 dark:text-gray-100">Failsafe Status</h3>
                </div>
                
                <div className="p-4 space-y-3">
                  {deadMansWallet.useAiOption ? (
                    <>
                      {/* AI-based allocation mode */}
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-medium dark:text-gray-300 flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1.5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                          Distribution Mode
                        </span>
                        <span className="text-xs text-gray-600 dark:text-gray-400 font-medium bg-gray-100 dark:bg-gray-800/60 px-2 py-1 rounded">
                          AI Allocation
                        </span>
                      </div>
                      
                      {deadMansWallet.beneficiaries && deadMansWallet.beneficiaries.length > 0 && (
                        <div className="flex flex-col">
                          <span className="text-xs font-medium dark:text-gray-300 flex items-center mb-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1.5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                            Beneficiaries ({deadMansWallet.beneficiaries.length})
                          </span>
                          <div className="ml-5 grid grid-cols-1 gap-1">
                            {deadMansWallet.beneficiaries.slice(0, 3).map((ben, idx) => (
                              <div key={idx} className="text-xs flex items-center justify-between">
                                <span className="text-gray-700 dark:text-gray-300">{ben.name}</span>
                                <span className="text-gray-500 dark:text-gray-400 font-mono text-[10px] truncate max-w-[120px]">
                                  {ben.walletAddress}
                                </span>
                              </div>
                            ))}
                            {deadMansWallet.beneficiaries.length > 3 && (
                              <div className="text-xs text-gray-500 italic">
                                +{deadMansWallet.beneficiaries.length - 3} more...
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                      
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-medium dark:text-gray-300 flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1.5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                          AI Assistant
                        </span>
                        <span className="text-xs text-gray-600 dark:text-gray-400 font-medium bg-gray-100 dark:bg-gray-800/60 px-2 py-1 rounded">
                          {deadMansWallet.aiEnabled ? 'Enabled' : 'Disabled'}
                        </span>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Direct destination mode */}
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-medium dark:text-gray-300 flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1.5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                          </svg>
                          Distribution Mode
                        </span>
                        <span className="text-xs text-gray-600 dark:text-gray-400 font-medium bg-gray-100 dark:bg-gray-800/60 px-2 py-1 rounded">
                          Direct Transfer
                        </span>
                      </div>
                      
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
                    </>
                  )}
                  
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
                              ? 'bg-green-100/80 text-green-700 dark:bg-green-900/30 dark:text-green-300 backdrop-blur-sm' 
                              : getTimeRemainingPercentage() > 25 
                                ? 'bg-yellow-100/80 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300 backdrop-blur-sm' 
                                : 'bg-red-100/80 text-red-700 dark:bg-red-900/30 dark:text-red-300 backdrop-blur-sm'
                          }`}>
                            {timeExpired ? 'Expired!' : formatTimeRemaining(getTimeRemainingMs())}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mb-1">
                          <div 
                            className={`h-1.5 rounded-full ${
                              getTimeRemainingPercentage() > 50 
                                ? 'bg-gradient-to-r from-green-400 to-emerald-500' 
                                : getTimeRemainingPercentage() > 25 
                                  ? 'bg-gradient-to-r from-amber-400 to-yellow-500' 
                                  : 'bg-gradient-to-r from-red-400 to-rose-500'
                            }`}
                            style={{ width: `${getTimeRemainingPercentage()}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex gap-2 mt-4">
                      <Button
                        className="w-full btn-gradient text-white border-none text-xs py-1.5 rounded-lg shadow-md hover:shadow-glow"
                        onClick={handleCheckInWithLoader}
                        isLoading={checkingIn}
                        size="sm"
                      >
                        Check In Now
                      </Button>
                      <Button
                        className="w-full border border-red-200/80 dark:border-red-900/20 text-red-500 dark:text-red-400 bg-white/60 dark:bg-red-900/10 backdrop-blur-sm text-xs py-1.5 rounded-lg shadow-sm hover:bg-white dark:hover:bg-red-900/20"
                        onClick={openConfigModal}
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
              <div className="glass-card rounded-xl p-5">
                <div className="flex flex-col items-center text-center p-3">
                  <FloatingIcon>
                    <div className="w-16 h-16 btn-gradient rounded-2xl flex items-center justify-center mb-4 shadow-glow">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </FloatingIcon>
                  <DecoratedHeader className="text-xl mb-2">Failsafe Not Configured</DecoratedHeader>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-5 max-w-sm">
                    Set up a failsafe to automatically transfer your <GradientText>Stellar assets</GradientText> if you don't check in regularly.
                  </p>
                  <ActionButton
                    onClick={openConfigModal}
                    size="sm"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Configure Switch
                  </ActionButton>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Configuration Modal */}
        <Modal isOpen={isOpen} onClose={onClose} className="backdrop-blur-sm" scrollBehavior="inside" size="full">
          <ModalContent className="glass-card rounded-2xl w-full max-w-md mx-auto shadow-xl dark:shadow-black/40">
            <ModalHeader className="border-b border-[var(--border-color)] bg-gradient-to-r from-[var(--accent-gradient-from)]/10 to-[var(--accent-gradient-to)]/10 dark:from-[var(--accent-gradient-from)]/5 dark:to-[var(--accent-gradient-to)]/5 rounded-t-2xl">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 btn-gradient rounded-md flex items-center justify-center shadow-glow">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-800 dark:text-gray-100">Configure Failsafe</h3>
              </div>
            </ModalHeader>
            <ModalBody className="px-5 py-4">
              <div className="space-y-4">
                {/* Check-in period setting */}
                <div>
                  <label className="text-sm font-medium dark:text-gray-300 mb-1.5 block flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Check-in Period (days)
                  </label>
                  {deadMansWallet.isConfigured ? (
                    <div className="bg-gray-100/70 dark:bg-gray-800/60 p-2.5 rounded-xl text-sm border border-gray-300/60 dark:border-gray-700/60 backdrop-blur-sm">
                      {newCheckInPeriod} {Number(newCheckInPeriod) === 1 ? 'day' : 'days'}
                    </div>
                  ) : (
                    <StyledTextField
                     type="number"
                     min={1}
                     max={365}
                     placeholder="Days between check-ins"
                     value={newCheckInPeriod}
                     onChange={(e) => setNewCheckInPeriod(e.target.value)}
                    />
                  )}
                  <p className="mt-1.5 text-xs text-foreground-500 dark:text-gray-400 pl-5">
                    {deadMansWallet.isConfigured 
                      ? "" 
                      : "You must confirm you're alive within this many days"}
                  </p>
                </div>
                
                {/* Mode selector */}
                <div className="mt-5">
                  <RadioGroup
                    label="Transfer Mode"
                    value={useAiOption ? "ai" : "direct"}
                    onChange={(value: string | React.ChangeEvent<HTMLInputElement>) => {
                      // Handle both string and event cases
                      if (typeof value === 'string') {
                        setUseAiOption(value === "ai");
                      } else if (value.target && value.target.value) {
                        setUseAiOption(value.target.value === "ai");
                      }
                    }}
                    className="mb-3"
                  >
                    <Radio value="ai">Use AI to distribute funds to beneficiaries</Radio>
                    <Radio value="direct">Send all funds to one destination address</Radio>
                  </RadioGroup>
                </div>
                
                {/* Direct destination address - only show if direct mode */}
                {!useAiOption && (
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
                      This address will receive all your funds if you don't check in on time
                    </p>
                  </div>
                )}
                
                {/* AI mode settings */}
                {useAiOption && (
                  <>
                    {/* Beneficiaries table */}
                    <div className="mt-3">
                      <div className="flex justify-between items-center mb-2">
                        <label className="text-sm font-medium dark:text-gray-300 block flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                          </svg>
                          Beneficiaries
                        </label>
                        <Button 
                          size="sm" 
                          className="text-xs bg-gradient-to-r from-blue-600 to-indigo-600 text-white"
                          onClick={onOpenAddBeneficiary}
                        >
                          Add Person
                        </Button>
                      </div>
                      
                      {beneficiaries.length > 0 ? (
                        <div className="overflow-x-auto -mx-2 px-2">
                          <Table 
                            aria-label="Beneficiaries table"
                            className="mt-2 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden w-full min-w-[300px]"
                            removeWrapper
                          >
                            <TableHeader>
                              <TableColumn>NAME</TableColumn>
                              <TableColumn>ADDRESS</TableColumn>
                              <TableColumn width={80}>ACTIONS</TableColumn>
                            </TableHeader>
                            <TableBody>
                              {beneficiaries.map((beneficiary, index) => (
                                <TableRow key={index}>
                                  <TableCell className="py-2">
                                    <div>
                                      <p className="text-sm font-medium">{beneficiary.name}</p>
                                      {beneficiary.relationship && (
                                        <p className="text-xs text-gray-500">{beneficiary.relationship}</p>
                                      )}
                                    </div>
                                  </TableCell>
                                  <TableCell className="py-2">
                                    <p className="text-xs font-mono overflow-hidden text-ellipsis max-w-[150px] truncate">
                                      {beneficiary.walletAddress}
                                    </p>
                                  </TableCell>
                                  <TableCell className="py-2">
                                    <Button
                                      size="sm"
                                      className="text-xs text-red-500 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800/30 min-w-0 p-1"
                                      onClick={() => handleRemoveBeneficiary(index)}
                                      variant="flat"
                                    >
                                      Remove
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      ) : (
                        <div className="text-center p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                          <p className="text-sm text-gray-500 dark:text-gray-400">No beneficiaries added yet.</p>
                        </div>
                      )}
                      
                      <p className="mt-1.5 text-xs text-foreground-500 dark:text-gray-400">
                        The AI will determine how to distribute funds among these beneficiaries when activated
                      </p>
                    </div>
                    
                    {/* AI Assistant toggle */}
                    <Divider className="my-4" />
                    
                    <div>
                      <label className="text-sm font-medium dark:text-gray-300 mb-1.5 block flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        AI Assistant
                      </label>
                      
                      <div className="flex items-center mb-2">
                        <span className="text-sm text-gray-700 dark:text-gray-300 mr-2">Enable AI Instructions</span>
                        <div className="relative inline-block w-10 mr-2 align-middle select-none">
                          <input
                            type="checkbox"
                            id="ai-toggle"
                            checked={aiEnabled}
                            onChange={(e) => setAiEnabled(e.target.checked)}
                            className="sr-only"
                          />
                          <label
                            htmlFor="ai-toggle"
                            className={`block overflow-hidden h-5 rounded-full bg-gray-300 cursor-pointer ${
                              aiEnabled ? 'bg-blue-500' : 'bg-gray-300'
                            }`}
                          >
                            <span
                              className={`block h-5 w-5 rounded-full bg-white shadow transform transition-transform ${
                                aiEnabled ? 'translate-x-5' : 'translate-x-0'
                              }`}
                            ></span>
                          </label>
                        </div>
                      </div>
                      
                      {aiEnabled && (
                        <div className="mt-2">
                          <label className="text-sm font-medium dark:text-gray-300 mb-1.5 block">
                            AI Instructions
                          </label>
                          <textarea
                            placeholder="Enter instructions for the AI to follow when your wallet expires"
                            value={aiPrompt}
                            onChange={(e) => setAiPrompt(e.target.value)}
                            className="w-full min-h-[80px] bg-transparent border border-gray-300 dark:border-gray-700 rounded-lg text-sm p-2 resize-y"
                          />
                          <div className="flex justify-end mt-1">
                            <Button
                              size="sm"
                              variant="flat"
                              className="text-xs"
                              onClick={() => setAiPrompt(getDefaultAiPrompt())}
                            >
                              Use Default Template
                            </Button>
                          </div>
                          <p className="mt-1.5 text-xs text-foreground-500 dark:text-gray-400">
                            The AI will use these instructions to act on your behalf if you don't check in on time
                          </p>
                        </div>
                      )}
                    </div>
                  </>
                )}
                
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/30 rounded-lg text-blue-800 dark:text-blue-300 text-sm">
                  <InfoBox
                    color="primary"
                    icon={
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    }
                  >
                    If you don't check in within the specified period:
                    {useAiOption ? (
                      aiEnabled ? (
                        " The AI will execute your instructions and determine how to distribute funds among your beneficiaries."
                      ) : (
                        " The AI will automatically distribute your funds among the listed beneficiaries."
                      )
                    ) : (
                      " All your funds will be automatically transferred to the destination address."
                    )}
                  </InfoBox>
                </div>
              </div>
            </ModalBody>
            <ModalFooter className="border-t border-[var(--border-color)] gap-2 flex-wrap p-4">
              <SecondaryButton
                onClick={onClose}
                size="sm"
                className="flex-1 min-w-0 text-red-500 dark:text-red-400 border-red-200/80 dark:border-red-900/30 bg-white/40 dark:bg-red-900/10"
              >
                Cancel
              </SecondaryButton>
              <ActionButton
                onClick={handleSaveSettings}
                isLoading={isLoading}
                size="sm"
                className="flex-1 min-w-0"
              >
                Save Settings
              </ActionButton>
            </ModalFooter>
          </ModalContent>
        </Modal>
        
        {/* Add Beneficiary Modal */}
        <Modal isOpen={isAddBeneficiaryOpen} onClose={onCloseAddBeneficiary} className="backdrop-blur-sm" size="full">
          <ModalContent className="glass-card rounded-2xl w-full max-w-md mx-auto shadow-xl dark:shadow-black/40">
            <ModalHeader className="border-b border-[var(--border-color)] bg-gradient-to-r from-[var(--accent-gradient-from)]/10 to-[var(--accent-gradient-to)]/10 dark:from-[var(--accent-gradient-from)]/5 dark:to-[var(--accent-gradient-to)]/5 rounded-t-2xl">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 btn-gradient rounded-md flex items-center justify-center shadow-glow">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-800 dark:text-gray-100">Add Beneficiary</h3>
              </div>
            </ModalHeader>
            <ModalBody className="px-5 py-4">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium dark:text-gray-300 mb-1.5 block">
                    Name
                  </label>
                  <StyledTextField
                    type="text"
                    placeholder="Enter beneficiary name"
                    value={newBeneficiary.name}
                    onChange={(e) => setNewBeneficiary({...newBeneficiary, name: e.target.value})}
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium dark:text-gray-300 mb-1.5 block">
                    Wallet Address
                  </label>
                  <StyledTextField
                    type="text"
                    placeholder="Enter Stellar address"
                    value={newBeneficiary.walletAddress}
                    onChange={(e) => setNewBeneficiary({...newBeneficiary, walletAddress: e.target.value})}
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium dark:text-gray-300 mb-1.5 block">
                    Relationship (Optional)
                  </label>
                  <StyledTextField
                    type="text"
                    placeholder="Family, Friend, Business Partner, etc."
                    value={newBeneficiary.relationship || ''}
                    onChange={(e) => setNewBeneficiary({...newBeneficiary, relationship: e.target.value})}
                  />
                </div>
              </div>
            </ModalBody>
            <ModalFooter className="border-t border-[var(--border-color)] gap-2 flex-wrap p-4">
              <SecondaryButton
                onClick={onCloseAddBeneficiary}
                size="sm"
                className="flex-1 min-w-0 text-red-500 dark:text-red-400 border-red-200/80 dark:border-red-900/30 bg-white/40 dark:bg-red-900/10"
              >
                Cancel
              </SecondaryButton>
              <ActionButton
                onClick={handleAddBeneficiary}
                size="sm"
                className="flex-1 min-w-0"
              >
                Add Beneficiary
              </ActionButton>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </div>
    </div>
  );
}

export default DeadMansWallet; 
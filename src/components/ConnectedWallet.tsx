import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  checkBalance, 
  disconnectWallet, 
  WalletState,
  fundWallet,
  getDeadMansWalletConfig,
  checkInDeadMansWallet
} from '../store/walletSlice';
import { Button, Spinner } from "@heroui/react";
import DeadMansWallet from './DeadMansWallet';
import LogEntries from './LogEntries';
import { ActionButton, Badge, InfoBox, SecondaryButton, TabButton, TabContainer } from './StyledComponents';
import { useDeadMansWallet } from '../hooks/useDeadMansWallet';
import { toast } from 'react-toastify';

const shortenAddress = (address: string) => {
  if (!address) return '';
  if (address.startsWith('LOCAL_')) return address;
  
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

const ConnectedWallet = () => {
  const dispatch = useDispatch();
  const { contractId, balance, isLoading } = useSelector(
    (state: { wallet: WalletState }) => state.wallet
  );
  const [addressCopied, setAddressCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('wallet');
  const [checkingIn, setCheckingIn] = useState(false);
  
  const { 
    deadMansWallet,
    daysRemaining,
    isUrgent,
    timeExpired,
    formatDate
  } = useDeadMansWallet();

  const isLocalWallet = contractId?.startsWith('LOCAL_');

  // Check balance if we have a non-local wallet
  useEffect(() => {
    if (contractId && !isLocalWallet) {
      dispatch(checkBalance() as any);
      
      // Also fetch dead man's wallet configuration
      dispatch(getDeadMansWalletConfig() as any);
    }
  }, [dispatch, contractId, isLocalWallet]);

  if (!contractId) {
    return null;
  }

  const handleDisconnect = () => {
    dispatch(disconnectWallet() as any);
  };

  const handleFund = () => {
    if (isLocalWallet) {
      alert('Local wallets cannot be funded from the testnet.');
      return;
    }
    dispatch(fundWallet() as any);
  };

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(contractId);
    setAddressCopied(true);
    setTimeout(() => setAddressCopied(false), 2000);
  };

  const openExplorer = () => {
    if (isLocalWallet) {
      alert('Local wallets do not exist on the blockchain and cannot be viewed in an explorer.');
      return;
    }
    window.open(`https://testnet.steexp.com/account/${contractId}`, '_blank');
  };

  const handleCheckIn = async () => {
    if (!deadMansWallet.isConfigured) {
      toast.error("Dead Man's Wallet is not configured");
      return;
    }
    
    setCheckingIn(true);
    try {
      await dispatch(checkInDeadMansWallet() as any).unwrap();
      toast.success("Successfully checked in");
    } catch (error) {
      console.error("Check-in error:", error);
      toast.error("Failed to check in");
    } finally {
      setCheckingIn(false);
    }
  };

  // Get check-in status color
  const getCheckInColor = () => {
    if (timeExpired) return 'danger';
    if (isUrgent) return 'warning';
    if (deadMansWallet.isConfigured) return 'success';
    return 'default';
  };
  
  // Get check-in status text
  const getCheckInStatus = () => {
    if (!deadMansWallet.isConfigured) return "Not Set";
    if (timeExpired) return "EXPIRED!";
    if (isUrgent) return `${daysRemaining} days left!`;
    return `${daysRemaining} days left`;
  };

  return (
    <div className="w-full max-w-full">
      <TabContainer className="mb-4 overflow-x-auto max-w-full flex no-scrollbar items-center justify-center">
        <TabButton active={activeTab === 'wallet'} onClick={() => setActiveTab('wallet')}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          Wallet
        </TabButton>
        {!isLocalWallet && deadMansWallet.aiEnabled && (
          <TabButton active={activeTab === 'logs'} onClick={() => setActiveTab('logs')}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            Journal
          </TabButton>
        )}
        {!isLocalWallet && (
          <TabButton active={activeTab === 'settings'} onClick={() => setActiveTab('settings')}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Settings
          </TabButton>
        )}
      </TabContainer>
      
      {activeTab === 'wallet' && (
        <div className="space-y-4">
          {/* Wallet Card */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700/50 overflow-hidden">
            {/* Wallet Header */}
            <div className="bg-gray-50 dark:bg-gray-800/70 p-3 border-b border-gray-100 dark:border-gray-700/50">
              <div className="flex justify-between items-center gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-7 h-7 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">Stellar Wallet</p>
                    <div className="flex items-center">
                      {isLocalWallet ? (
                        <Badge color="warning">Offline</Badge>
                      ) : (
                        <button onClick={handleFund}><Badge color="success">Testnet</Badge></button>
                      )}
                    </div>
                  </div>
                </div>
                <Button
                  color="default"
                  variant="light"
                  size="sm"
                  className="px-2 py-1 h-8 text-xs"
                  onClick={handleDisconnect}
                >
                  Disconnect
                </Button>
              </div>
            </div>
            
            {/* Wallet Balance */}
            <div className="p-3">
              <div className="mb-2">
                <p className="text-xs text-gray-500 dark:text-gray-400">Balance</p>
                <div className="flex items-baseline mt-1">
                  {isLoading ? (
                    <div className="flex items-center text-gray-500 dark:text-gray-400">
                      <Spinner size="sm" className="mr-2" />
                      <span>Loading...</span>
                    </div>
                  ) : isLocalWallet ? (
                    <p className="text-gray-500 dark:text-gray-400">Not available</p>
                  ) : (
                    <>
                      <span className="text-xl font-semibold">{balance || '0'}</span>
                      <span className="ml-1 text-sm text-gray-500 dark:text-gray-400">XLM</span>
                    </>
                  )}
                </div>
              </div>
              
              {/* Wallet Address */}
              <div className="mt-3">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Wallet Address</p>
                <div className="flex items-center">
                  <div className="bg-gray-50 dark:bg-gray-700/50 p-2 rounded-l-lg font-mono text-xs flex-1 overflow-hidden text-ellipsis whitespace-nowrap border border-gray-100 dark:border-gray-700">
                    {shortenAddress(contractId)}
                  </div>
                  <Button 
                    size="sm" 
                    color={addressCopied ? "success" : "default"}
                    className="rounded-l-none text-xs h-9 px-2"
                    onClick={handleCopyAddress}
                  >
                    {addressCopied ? "Copied" : "Copy"}
                  </Button>
                </div>
                
                {!isLocalWallet && (
                  <Button
                    color="default"
                    variant="flat"
                    size="sm"
                    className="mt-2 w-full text-xs h-8"
                    onClick={openExplorer}
                  >
                    View on Explorer
                  </Button>
                )}
              </div>
              
              {/* Check-in Status and Button */}
              {!isLocalWallet && deadMansWallet.isConfigured && (
                <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700/50">
                  <div className="flex justify-between items-center mb-2 flex-wrap gap-2">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Dead Man's Switch Status</p>
                      <div className="flex items-center mt-1">
                        <Badge color={getCheckInColor()}>
                          {getCheckInStatus()}
                        </Badge>
                      </div>
                    </div>
                    <Button
                      color="primary"
                      size="sm"
                      className="text-xs h-8"
                      onClick={handleCheckIn}
                      isLoading={checkingIn}
                    >
                      Check In
                    </Button>
                  </div>
                  
                  {deadMansWallet.lastCheckIn && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Last check-in: {formatDate(deadMansWallet.lastCheckIn)}
                    </p>
                  )}
                </div>
              )}
              
            </div>
          </div>
          
          {/* Instructions for Local Wallets */}
          {isLocalWallet && (
            <InfoBox 
              color="warning"
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
            >
              This is a local wallet created while offline. Connect to the internet and create a new wallet to access all features.
            </InfoBox>
          )}
        </div>
      )}
      
      {activeTab === 'logs' && <LogEntries />}
      
      {activeTab === 'settings' && <DeadMansWallet />}
    </div>
  );
};

export default ConnectedWallet;

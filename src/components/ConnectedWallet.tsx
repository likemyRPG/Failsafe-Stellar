import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  checkBalance, 
  disconnectWallet, 
  WalletState,
  fundWallet,
  getDeadMansWalletConfig
} from '../store/walletSlice';
import { Button, Divider, Spinner } from "@heroui/react";
import { fundWithExplorer } from '../lib/passkey';
import FundWithLaunchtube from './FundWithLaunchtube';
import DeadMansWallet from './DeadMansWallet';
import { ActionButton, Badge, InfoBox, SecondaryButton, TabButton, TabContainer } from './StyledComponents';
import { useDeadMansWallet } from '../hooks/useDeadMansWallet';

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
  
  const { 
    deadMansWallet,
    daysRemaining,
    isUrgent,
    timeExpired,
    formatDate,
    handleCheckIn
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

  // Dynamic color for check-in status
  const getCheckInColor = () => {
    if (timeExpired) return 'danger';
    if (isUrgent) return 'warning';
    if (deadMansWallet.isConfigured) return 'success';
    return 'default';
  };
  
  const getCheckInStatus = () => {
    if (!deadMansWallet.isConfigured) return "Not Set";
    if (timeExpired) return "EXPIRED!";
    if (isUrgent) return `${daysRemaining} days left!`;
    return `${daysRemaining} days left`;
  };

  return (
    <div className="w-full">
      <TabContainer className="mb-4">
        <TabButton active={activeTab === 'wallet'} onClick={() => setActiveTab('wallet')}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          Wallet
        </TabButton>
        {!isLocalWallet && (
          <TabButton active={activeTab === 'dmw'} onClick={() => setActiveTab('dmw')}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Dead Man's Switch
            {!isLocalWallet && deadMansWallet.isConfigured && isUrgent && (
              <span className="ml-1.5 w-2 h-2 rounded-full bg-yellow-500 animate-pulse"></span>
            )}
            {!isLocalWallet && deadMansWallet.isConfigured && timeExpired && (
              <span className="ml-1.5 w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
            )}
          </TabButton>
        )}
      </TabContainer>
      
      {activeTab === 'wallet' ? (
        <div className="space-y-4">
          {/* Wallet Header with Custom Design */}
          <div className="relative rounded-xl bg-gradient-to-r from-blue-600/10 to-indigo-600/10 dark:from-blue-900/20 dark:to-indigo-900/20 p-4 pb-7 overflow-hidden">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center shadow-sm ring-2 ring-white/20 dark:ring-black/10">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <h3 className="font-medium text-sm dark:text-white">Stellar Wallet</h3>
                <div className="flex items-center mt-0.5">
                  {isLocalWallet ? (
                    <Badge color="warning">Offline</Badge>
                  ) : (
                    <Badge color="success">Testnet</Badge>
                  )}
                </div>
              </div>
            </div>
            
            {/* SVG Decorations */}
            <div className="absolute -bottom-6 -right-3 opacity-50">
              <svg width="80" height="80" viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg" className="text-indigo-600/20 dark:text-indigo-500/10">
                <path d="M40 0 L75 19.6 L75 59 L40 80 L5 59 L5 19.6 Z" fill="none" stroke="currentColor" strokeWidth="2" />
              </svg>
            </div>
            <div className="absolute -bottom-3 -left-3 opacity-30">
              <svg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg" className="text-blue-500/20 dark:text-blue-400/10">
                <circle cx="30" cy="30" r="25" fill="none" stroke="currentColor" strokeWidth="2" />
              </svg>
            </div>
          </div>

          {/* Status Messages */}
          {isLocalWallet ? (
            <InfoBox 
              color="warning"
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              }
            >
              <div>
                <p className="mb-2">This is a local wallet created while offline. It doesn't exist on the Stellar testnet.</p>
                <SecondaryButton 
                  size="sm"
                  className="py-1 h-7 text-xs"
                  onClick={handleDisconnect}
                >
                  Disconnect and Try Again
                </SecondaryButton>
              </div>
            </InfoBox>
          ) : (
            <InfoBox 
              color="success"
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
            >
              Your wallet is connected to the Stellar testnet.
            </InfoBox>
          )}

          {/* Custom Grid Layout */}
          <div className="grid grid-cols-6 gap-3 mt-3">
            {/* Wallet Address - Full Width */}
            <div className="col-span-6">
              <p className="text-xs text-foreground-500 dark:text-gray-400 mb-1 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
                Wallet Address
              </p>
              <div className="flex items-center">
                <div className="bg-white/70 dark:bg-gray-800/70 p-2 rounded-l-lg font-mono text-sm flex-1 break-all text-xs border-y border-l border-gray-200 dark:border-gray-700/50">
                  {shortenAddress(contractId)}
                </div>
                <Button 
                  size="sm" 
                  variant="flat"
                  color={addressCopied ? "success" : "default"}
                  className="rounded-l-none border border-gray-200 dark:border-gray-700/50 min-w-[64px] h-8"
                  onClick={handleCopyAddress}
                >
                  {addressCopied ? (
                    <span className="flex items-center text-xs">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Copied
                    </span>
                  ) : (
                    <span className="text-xs">Copy</span>
                  )}
                </Button>
              </div>
            </div>

            {/* Balance - Half Width */}
            <div className="col-span-3">
              <p className="text-xs text-foreground-500 dark:text-gray-400 mb-1 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Balance
              </p>
              <div className="backdrop-blur-sm bg-white/70 dark:bg-gray-800/70 p-2 rounded-lg border border-gray-200 dark:border-gray-700/50 flex items-center h-[40px]">
                {isLoading ? (
                  <div className="flex items-center text-foreground-600 dark:text-gray-400 text-sm">
                    <Spinner size="sm" className="mr-2" />
                    <span className="text-xs">Loading...</span>
                  </div>
                ) : isLocalWallet ? (
                  <div className="text-foreground-600 dark:text-gray-400 font-mono text-xs">
                    N/A
                  </div>
                ) : (
                  <div className="font-mono text-base font-medium dark:text-white flex items-center">
                    {balance || '0'} 
                    <span className="ml-1 text-foreground-600 dark:text-gray-400 text-xs">XLM</span>
                  </div>
                )}
              </div>
            </div>

            {/* Status - Half Width */}
            <div className="col-span-3">
              <p className="text-xs text-foreground-500 dark:text-gray-400 mb-1 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Status
              </p>
              <div className="backdrop-blur-sm bg-white/70 dark:bg-gray-800/70 p-2 rounded-lg border border-gray-200 dark:border-gray-700/50 flex items-center h-[40px]">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <span className="text-xs dark:text-white">Active</span>
                </div>
              </div>
            </div>
            
            {/* Check-in countdown - only for non-local wallets and if configured */}
            {!isLocalWallet && (
              <div className="col-span-6 mt-1">
                <p className="text-xs text-foreground-500 dark:text-gray-400 mb-1 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Next Check-in
                </p>
                
                <div className={`backdrop-blur-sm bg-white/70 dark:bg-gray-800/70 rounded-lg border ${
                  deadMansWallet.isConfigured 
                    ? timeExpired 
                      ? 'border-red-300 dark:border-red-700/50'
                      : isUrgent
                        ? 'border-yellow-300 dark:border-yellow-700/50'
                        : 'border-gray-200 dark:border-gray-700/50'
                    : 'border-gray-200 dark:border-gray-700/50'
                } overflow-hidden`}>
                  <div className="flex items-center justify-between p-2">
                    {!deadMansWallet.isConfigured ? (
                      <div className="text-foreground-600 dark:text-gray-400 text-xs flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                        </svg>
                        Not configured
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center">
                          <Badge color={getCheckInColor()}>
                            {getCheckInStatus()}
                          </Badge>
                          <span className="ml-3 text-xs dark:text-gray-300">
                            {formatDate(deadMansWallet.nextCheckInDeadline)}
                          </span>
                        </div>
                        <Button
                          size="sm"
                          color="primary"
                          variant="flat" 
                          className="py-0 h-7 text-xs"
                          onClick={handleCheckIn}
                        >
                          Check In
                        </Button>
                      </>
                    )}
                  </div>
                  
                  {/* Progress bar for check-in period */}
                  {deadMansWallet.isConfigured && (
                    <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700">
                      <div 
                        className={`h-full ${
                          timeExpired 
                            ? 'bg-red-500' 
                            : isUrgent 
                              ? 'bg-yellow-500' 
                              : 'bg-blue-500'
                        }`}
                        style={{ 
                          width: `${
                            timeExpired 
                              ? '100' 
                              : Math.max(0, 100 - (daysRemaining / deadMansWallet.checkInPeriod * 100))
                          }%` 
                        }}
                      ></div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Funding Options - only for non-local wallets */}
          {!isLocalWallet && (
            <div className="pt-2 pb-1">
              <div className="rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700/50">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10 px-3 py-1.5">
                  <h3 className="text-xs font-medium text-blue-800 dark:text-blue-300 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Fund Your Wallet
                  </h3>
                </div>
                <div className="p-3 bg-white dark:bg-gray-800/50">
                  <FundWithLaunchtube />
                </div>
              </div>
            </div>
          )}

          {/* Custom Actions Footer */}
          <div className="flex justify-between pt-3 border-t border-gray-200 dark:border-gray-800/60">
            <Button 
              variant="flat"
              className="text-red-500 dark:text-red-400 border border-red-200 dark:border-red-900/30 dark:bg-red-900/10 text-xs h-8"
              onClick={handleDisconnect}
              startContent={
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              }
            >
              Disconnect
            </Button>
            
            {!isLocalWallet && (
              <Button
                variant="flat"
                className="border border-blue-200 dark:border-blue-900/30 dark:bg-blue-900/10 text-blue-600 dark:text-blue-400 text-xs h-8"
                onClick={openExplorer}
                startContent={
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                }
              >
                View Explorer
              </Button>
            )}
          </div>
        </div>
      ) : (
        // Show Dead Man's Wallet if tab is selected and not a local wallet
        !isLocalWallet && <DeadMansWallet />
      )}
    </div>
  );
};

export default ConnectedWallet;

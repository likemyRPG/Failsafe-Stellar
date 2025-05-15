import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  checkBalance, 
  disconnectWallet, 
  WalletState,
  fundWallet,
  getDeadMansWalletConfig
} from '../store/walletSlice';
import { Button, Divider, Spinner, Card, CardBody, CardHeader, Badge } from "@heroui/react";
import { fundAccountDirectly, fundWithExplorer } from '../lib/passkey';
import FundWithLaunchtube from './FundWithLaunchtube';
import DeadMansWallet from './DeadMansWallet';

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
  
  const handleDirectFund = async () => {
    if (isLocalWallet) {
      alert('Local wallets cannot be funded from the testnet.');
      return;
    }
    
    console.log("Attempting to fund wallet:", contractId);
    try {
      // Try the new explorer-based funding method
      const result = await fundWithExplorer(contractId);
      console.log("Funding result:", result);
      
      if (result.success) {
        alert('Funding successful! Refreshing balance...');
        dispatch(checkBalance() as any);
      } else if (result.manualUrl) {
        alert('Automatic funding failed. We opened a tab with Stellar Laboratory where you can fund your account manually.');
      } else {
        alert('Funding failed. See console for details.');
      }
    } catch (error) {
      console.error("Funding error:", error);
      alert('Funding failed with an error. See console for details.');
    }
  };

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(contractId);
    alert('Address copied to clipboard');
  };

  const openExplorer = () => {
    if (isLocalWallet) {
      alert('Local wallets do not exist on the blockchain and cannot be viewed in an explorer.');
      return;
    }
    window.open(`https://testnet.steexp.com/account/${contractId}`, '_blank');
  };

  return (
    <div className="space-y-4">
      <Card className="w-full">
        <CardHeader className="flex gap-3">
          <div className="flex flex-col">
            <p className="text-md">Your Wallet</p>
            <div className="flex items-center">
              {isLocalWallet ? (
                <Badge color="warning" className="ml-1">Offline Mode</Badge>
              ) : (
                <Badge color="success" className="ml-1">Testnet</Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <Divider />
        <CardBody>
          {isLocalWallet ? (
            <div className="bg-warning-50 text-warning-700 p-2 rounded-md mb-4">
              <p className="text-sm font-medium">
                This is a local wallet created while offline. It doesn't exist on the Stellar testnet.
              </p>
              <Button 
                size="sm" 
                variant="flat"
                color="warning"
                className="mt-2"
                onClick={handleDisconnect}
              >
                Disconnect and Try Again
              </Button>
            </div>
          ) : (
            <div className="bg-success-50 text-success-700 p-2 rounded-md mb-4">
              <p className="text-sm font-medium">
                Your wallet is connected to the Stellar testnet.
              </p>
            </div>
          )}

          <div className="mb-4">
            <p className="text-sm text-default-500">Wallet Address</p>
            <div className="flex items-center">
              <p className="break-all">{shortenAddress(contractId)}</p>
              <Button 
                size="sm" 
                variant="light"
                className="ml-2"
                onClick={handleCopyAddress}
              >
                Copy
              </Button>
            </div>
          </div>

          <div className="mb-4">
            <p className="text-sm text-default-500">Balance</p>
            <div className="flex items-center">
              <p>
                {isLoading ? (
                  <span className="flex items-center">
                    <Spinner size="sm" className="mr-1" />
                    Loading...
                  </span>
                ) : isLocalWallet ? (
                  'N/A (Local Wallet)'
                ) : (
                  `${balance || '0'} XLM`
                )}
              </p>

            </div>
          </div>

          {!isLocalWallet && (
            <FundWithLaunchtube />
          )}

          <Divider className="my-3" />
          
          <div className="flex justify-between">
            <Button 
              color="danger"
              variant="flat"
              onClick={handleDisconnect}
            >
              Disconnect
            </Button>
            
            {!isLocalWallet && (
              <Button
                color="primary"
                variant="flat"
                onClick={openExplorer}
              >
                View on Explorer
              </Button>
            )}
          </div>
        </CardBody>
      </Card>

      {/* Add Dead Man's Wallet Card */}
      {!isLocalWallet && <DeadMansWallet />}
    </div>
  );
};

export default ConnectedWallet;

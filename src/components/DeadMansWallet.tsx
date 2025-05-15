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

  return (
    <Card className="w-full">
      <CardHeader className="flex justify-between items-center">
        <div>
          <p className="text-md">Dead Man's Wallet</p>
          <p className="text-xs text-default-500">
            Protect your assets in case of inactivity
          </p>
        </div>
        {deadMansWallet.isConfigured && deadMansWallet.nextCheckInDeadline && (
          <Badge color={getBadgeColor()}>
            {timeExpired ? "EXPIRED!" : `${daysRemaining} days remaining`}
          </Badge>
        )}
      </CardHeader>
      <Divider />
      <CardBody>
        {isLoading ? (
          <div className="flex justify-center items-center p-6">
            <Spinner />
            <p className="ml-2">Loading...</p>
          </div>
        ) : deadMansWallet.isConfigured ? (
          <div>
            {timeExpired && (
              <div className="bg-danger-50 text-danger-700 p-3 rounded-md mb-4">
                <p className="font-medium">Your check-in deadline has expired!</p>
                <p className="text-sm mt-1">Funds may be transferred to the destination address soon.</p>
              </div>
            )}
            
            <div className="mb-4">
              <p className="text-sm text-default-500">Destination Address</p>
              <p className="font-medium break-all">{deadMansWallet.destinationAddress}</p>
            </div>
            
            <div className="mb-4">
              <p className="text-sm text-default-500">Check-in Period</p>
              <p className="font-medium">{deadMansWallet.checkInPeriod} days</p>
            </div>
            
            <div className="mb-4">
              <p className="text-sm text-default-500">Last Check-in</p>
              <p className="font-medium">{formatDate(deadMansWallet.lastCheckIn)}</p>
            </div>
            
            <div className="mb-6">
              <p className="text-sm text-default-500">Next Deadline</p>
              <p className={`font-medium ${timeExpired ? 'text-danger' : isUrgent ? 'text-warning' : ''}`}>
                {formatDate(deadMansWallet.nextCheckInDeadline)}
                {isUrgent && !timeExpired && " (Check in soon!)"}
                {timeExpired && " (EXPIRED!)"}
              </p>
            </div>
            
            <div className="flex justify-between">
              <Button 
                color="primary"
                onClick={handleCheckIn}
                isLoading={isLoading}
              >
                Check In Now
              </Button>
              
              <Button 
                color="secondary"
                variant="flat"
                onClick={() => {
                  setNewDestinationAddress(deadMansWallet.destinationAddress || '');
                  setNewCheckInPeriod(deadMansWallet.checkInPeriod.toString());
                  onOpen();
                }}
              >
                Edit Settings
              </Button>
            </div>
          </div>
        ) : (
          <div>
            <p className="mb-6">
              Configure your dead man's wallet to automatically transfer your funds to a designated address if you don't check in within the specified period.
            </p>
            
            <div className="flex justify-center">
              <Button 
                color="primary"
                onClick={onOpen}
              >
                Configure Dead Man's Wallet
              </Button>
            </div>
          </div>
        )}

        {/* Configuration Modal */}
        <Modal isOpen={isOpen} onClose={onClose}>
          <ModalContent>
            <ModalHeader>Configure Dead Man's Wallet</ModalHeader>
            <ModalBody>
              <div className="mb-4">
                <p className="mb-1 text-sm">Destination Address</p>
                <Input
                  type="text"
                  placeholder="Enter Stellar address"
                  value={newDestinationAddress}
                  onChange={(e) => setNewDestinationAddress(e.target.value)}
                />
                <p className="mt-1 text-xs text-default-500">
                  This address will receive your funds if you don't check in on time
                </p>
              </div>
              
              <div>
                <p className="mb-1 text-sm">Check-in Period (days)</p>
                <Input
                  type="number"
                  min={1}
                  max={365}
                  placeholder="Days between check-ins"
                  value={newCheckInPeriod}
                  onChange={(e) => setNewCheckInPeriod(e.target.value)}
                />
                <p className="mt-1 text-xs text-default-500">
                  You must confirm you're alive within this many days
                </p>
              </div>
            </ModalBody>
            <ModalFooter>
              <Button 
                color="danger" 
                variant="flat" 
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button 
                color="primary" 
                onClick={handleSaveSettings}
                isLoading={isLoading}
              >
                Save Settings
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </CardBody>
    </Card>
  );
};

export default DeadMansWallet; 
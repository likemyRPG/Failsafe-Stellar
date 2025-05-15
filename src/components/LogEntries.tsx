import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { WalletState } from '../store/walletSlice';
import {
  Button,
  Input,
  Spinner,
  Card,
  CardBody,
  Divider,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Tooltip
} from "@heroui/react";
import { toast } from 'react-toastify';

interface LogEntry {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

interface SimulationResult {
  [address: string]: {
    amount: number;
    name?: string;
  };
}

// Define types for different possible formats from the AI
interface BeneficiaryItem {
  wallet?: string;
  address?: string;
  percentage?: number | string;
  amount?: number | string;
  name?: string;
}

type PossibleValue = number | string | {
  amount?: number | string;
  percentage?: number | string;
  name?: string;
};

const LogEntries: React.FC = () => {
  const { contractId, deadMansWallet } = useSelector((state: { wallet: WalletState }) => state.wallet);
  const [logEntries, setLogEntries] = useState<LogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [newLogContent, setNewLogContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationResults, setSimulationResults] = useState<SimulationResult | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { 
    isOpen: isSimulationOpen, 
    onOpen: onOpenSimulation, 
    onClose: onCloseSimulation 
  } = useDisclosure();

  // Fetch log entries when component mounts
  useEffect(() => {
    if (contractId) {
      fetchLogEntries();
    }
  }, [contractId]);

  const fetchLogEntries = async () => {
    if (!contractId) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`/api/logs?address=${contractId}`);
      if (response.ok) {
        const data = await response.json();
        setLogEntries(data);
      } else {
        console.error('Failed to fetch log entries');
        toast.error('Could not load journal entries');
      }
    } catch (error) {
      console.error('Error fetching log entries:', error);
      toast.error('Error loading journal entries');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitLog = async () => {
    if (!contractId || !newLogContent.trim()) return;
    
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          address: contractId,
          content: newLogContent.trim()
        })
      });
      
      if (response.ok) {
        // Clear the input and refresh entries
        setNewLogContent('');
        onClose();
        fetchLogEntries();
        toast.success('Journal entry saved successfully');
      } else {
        console.error('Failed to create log entry');
        toast.error('Could not save journal entry');
      }
    } catch (error) {
      console.error('Error creating log entry:', error);
      toast.error('Error saving journal entry');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteLog = async (id: string) => {
    if (!confirm('Are you sure you want to delete this journal entry?')) return;
    
    try {
      const response = await fetch(`/api/logs?id=${id}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        // Remove from local state
        setLogEntries(prevEntries => prevEntries.filter(entry => entry.id !== id));
        toast.success('Journal entry deleted');
      } else {
        console.error('Failed to delete log entry');
        toast.error('Could not delete journal entry');
      }
    } catch (error) {
      console.error('Error deleting log entry:', error);
      toast.error('Error deleting journal entry');
    }
  };

  const simulateAllocation = async () => {
    if (!contractId) return;
    
    setIsSimulating(true);
    try {
      const response = await fetch('/api/ai/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          address: contractId
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Simulation result:', data);
        
        // Parse the result
        if (data.result) {
          try {
            const parsedResult = JSON.parse(data.result);
            
            // Process the results to match beneficiary names if possible
            const processedResults: SimulationResult = {};
            
            // Check different possible formats and normalize
            if (typeof parsedResult === 'object') {
              const beneficiaryMap = new Map<string, string>();
              
              // Create a map of addresses to names from the wallet's beneficiaries
              if (deadMansWallet?.beneficiaries?.length) {
                deadMansWallet.beneficiaries.forEach(beneficiary => {
                  beneficiaryMap.set(beneficiary.walletAddress.toLowerCase(), beneficiary.name);
                });
              }
              
              // Process different possible formats from the AI
              if (Array.isArray(parsedResult)) {
                // Handle array format: [{wallet: "address", percentage: 50, name: "John"}]
                parsedResult.forEach((item: BeneficiaryItem) => {
                  const address = item.wallet || item.address || '';
                  const amount = parseFloat(String(item.percentage || item.amount || 0));
                  const name = item.name || beneficiaryMap.get(address.toLowerCase()) || 'Unknown';
                  
                  if (address && !isNaN(amount)) {
                    processedResults[address] = { amount, name };
                  }
                });
              } else {
                // Handle object format: {"address1": 50, "address2": 50} or {"address1": {"amount": 50, "name": "John"}}
                Object.entries(parsedResult).forEach(([key, value]) => {
                  const address = key;
                  let amount = 0;
                  let name = beneficiaryMap.get(address.toLowerCase()) || 'Unknown';
                  
                  if (typeof value === 'number') {
                    amount = value;
                  } else if (typeof value === 'string') {
                    amount = parseFloat(value);
                  } else if (typeof value === 'object' && value !== null) {
                    const objValue = value as Record<string, any>;
                    amount = parseFloat(String(objValue.amount || objValue.percentage || 0));
                    name = objValue.name || name;
                  }
                  
                  if (!isNaN(amount)) {
                    processedResults[address] = { amount, name };
                  }
                });
              }
            }
            
            setSimulationResults(processedResults);
            onOpenSimulation();
          } catch (error) {
            console.error('Error parsing simulation result:', error);
            toast.error('Error parsing AI allocation simulation');
          }
        } else {
          toast.error('Invalid simulation result format');
        }
      } else {
        console.error('Failed to run simulation');
        toast.error('Failed to run allocation simulation');
      }
    } catch (error) {
      console.error('Error running simulation:', error);
      toast.error('Error running allocation simulation');
    } finally {
      setIsSimulating(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-base font-medium">Personal Journal</h2>
        <div className="flex gap-2">
          <Tooltip content="Simulate AI funds allocation based on your journal entries">
            <Button 
              color="default"
              variant="flat"
              size="sm"
              className="text-xs h-8 px-2"
              onClick={simulateAllocation}
              isLoading={isSimulating}
              isDisabled={isSimulating || logEntries.length === 0}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Simulate
            </Button>
          </Tooltip>
          <Button 
            color="primary"
            size="sm"
            className="text-xs h-8 px-3"
            onClick={onOpen}
          >
            Add Entry
          </Button>
        </div>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center items-center py-6">
          <Spinner color="primary" size="sm" />
        </div>
      ) : logEntries.length === 0 ? (
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">No journal entries yet.</p>
          <p className="text-xs mt-1 text-gray-400 dark:text-gray-500">
            Add journal entries to guide the AI in distributing your assets.
          </p>
          <Button 
            color="primary" 
            variant="flat" 
            className="mt-3 text-xs h-8"
            onClick={onOpen}
          >
            Create First Entry
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {logEntries.map((entry) => (
            <Card key={entry.id} className="bg-white dark:bg-gray-800/70 overflow-hidden">
              <CardBody className="p-3">
                <div className="flex justify-between items-start mb-1">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {formatDate(entry.createdAt)}
                  </p>
                  <Button
                    color="danger"
                    variant="light"
                    size="sm"
                    className="min-w-0 h-6 px-1.5"
                    onClick={() => handleDeleteLog(entry.id)}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </Button>
                </div>
                <p className="text-sm whitespace-pre-wrap break-words">
                  {entry.content}
                </p>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
      
      {/* Add Log Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="sm">
        <ModalContent>
          <ModalHeader className="text-base">Add Journal Entry</ModalHeader>
          <ModalBody>
            <div className="space-y-2">
              <label className="text-sm font-medium">Journal Content</label>
              <textarea
                placeholder="Write your journal entry here..."
                value={newLogContent}
                onChange={(e) => setNewLogContent(e.target.value)}
                className="w-full min-h-[120px] rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 p-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button 
              color="default" 
              variant="flat" 
              onClick={onClose}
              className="text-xs h-8"
            >
              Cancel
            </Button>
            <Button 
              color="primary" 
              onClick={handleSubmitLog}
              isLoading={isSubmitting}
              isDisabled={!newLogContent.trim()}
              className="text-xs h-8"
            >
              Save Entry
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Simulation Results Modal */}
      <Modal isOpen={isSimulationOpen} onClose={onCloseSimulation} size="sm">
        <ModalContent>
          <ModalHeader className="text-base">AI Allocation Simulation</ModalHeader>
          <ModalBody>
            <div className="space-y-3">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Based on your journal entries, here's how the AI would allocate your assets:
              </p>
              
              {simulationResults && Object.keys(simulationResults).length > 0 ? (
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                  <div className="bg-gray-50 dark:bg-gray-800 px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                    <div className="grid grid-cols-3">
                      <div>Beneficiary</div>
                      <div>Address</div>
                      <div className="text-right">Allocation</div>
                    </div>
                  </div>
                  <div className="divide-y divide-gray-200 dark:divide-gray-700">
                    {Object.entries(simulationResults).map(([address, data], index) => (
                      <div key={index} className="px-3 py-2 text-xs">
                        <div className="grid grid-cols-3">
                          <div className="font-medium text-gray-900 dark:text-gray-100 truncate pr-2">
                            {data.name || 'Unknown'}
                          </div>
                          <div className="text-gray-500 dark:text-gray-400 truncate pr-2">
                            {address.slice(0, 6)}...{address.slice(-4)}
                          </div>
                          <div className="text-right font-medium text-gray-900 dark:text-gray-100">
                            {data.amount}%
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center p-4">
                  <p className="text-sm text-gray-500 dark:text-gray-400">No allocation data available</p>
                </div>
              )}
              
              <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg text-xs text-gray-500 dark:text-gray-400">
                <p className="mb-1 font-medium">Note:</p>
                <p>This is a simulation only. The actual distribution will occur based on your configured rules and journal entries at the time of execution.</p>
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button 
              color="primary" 
              onClick={onCloseSimulation}
              className="text-xs h-8"
            >
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
};

export default LogEntries; 
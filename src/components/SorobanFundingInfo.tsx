import React from 'react';

const SorobanFundingInfo: React.FC = () => {
  return (
    <div className="bg-gray-50 p-4 rounded-lg mt-2 text-sm">
      <h3 className="font-semibold mb-2">About Soroban Contract Funding</h3>
      
      <div className="mb-3">
        <h4 className="font-medium">Two funding options:</h4>
        <ol className="list-decimal pl-5 mt-1 space-y-1">
          <li>
            <span className="font-medium text-green-700">Direct Launchtube</span>: Recommended, uses a 
            special API that can directly fund contract accounts
          </li>
          <li>
            <span className="font-medium text-blue-700">Creator Account</span>: Alternative approach, 
            funds the account that created your contract
          </li>
        </ol>
      </div>
      
      <p className="mb-2">
        Unlike regular Stellar accounts, Soroban contracts have special funding requirements. 
        Typically, they require their <span className="font-medium">creator account</span> to be funded, 
        but Launchtube provides a direct funding mechanism.
      </p>
      
      <div className="mb-2">
        <h4 className="font-medium">How it works:</h4>
        <ul className="list-disc pl-5 mt-1 space-y-1">
          <li>The <span className="text-green-700">Direct Launchtube</span> approach bypasses normal restrictions</li>
          <li>The <span className="text-blue-700">Creator Account</span> approach finds and funds the account that created your contract</li>
          <li>Once funded, your contract can execute transactions</li>
        </ul>
      </div>
      
      <div className="mb-2">
        <h4 className="font-medium">Common errors:</h4>
        <ul className="list-disc pl-5 mt-1 space-y-1">
          <li><span className="text-red-600 font-mono text-xs">Error(Auth, InvalidAction)</span> - The contract can't accept standard funding</li>
          <li><span className="text-red-600 font-mono text-xs">Error(Value, UnexpectedType)</span> - Authentication for funding failed</li>
          <li><span className="text-red-600 font-mono text-xs">timeBounds.maxTime too far into the future</span> - Transaction timeout issue</li>
        </ul>
      </div>
      
      <div className="text-xs italic">
        Note: If automatic funding fails, you can always use the Stellar Laboratory to manually fund the creator account.
      </div>
    </div>
  );
};

export default SorobanFundingInfo; 
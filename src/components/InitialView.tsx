import React from "react";
import { ActionButton, GradientText, TabButton, TabContainer } from "./StyledComponents";

type InitialViewProps = {
  onConnectClick: () => void;
};

export const InitialView: React.FC<InitialViewProps> = ({ onConnectClick }) => {
  return (
    <div className="flex flex-col w-full gap-5">
      <div className="flex items-center justify-center mb-2">
        <div className="relative">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg transform rotate-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full border-2 border-white dark:border-gray-900"></div>
        </div>
      </div>

      <div className="relative">
        <div className="bg-white/70 dark:bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-200 dark:border-gray-700/50 p-3 shadow-sm">
          <ol className="space-y-1.5 text-sm text-foreground-700 dark:text-gray-300 pl-7 relative">
            <div className="absolute top-0 bottom-0 left-3 w-px bg-blue-100 dark:bg-blue-900/30"></div>
            {[
              "Connect your Stellar wallet",
              "Set a designated beneficiary address",
              "Choose your check-in period (e.g., 30 days)",
              "Check in regularly to verify you're still in control",
              "If you miss a check-in, funds are sent to your beneficiary"
            ].map((step, index) => (
              <li key={index} className="relative">
                <div className="absolute left-[-21px] rounded-full w-4 h-4 flex items-center justify-center bg-blue-500 dark:bg-blue-600 text-white text-xs">
                  {index + 1}
                </div>
                {step}
              </li>
            ))}
          </ol>
        </div>

        <div className="absolute -right-3 -bottom-3 opacity-40 dark:opacity-20">
          <svg width="60" height="60" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
            <path d="M50 0 L95 25 L95 75 L50 100 L5 75 L5 25 Z" fill="none" stroke="currentColor" strokeWidth="5" />
          </svg>
        </div>
      </div>

      <div className="border-t border-b dark:border-gray-800/60 py-3 -mx-5 px-5 my-1">
        <div className="flex flex-wrap gap-2">
          {["Estate planning", "Asset security", "Peace of mind"].map((tag, i) => (
            <span key={i} className="bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 px-2 py-0.5 text-xs rounded-md">
              {tag}
            </span>
          ))}
        </div>
      </div>

      <ActionButton
        onClick={onConnectClick}
        className="w-full justify-center"
      >
        Get Started
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
        </svg>
      </ActionButton>
    </div>
  );
};

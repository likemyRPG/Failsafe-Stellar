// src/components/StyledComponents.tsx
import { Button, Input } from "@heroui/react";
import React, { ReactNode } from "react";

export const StyledTextField = ({ ...props }: React.ComponentProps<typeof Input>) => (
    <Input 
        {...props}
        className="bg-transparent dark:bg-transparent border-1 border-gray-300 dark:border-gray-700 rounded-lg"
        radius="md"
        variant="bordered"
    />
);

export const ActionButton = ({ children, ...props }: React.ComponentProps<typeof Button> & { children: ReactNode }) => (
    <Button
        {...props}
        className="flex items-center gap-2 bg-gray-900 hover:bg-black dark:bg-gray-800 dark:hover:bg-gray-700 text-white rounded-lg py-2 transition-all"
        radius="md"
    >
        {children}
    </Button>
);

export const SecondaryButton = ({ children, ...props }: React.ComponentProps<typeof Button> & { children: ReactNode }) => (
    <Button
        {...props}
        className="bg-transparent text-gray-700 dark:text-gray-300 rounded-lg py-2 border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
        radius="md"
    >
        {children}
    </Button>
);

export const StyledPaper = ({ children }: { children: ReactNode }) => (
    <div className="flex flex-col items-center gap-5 w-full max-w-[400px] mx-auto">
        {children}
    </div>
);

export const CardContainer = ({ children, className = "" }: { children: ReactNode, className?: string }) => (
    <div className={`p-4 flex flex-col gap-3 bg-white/70 dark:bg-gray-900/70 backdrop-blur-sm rounded-xl border border-gray-200 dark:border-gray-800 ${className}`}>
        {children}
    </div>
);

export const BackButton = ({ children, ...props }: React.ComponentProps<typeof Button> & { children: ReactNode }) => (
    <Button
        {...props}
        className="self-start text-gray-500 dark:text-gray-400 hover:bg-transparent hover:text-gray-800 dark:hover:text-white p-0 h-auto min-w-0"
        variant="light"
    >
        {children}
    </Button>
);

export const WhiteIconButton = ({ children, ...props }: React.ComponentProps<typeof Button> & { children: ReactNode }) => (
    <Button
        {...props}
        isIconOnly
        className="text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
        variant="light"
        size="sm"
    >
        {children}
    </Button>
);

export const GradientText = ({ children, className = "" }: { children: ReactNode, className?: string }) => (
    <span className={`text-gray-900 dark:text-white font-semibold ${className}`}>
        {children}
    </span>
);

export const TabContainer = ({ children, className = "" }: { children: ReactNode, className?: string }) => (
    <div className={`flex items-center gap-1 p-1 bg-gray-100 dark:bg-gray-800/60 rounded-lg ${className}`}>
        {children}
    </div>
);

export const TabButton = ({ children, active = false, ...props }: React.ComponentProps<typeof Button> & { children: ReactNode, active?: boolean }) => (
    <Button
        {...props}
        className={`${active ? 'bg-white dark:bg-gray-700 shadow-sm' : 'bg-transparent hover:bg-gray-200 dark:hover:bg-gray-700/70'} text-xs font-medium py-1.5 px-3 rounded-md transition-all`}
        size="sm"
        variant="flat"
    >
        {children}
    </Button>
);

export const SectionHeader = ({ children }: { children: ReactNode }) => (
    <h2 className="text-base font-medium dark:text-white flex items-center gap-2">
        {children}
    </h2>
);

export const Badge = ({ children, color = "default" }: { children: ReactNode, color?: "default" | "primary" | "success" | "warning" | "danger" }) => {
    const colorClasses = {
        default: "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200",
        primary: "bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200",
        success: "bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300",
        warning: "bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-300",
        danger: "bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300"
    };
    
    return (
        <span className={`px-2 py-0.5 text-xs font-medium rounded-md ${colorClasses[color]}`}>
            {children}
        </span>
    );
};

export const InfoBox = ({ children, color = "default", icon }: { children: ReactNode, color?: "default" | "primary" | "success" | "warning" | "danger", icon?: ReactNode }) => {
    const colorClasses = {
        default: "bg-gray-50 dark:bg-gray-800/40 border-gray-200 dark:border-gray-700/50 text-gray-700 dark:text-gray-300",
        primary: "bg-gray-50 dark:bg-gray-800/40 border-gray-200 dark:border-gray-700/50 text-gray-700 dark:text-gray-300",
        success: "bg-green-50 dark:bg-green-900/20 border-green-100 dark:border-green-900/30 text-green-800 dark:text-green-300",
        warning: "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-100 dark:border-yellow-900/30 text-yellow-800 dark:text-yellow-300",
        danger: "bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-900/30 text-red-800 dark:text-red-300"
    };
    
    return (
        <div className={`p-3 rounded-lg border ${colorClasses[color]} text-sm`}>
            {icon && (
                <div className="flex items-start">
                    <div className="mt-0.5 mr-2 flex-shrink-0">{icon}</div>
                    <div>{children}</div>
                </div>
            )}
            {!icon && children}
        </div>
    );
};

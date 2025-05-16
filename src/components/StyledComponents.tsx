// src/components/StyledComponents.tsx
import { Button, Input } from "@heroui/react";
import React, { ReactNode } from "react";

export const StyledTextField = ({ ...props }: React.ComponentProps<typeof Input>) => (
    <Input 
        {...props}
        className="bg-transparent dark:bg-transparent border-1 border-gray-300 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-accent focus:ring-opacity-50 transition-all"
        radius="lg"
        variant="bordered"
    />
);

export const ActionButton = ({ children, ...props }: React.ComponentProps<typeof Button> & { children: ReactNode }) => (
    <Button
        {...props}
        className="flex items-center gap-2 btn-gradient text-white rounded-xl py-2.5 transition-all shadow-md hover:shadow-xl"
        radius="lg"
    >
        {children}
    </Button>
);

export const SecondaryButton = ({ children, ...props }: React.ComponentProps<typeof Button> & { children: ReactNode }) => (
    <Button
        {...props}
        className="bg-white/60 dark:bg-card/60 text-gray-700 dark:text-gray-200 rounded-xl py-2.5 border border-gray-200 dark:border-[var(--border-color)] hover:bg-white dark:hover:bg-[var(--card-background)] transition-all shadow-sm hover:shadow-md backdrop-blur-sm"
        radius="lg"
    >
        {children}
    </Button>
);

export const StyledPaper = ({ children }: { children: ReactNode }) => (
    <div className="flex flex-col items-center gap-6 w-full max-w-[420px] mx-auto">
        {children}
    </div>
);

export const CardContainer = ({ children, className = "" }: { children: ReactNode, className?: string }) => (
    <div className={`p-5 flex flex-col gap-4 glass-card rounded-2xl ${className}`}>
        {children}
    </div>
);

export const BackButton = ({ children, ...props }: React.ComponentProps<typeof Button> & { children: ReactNode }) => (
    <Button
        {...props}
        className="self-start text-gray-500 dark:text-gray-300 hover:bg-transparent hover:text-primary dark:hover:text-accent p-0 h-auto min-w-0"
        variant="light"
    >
        {children}
    </Button>
);

export const WhiteIconButton = ({ children, ...props }: React.ComponentProps<typeof Button> & { children: ReactNode }) => (
    <Button
        {...props}
        isIconOnly
        className="text-gray-700 dark:text-gray-200 bg-white/80 dark:bg-card/80 hover:bg-white/100 dark:hover:bg-card/100 shadow-sm rounded-xl backdrop-blur-sm transition-all"
        size="sm"
    >
        {children}
    </Button>
);

export const GradientText = ({ children, className = "" }: { children: ReactNode, className?: string }) => (
    <span className={`bg-clip-text text-transparent bg-gradient-to-r from-sky-600 to-blue-600 dark:from-sky-400 dark:to-blue-500 font-semibold ${className}`}>
        {children}
    </span>
);

export const TabContainer = ({ children, className = "" }: { children: ReactNode, className?: string }) => (
    <div className={`flex items-center gap-1 p-1.5 bg-white/50 dark:bg-card/40 rounded-xl backdrop-blur-sm shadow-sm ${className}`}>
        {children}
    </div>
);

export const TabButton = ({ children, active = false, ...props }: React.ComponentProps<typeof Button> & { children: ReactNode, active?: boolean }) => (
    <Button
        {...props}
        className={`${active ? 'bg-white dark:bg-[var(--secondary-color)] shadow-sm' : 'bg-transparent hover:bg-gray-100 dark:hover:bg-[var(--secondary-color)]/70'} text-xs font-medium py-2 px-4 rounded-lg transition-all`}
        size="sm"
        variant="flat"
    >
        {children}
    </Button>
);

export const SectionHeader = ({ children }: { children: ReactNode }) => (
    <h2 className="text-base font-medium text-gray-800 dark:text-gray-100 flex items-center gap-2">
        {children}
    </h2>
);

export const Badge = ({ children, color = "default" }: { children: ReactNode, color?: "default" | "primary" | "success" | "warning" | "danger" }) => {
    const colorClasses = {
        default: "bg-gray-100/80 dark:bg-[var(--secondary-color)]/80 text-gray-800 dark:text-gray-200",
        primary: "bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary-200",
        success: "bg-green-100/80 dark:bg-green-900/40 text-green-700 dark:text-green-300",
        warning: "bg-yellow-100/80 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300",
        danger: "bg-red-100/80 dark:bg-red-900/40 text-red-700 dark:text-red-300"
    };
    
    return (
        <span className={`px-2.5 py-1 text-xs font-medium rounded-full backdrop-blur-sm ${colorClasses[color]}`}>
            {children}
        </span>
    );
};

export const InfoBox = ({ children, color = "default", icon }: { children: ReactNode, color?: "default" | "primary" | "success" | "warning" | "danger", icon?: ReactNode }) => {
    const colorClasses = {
        default: "bg-gray-50/70 dark:bg-[var(--secondary-color)]/30 border-gray-200/80 dark:border-[var(--border-color)]/40 text-gray-700 dark:text-gray-300",
        primary: "bg-primary/5 dark:bg-primary/10 border-primary/20 dark:border-primary/30 text-primary-800 dark:text-primary-200",
        success: "bg-green-50/70 dark:bg-green-900/10 border-green-100/80 dark:border-green-900/20 text-green-700 dark:text-green-300",
        warning: "bg-yellow-50/70 dark:bg-yellow-900/10 border-yellow-100/80 dark:border-yellow-900/20 text-yellow-700 dark:text-yellow-300",
        danger: "bg-red-50/70 dark:bg-red-900/10 border-red-100/80 dark:border-red-900/20 text-red-700 dark:text-red-300"
    };
    
    return (
        <div className={`p-4 rounded-xl border backdrop-blur-sm ${colorClasses[color]} text-sm shadow-sm`}>
            {icon && (
                <div className="flex items-start">
                    <div className="mt-0.5 mr-2.5 flex-shrink-0">{icon}</div>
                    <div>{children}</div>
                </div>
            )}
            {!icon && children}
        </div>
    );
};

// New component: Floating Icon
export const FloatingIcon = ({ children, className = "" }: { children: ReactNode, className?: string }) => (
    <div className={`float-animation ${className}`}>
        {children}
    </div>
);

// New component: Card with hover effect
export const HoverCard = ({ children, className = "" }: { children: ReactNode, className?: string }) => (
    <div className={`p-5 glass-card rounded-2xl transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${className}`}>
        {children}
    </div>
);

// New component: Decorated Header
export const DecoratedHeader = ({ children, className = "" }: { children: ReactNode, className?: string }) => (
    <h1 className={`relative z-10 text-2xl font-bold text-gray-800 dark:text-gray-100 ${className}`}>
        <span className="relative inline-block">
            {children}
        </span>
    </h1>
);

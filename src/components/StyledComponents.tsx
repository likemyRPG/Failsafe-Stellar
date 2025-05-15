// src/components/StyledComponents.tsx
import { Button, Input } from "@heroui/react";
import React, { ReactNode } from "react";

export const StyledTextField = ({ ...props }: React.ComponentProps<typeof Input>) => (
    <Input 
        {...props}
        className="bg-background rounded-xl"
        radius="lg"
        variant="bordered"
    />
);

export const ActionButton = ({ children, ...props }: React.ComponentProps<typeof Button> & { children: ReactNode }) => (
    <Button
        {...props}
        className="flex items-center gap-2 bg-primary text-primary-foreground rounded-xl py-3"
        color="primary"
        radius="lg"
    >
        {children}
    </Button>
);

export const SecondaryButton = ({ children, ...props }: React.ComponentProps<typeof Button> & { children: ReactNode }) => (
    <Button
        {...props}
        className="bg-secondary text-foreground rounded-xl py-3"
        color="secondary"
        radius="lg"
    >
        {children}
    </Button>
);

export const StyledPaper = ({ children }: { children: ReactNode }) => (
    <div className="p-6 flex flex-col items-center gap-4 bg-background rounded-2xl w-[400px] mx-auto shadow-md">
        {children}
    </div>
);

export const BackButton = ({ children, ...props }: React.ComponentProps<typeof Button> & { children: ReactNode }) => (
    <Button
        {...props}
        className="self-start text-foreground-500 hover:bg-transparent hover:text-foreground"
        variant="light"
    >
        {children}
    </Button>
);

export const WhiteIconButton = ({ children, ...props }: React.ComponentProps<typeof Button> & { children: ReactNode }) => (
    <Button
        {...props}
        isIconOnly
        className="text-white"
        variant="light"
    >
        {children}
    </Button>
);

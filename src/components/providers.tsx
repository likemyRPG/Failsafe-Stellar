'use client'
import { store } from "@/store/store";
import { HeroUIProvider } from "@heroui/react";
import { Provider } from "react-redux";


export const Providers = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-1">
        <Provider store={store}>
            <HeroUIProvider>
                {children}
            </HeroUIProvider>
        </Provider>
        </div>
    </div>
  );
}
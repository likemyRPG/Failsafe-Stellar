'use client'
import { store } from "@/store/store";
import { HeroUIProvider } from "@heroui/react";
import { Provider } from "react-redux";
import { ThemeProvider } from 'next-themes';

export const Providers = ({ children }: { children: React.ReactNode }) => {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <Provider store={store}>
        <HeroUIProvider>
          <div className="flex flex-col min-h-screen">
            <div className="flex-1">
              {children}
            </div>
          </div>
        </HeroUIProvider>
      </Provider>
    </ThemeProvider>
  );
}
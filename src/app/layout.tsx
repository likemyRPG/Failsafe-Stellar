import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Failsafe | Stellar Blockchain",
  description: "A secure dead man's switch for your Stellar assets - ensuring your funds reach the right people in case of inactivity",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased dark:bg-[#0d1117] min-h-screen text-foreground dark:text-white`}
      >
        <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top_right,rgba(35,70,156,0.15),transparent_25%),radial-gradient(circle_at_left,rgba(93,30,152,0.1),transparent_25%)] dark:bg-[radial-gradient(circle_at_top_right,rgba(35,70,156,0.15),transparent_40%),radial-gradient(circle_at_left,rgba(93,30,152,0.15),transparent_40%)]"></div>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}

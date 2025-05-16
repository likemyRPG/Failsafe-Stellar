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
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen text-foreground dark:text-[var(--text-color)]`}
      >
        {/* Custom background shapes */}
        <div className="fixed inset-0 -z-10">
          {/* Gradient background is applied via CSS in globals.css */}
          
          {/* Decorative elements */}
          <div className="fixed top-20 right-[10%] w-72 h-72 bg-gradient-to-br from-sky-300/10 to-blue-300/10 dark:from-sky-500/5 dark:to-blue-500/5 rounded-full blur-3xl"></div>
          <div className="fixed bottom-20 left-[5%] w-96 h-96 bg-gradient-to-tr from-blue-300/10 to-cyan-300/10 dark:from-blue-500/5 dark:to-cyan-500/5 rounded-full blur-3xl"></div>
          
          {/* Subtle grid pattern */}
          <div className="fixed inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMyMTI5MzciIGZpbGwtb3BhY2l0eT0iMC4wMiI+PHBhdGggZD0iTTM2IDM0aDR2MWgtNHYtMXptMC0yaDF2NGgtMXYtNHptMi0yaDF2MWgtMXYtMXptLTIgMmgxdjFoLTF2LTF6TTM0IDI5aDR2MWgtNHYtMXptMC0yaDF2NGgtMXYtNHptMi0yaDF2MWgtMXYtMXptLTIgMmgxdjFoLTF2LTF6TTMyIDI0aDR2MWgtNHYtMXptMC0yaDF2NGgtMXYtNHptMi0yaDF2MWgtMXYtMXptLTIgMmgxdjFoLTF2LTF6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-40 dark:opacity-20"></div>
        </div>

        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}

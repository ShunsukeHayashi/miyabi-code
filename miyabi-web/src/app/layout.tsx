import type { Metadata } from "next";
import "./globals.css";
// Toaster temporarily disabled due to import resolution issue
// import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  title: "Miyabi Web Platform",
  description: "Autonomous AI Agent Orchestration Platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body>
        {children}
        {/* <Toaster /> */}
      </body>
    </html>
  );
}

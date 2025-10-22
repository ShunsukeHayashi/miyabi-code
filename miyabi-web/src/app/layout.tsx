import type { Metadata } from "next";
import "./globals.css";

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
      <body>{children}</body>
    </html>
  );
}

import type { Metadata } from 'next';
import { HeroUIProvider } from '@heroui/react';
import '@/styles/globals.css';

export const metadata: Metadata = {
  title: 'BDR Hunter',
  description: 'AI-powered BDR research and analysis platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>
        <HeroUIProvider>
          {children}
        </HeroUIProvider>
      </body>
    </html>
  );
}

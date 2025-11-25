/**
 * Root Layout
 * Issue: #1017 - Pantheon Webapp
 * Updated: #980 - Phase 3.3: Real-Time WebSocket Integration
 */

import type { Metadata } from 'next';
import './globals.css';
import { Providers, NavbarContent } from './providers';

export const metadata: Metadata = {
  title: 'Pantheon Webapp - Miyabi Integration',
  description: 'Real-time integration dashboard for Miyabi Agent system',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Providers>
          <NavbarContent />
          <main>{children}</main>
        </Providers>
      </body>
    </html>
  );
}

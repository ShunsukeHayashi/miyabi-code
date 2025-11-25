/**
 * App Providers
 * Issue: #980 - Phase 3.3: Real-Time WebSocket Integration
 * Issue: #981 - Phase 3.4: Authentication Flow Implementation
 *
 * Wraps the application with necessary providers:
 * - Auth Provider for authentication state
 * - WebSocket Provider for real-time updates
 * - Toast Provider for notifications
 */

'use client';

import { WebSocketProvider } from './contexts/WebSocketContext';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from '../components/ui/Toast';
import { NavbarConnectionStatus } from '../components/LiveStatusIndicator';
import { NavbarUserProfile } from './components/UserProfile';

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <AuthProvider>
      <ToastProvider maxToasts={5} defaultDuration={5000}>
        <WebSocketProvider autoConnect={true} fallbackPollingInterval={30000}>
          {children}
        </WebSocketProvider>
      </ToastProvider>
    </AuthProvider>
  );
}

/**
 * Navbar with connection status
 * Separate client component for use in server layout
 */
export function NavbarContent() {
  return (
    <nav className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <a href="/" className="text-xl font-bold text-gray-900 dark:text-white">
              🏛️ Pantheon
            </a>
          </div>
          <div className="flex items-center space-x-4">
            <a
              href="/dashboard"
              className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white px-3 py-2 rounded-md text-sm font-medium"
            >
              Dashboard
            </a>
            <a
              href="/about"
              className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white px-3 py-2 rounded-md text-sm font-medium"
            >
              About
            </a>
            <a
              href="/divisions"
              className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white px-3 py-2 rounded-md text-sm font-medium"
            >
              Divisions
            </a>
            <a
              href="/advisors"
              className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white px-3 py-2 rounded-md text-sm font-medium"
            >
              Advisors
            </a>
            <a
              href="/miyabi-integration"
              className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white px-3 py-2 rounded-md text-sm font-medium"
            >
              Miyabi
            </a>
            <div className="hidden sm:flex items-center pl-4 border-l border-gray-200 dark:border-gray-700">
              <NavbarConnectionStatus />
            </div>
            <div className="flex items-center pl-4 border-l border-gray-200 dark:border-gray-700">
              <NavbarUserProfile />
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Providers;

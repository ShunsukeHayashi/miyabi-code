/**
 * OAuth Callback Page
 * Issue: #981 - Phase 3.4: Authentication Flow Implementation
 *
 * Handles the GitHub OAuth callback:
 * 1. Extracts code and state from URL
 * 2. Exchanges code for tokens via AuthContext
 * 3. Redirects to dashboard on success
 * 4. Shows error on failure
 */

'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';

function CallbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { handleOAuthCallback, error } = useAuth();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const processCallback = async () => {
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const urlError = searchParams.get('error');
      const errorDescription = searchParams.get('error_description');

      // Check for OAuth errors from GitHub
      if (urlError) {
        setStatus('error');
        setErrorMessage(errorDescription || urlError);
        return;
      }

      // Check for missing code
      if (!code) {
        setStatus('error');
        setErrorMessage('No authorization code received');
        return;
      }

      // Process the callback
      const success = await handleOAuthCallback(code, state || undefined);

      if (success) {
        setStatus('success');
        // Get redirect path from session storage
        const redirectPath = sessionStorage.getItem('auth_redirect') || '/dashboard';
        sessionStorage.removeItem('auth_redirect');

        // Short delay to show success state
        setTimeout(() => {
          router.push(redirectPath);
        }, 1000);
      } else {
        setStatus('error');
        setErrorMessage(error || 'Authentication failed');
      }
    };

    processCallback();
  }, [searchParams, handleOAuthCallback, error, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 px-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/2 -right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-1/2 -left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 text-center">
        {status === 'processing' && (
          <div className="flex flex-col items-center">
            <div className="w-20 h-20 rounded-full bg-purple-500/20 flex items-center justify-center mb-6">
              <svg className="w-10 h-10 text-purple-400 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Authenticating...</h1>
            <p className="text-gray-400">Please wait while we complete your login</p>
          </div>
        )}

        {status === 'success' && (
          <div className="flex flex-col items-center">
            <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mb-6">
              <svg className="w-10 h-10 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Welcome!</h1>
            <p className="text-gray-400">Redirecting to dashboard...</p>
          </div>
        )}

        {status === 'error' && (
          <div className="flex flex-col items-center max-w-md">
            <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center mb-6">
              <svg className="w-10 h-10 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Authentication Failed</h1>
            <p className="text-gray-400 mb-6">{errorMessage || 'An error occurred during authentication'}</p>
            <div className="flex gap-4">
              <button
                onClick={() => router.push('/login')}
                className="px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white font-medium rounded-lg transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={() => router.push('/')}
                className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors"
              >
                Go Home
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function CallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
        <div className="animate-pulse">
          <div className="w-20 h-20 rounded-full bg-purple-500/20" />
        </div>
      </div>
    }>
      <CallbackContent />
    </Suspense>
  );
}

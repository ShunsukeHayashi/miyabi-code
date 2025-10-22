'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { api } from '@/lib/api';
import type { TokenResponse } from '@/types/auth';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setAuth, setLoading, setError, isAuthenticated } = useAuthStore();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    // Check if already authenticated
    if (isAuthenticated) {
      router.push('/dashboard');
      return;
    }

    // Handle OAuth callback
    const code = searchParams.get('code');
    if (code) {
      handleOAuthCallback(code);
    }
  }, [isAuthenticated, searchParams]);

  const handleOAuthCallback = async (code: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.get<TokenResponse>(`/auth/github/callback`, {
        params: { code },
      });

      setAuth(response.data);
      router.push('/dashboard');
    } catch (error: any) {
      const message =
        error.response?.data?.message || 'Authentication failed. Please try again.';
      setError(message);
      setErrorMessage(message);
    } finally {
      setLoading(false);
    }
  };

  const handleGitHubLogin = () => {
    const clientId = process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID;
    const redirectUri = `${window.location.origin}/login`;
    const scope = 'read:user user:email';

    const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}`;
    window.location.href = githubAuthUrl;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="max-w-md w-full space-y-8 p-10 bg-white rounded-xl shadow-2xl">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            🤖 Miyabi
          </h1>
          <p className="text-gray-600 text-sm">
            Autonomous AI Agent Orchestration Platform
          </p>
        </div>

        <div className="mt-8 space-y-6">
          {errorMessage && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-800">{errorMessage}</p>
            </div>
          )}

          <button
            onClick={handleGitHubLogin}
            disabled={!!searchParams.get('code')}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 border border-transparent text-base font-medium rounded-lg text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg
              className="w-6 h-6"
              fill="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                clipRule="evenodd"
              />
            </svg>
            {searchParams.get('code') ? 'Authenticating...' : 'Sign in with GitHub'}
          </button>

          <div className="text-center text-sm text-gray-600">
            <p>By signing in, you agree to our Terms of Service</p>
            <p>and Privacy Policy</p>
          </div>
        </div>

        <div className="border-t border-gray-200 pt-6 mt-6">
          <div className="text-center space-y-2">
            <p className="text-xs text-gray-500">
              Powered by Rust + Axum + PostgreSQL
            </p>
            <p className="text-xs text-gray-500">
              Next.js 14 + React 18 + TypeScript
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

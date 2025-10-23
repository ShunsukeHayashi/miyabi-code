'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Github, Loader2 } from 'lucide-react';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Handle OAuth callback
    const token = searchParams.get('token');
    if (token) {
      localStorage.setItem('miyabi_token', token);
      router.push('/dashboard');
    }
  }, [searchParams, router]);

  const handleGitHubLogin = () => {
    // Redirect to backend OAuth endpoint
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    window.location.href = `${apiUrl}/api/v1/auth/github`;
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-white py-48">
      <div className="w-full max-w-2xl px-8">
        <div className="text-center">
          {/* Hero Title - Ive Style: 巨大なタイトル + 極細フォント */}
          <h1 className="text-[96px] font-extralight tracking-tighter leading-none text-gray-900 mb-6">
            Miyabi
          </h1>

          {/* 1px Divider - Ive Style: 繊細な区切り線 */}
          <div className="h-px w-24 bg-gray-300 mx-auto mb-12"></div>

          {/* Subtitle */}
          <p className="text-2xl font-light text-gray-600 mb-20">
            AI-Powered Development Automation
          </p>

          {/* CTA Button */}
          <div className="mb-12">
            <Button
              onClick={handleGitHubLogin}
              className="h-14 px-12 bg-gray-900 hover:bg-gray-800 text-white text-base font-medium transition-colors duration-200"
              size="lg"
              aria-label="Sign in with GitHub account"
            >
              <Github className="mr-3 h-5 w-5" aria-hidden="true" />
              Sign in with GitHub
            </Button>
          </div>

          {/* Legal Text */}
          <p className="text-sm text-gray-500 mb-32">
            By signing in, you agree to our Terms of Service and Privacy Policy
          </p>

          {/* Stats - Ive Style: グレースケールのみ */}
          <div role="complementary" aria-label="Platform features">
            <dl className="grid grid-cols-3 gap-16">
              <div>
                <dt className="text-6xl font-extralight text-gray-900 mb-2">7</dt>
                <dd className="text-sm font-medium text-gray-600 tracking-wide">AGENTS</dd>
              </div>
              <div>
                <dt className="text-6xl font-extralight text-gray-900 mb-2">∞</dt>
                <dd className="text-sm font-medium text-gray-600 tracking-wide">WORKFLOWS</dd>
              </div>
              <div>
                <dt className="text-6xl font-extralight text-gray-900 mb-2">24/7</dt>
                <dd className="text-sm font-medium text-gray-600 tracking-wide">AUTOMATION</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-white">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-gray-900 mx-auto" />
            <p className="mt-6 text-lg font-light text-gray-600">Loading...</p>
          </div>
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}

'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
      <Card className="w-[420px] shadow-xl">
        <CardContent className="p-8">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-slate-900">Miyabi</h1>
            <p className="mt-2 text-sm text-slate-600">
              AI-Powered Development Automation
            </p>
          </div>

          <div className="space-y-4">
            <Button
              onClick={handleGitHubLogin}
              className="w-full h-12 bg-slate-900 hover:bg-slate-800 text-white"
              size="lg"
              aria-label="Sign in with GitHub account"
            >
              <Github className="mr-2 h-5 w-5" aria-hidden="true" />
              Sign in with GitHub
            </Button>

            <p className="text-xs text-center text-slate-500">
              By signing in, you agree to our Terms of Service and Privacy
              Policy
            </p>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-200" role="complementary" aria-label="Platform features">
            <dl className="grid grid-cols-3 gap-4 text-center">
              <div>
                <dt className="text-2xl font-bold text-slate-900">7</dt>
                <dd className="text-xs text-slate-600">Agents</dd>
              </div>
              <div>
                <dt className="text-2xl font-bold text-slate-900">∞</dt>
                <dd className="text-xs text-slate-600">Workflows</dd>
              </div>
              <div>
                <dt className="text-2xl font-bold text-slate-900">24/7</dt>
                <dd className="text-xs text-slate-600">Automation</dd>
              </div>
            </dl>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-slate-900 mx-auto" />
            <p className="mt-4 text-slate-600">Loading...</p>
          </div>
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}

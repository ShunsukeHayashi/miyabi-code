'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Github } from 'lucide-react';

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
      <Card className="w-[420px] p-8 shadow-xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-slate-900">Miyabi</h1>
          <p className="mt-2 text-sm text-slate-600">
            AI-Powered Development Automation
          </p>
        </div>

        <div className="space-y-4">
          <Button
            onClick={handleGitHubLogin}
            className="w-full h-12 bg-slate-900 hover:bg-slate-800"
            size="lg"
          >
            <Github className="mr-2 h-5 w-5" />
            Sign in with GitHub
          </Button>

          <p className="text-xs text-center text-slate-500">
            By signing in, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-200">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-slate-900">7</div>
              <div className="text-xs text-slate-600">Agents</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900">∞</div>
              <div className="text-xs text-slate-600">Workflows</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900">24/7</div>
              <div className="text-xs text-slate-600">Automation</div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginContent />
    </Suspense>
  );
}

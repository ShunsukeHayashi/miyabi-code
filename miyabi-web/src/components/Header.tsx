'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { Bot, LogOut } from 'lucide-react';

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, clearAuth } = useAuthStore();

  const handleLogout = () => {
    clearAuth();
    router.push('/login');
  };

  const navItems = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/dashboard/repositories', label: 'Repositories' },
    { href: '/dashboard/workflows', label: 'Workflows' },
  ];

  return (
    <header className="bg-white border-b border-slate-200">
      <div className="px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Bot className="h-6 w-6 text-slate-900" />
            <h1 className="text-2xl font-bold text-slate-900">Miyabi</h1>
          </div>
          <nav className="flex gap-6">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`font-medium transition-colors ${
                  pathname === item.href
                    ? 'text-slate-900'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm font-medium text-slate-900">
              {user?.name || user?.email}
            </p>
            <p className="text-xs text-slate-500">@{user?.githubId}</p>
          </div>
          {user?.avatarUrl && (
            <img
              src={user.avatarUrl}
              alt={user.name || 'User avatar'}
              className="w-10 h-10 rounded-full"
            />
          )}
          <Button variant="outline" onClick={handleLogout} className="ml-4">
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>
    </header>
  );
}

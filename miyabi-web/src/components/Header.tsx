'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { toDataAttributes, CommonMetadata } from '@/lib/ai-metadata';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Bot, LogOut, Menu } from 'lucide-react';
import { useState } from 'react';

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, clearAuth } = useAuthStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

          {/* Desktop Navigation */}
          <nav aria-label="Main navigation" className="hidden md:flex gap-6">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`font-medium transition-colors ${
                  pathname === item.href
                    ? 'text-slate-900'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                {...toDataAttributes(CommonMetadata.navigationLink(item.label, item.href, 'header-desktop'))}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Desktop User Info */}
        <div className="hidden md:flex items-center gap-4">
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
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                className="ml-4"
                aria-label="Logout"
                {...toDataAttributes(CommonMetadata.logoutButtonDesktop())}
              >
                <LogOut className="h-4 w-4 mr-2" aria-hidden="true" />
                Logout
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>ログアウトの確認</AlertDialogTitle>
                <AlertDialogDescription>
                  本当にログアウトしますか？
                  <br />
                  再度ログインするにはGitHub認証が必要です。
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel {...toDataAttributes(CommonMetadata.logoutCancelButton())}>
                  キャンセル
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleLogout}
                  {...toDataAttributes(CommonMetadata.logoutConfirmButton())}
                >
                  ログアウト
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        {/* Mobile Menu */}
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger asChild className="md:hidden">
            <Button
              variant="ghost"
              size="icon"
              aria-label="Open mobile menu"
            >
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left">
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5" />
                Miyabi
              </SheetTitle>
            </SheetHeader>
            <div className="mt-6 flex flex-col gap-6">
              {/* Mobile Navigation */}
              <nav aria-label="Mobile navigation" className="flex flex-col gap-4">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`text-lg font-medium transition-colors ${
                      pathname === item.href
                        ? 'text-slate-900'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>

              {/* Mobile User Info */}
              <div className="pt-6 border-t border-slate-200">
                <div className="flex items-center gap-3 mb-4">
                  {user?.avatarUrl && (
                    <img
                      src={user.avatarUrl}
                      alt={user.name || 'User avatar'}
                      className="w-12 h-12 rounded-full"
                    />
                  )}
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      {user?.name || user?.email}
                    </p>
                    <p className="text-xs text-slate-500">@{user?.githubId}</p>
                  </div>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full"
                      aria-label="Logout"
                      {...toDataAttributes(CommonMetadata.logoutButtonMobile())}
                    >
                      <LogOut className="h-4 w-4 mr-2" aria-hidden="true" />
                      Logout
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>ログアウトの確認</AlertDialogTitle>
                      <AlertDialogDescription>
                        本当にログアウトしますか？
                        <br />
                        再度ログインするにはGitHub認証が必要です。
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>キャンセル</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => {
                          handleLogout();
                          setMobileMenuOpen(false);
                        }}
                      >
                        ログアウト
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}

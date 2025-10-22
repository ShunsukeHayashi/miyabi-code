'use client';

import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';

export default function Header() {
  const router = useRouter();
  const { user, clearAuth } = useAuthStore();

  const handleLogout = () => {
    clearAuth();
    router.push('/login');
  };

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-gray-900">
            🤖 Miyabi
          </h1>
          <nav className="flex gap-6">
            <a
              href="/dashboard"
              className="text-gray-700 hover:text-gray-900 font-medium"
            >
              Dashboard
            </a>
            <a
              href="/dashboard/repositories"
              className="text-gray-700 hover:text-gray-900 font-medium"
            >
              Repositories
            </a>
            <a
              href="/dashboard/workflows"
              className="text-gray-700 hover:text-gray-900 font-medium"
            >
              Workflows
            </a>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm font-medium text-gray-900">
              {user?.name || user?.email}
            </p>
            <p className="text-xs text-gray-500">@{user?.github_id}</p>
          </div>
          {user?.avatar_url && (
            <img
              src={user.avatar_url}
              alt={user.name || 'User avatar'}
              className="w-10 h-10 rounded-full"
            />
          )}
          <button
            onClick={handleLogout}
            className="ml-4 px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}

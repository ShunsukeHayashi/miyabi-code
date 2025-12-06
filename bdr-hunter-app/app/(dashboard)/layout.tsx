'use client';

import { useState } from 'react';
import { Button } from '@heroui/react';
import { Icon } from '@iconify/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navigation = [
  { name: 'ダッシュボード', href: '/', icon: 'mdi:home' },
  { name: '企業分析', href: '/companies', icon: 'mdi:domain' },
  { name: '新規分析', href: '/analysis/new', icon: 'mdi:plus-circle' },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-16'} bg-white dark:bg-gray-800 shadow-lg transition-all duration-300`}>
        <div className="p-4">
          <h1 className="text-xl font-bold text-foreground">
            {sidebarOpen ? 'BDR Hunter' : 'BH'}
          </h1>
        </div>
        <nav className="mt-4">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center px-4 py-3 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 ${
                pathname === item.href ? 'bg-blue-50 dark:bg-blue-900 text-blue-600' : ''
              }`}
            >
              <Icon icon={item.icon} className="w-5 h-5" />
              {sidebarOpen && <span className="ml-3">{item.name}</span>}
            </Link>
          ))}
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto p-6">
        {children}
      </main>
    </div>
  );
}

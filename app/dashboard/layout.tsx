import { ReactNode } from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar';

interface DashboardLayoutProps {
  children: ReactNode;
}

async function getUser() {
  const cookieStore = cookies();
  const userCookie = cookieStore.get('miyabi-user');

  if (!userCookie) {
    return null;
  }

  try {
    return JSON.parse(userCookie.value);
  } catch {
    return null;
  }
}

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  const user = await getUser();

  if (!user) {
    redirect('/api/auth/github');
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <DashboardSidebar
        user={{
          name: user.githubLogin,
          avatar: user.avatarUrl,
          tier: user.tier || 'free',
        }}
      />
      <main className="pl-64">
        <div className="min-h-screen">
          {children}
        </div>
      </main>
    </div>
  );
}

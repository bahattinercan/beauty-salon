'use client';

import { usePathname } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { DashboardProvider } from '@/providers/DashboardProvider';

export default function AdminLayoutShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/login';

  if (isLoginPage) {
    return <main className="min-h-screen bg-gray-50">{children}</main>;
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 ml-64 p-8">
        <DashboardProvider>{children}</DashboardProvider>
      </main>
    </div>
  );
}

'use client';

import React, { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import './globals.css';
import { SystemProvider, useSystem } from '@/context/SystemContext';
import { Sidebar } from '@/components/layout/Sidebar';
import { Navbar } from '@/components/layout/Navbar';
import { CheckInReminderPopup } from '@/components/modals/CheckInReminderPopup';

function LayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, isLoading } = useSystem();
  const isLoginPage = pathname === '/login';

  useEffect(() => {
    if (!isLoading && !currentUser && !isLoginPage) {
      router.push('/login');
    }
  }, [isLoading, currentUser, isLoginPage, router]);

  if (isLoginPage) {
    return <>{children}</>;
  }

  if (isLoading || !currentUser) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center gap-4">
        <div className="w-10 h-10 rounded-full border-4 border-zinc-700 border-t-orange-500 animate-spin" />
        <p className="text-zinc-400 text-sm font-medium">
          {isLoading ? 'Loading system data…' : 'Redirecting to login…'}
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
      <CheckInReminderPopup />
    </div>
  );
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <title>Penguin Peak Engine | Task & HR System</title>
        <meta name="description" content="Production-ready enterprise Task & HR Platform" />
      </head>
      <body className="bg-zinc-50 text-zinc-900 antialiased selection:bg-brand-500 selection:text-white">
        <SystemProvider>
          <LayoutContent>{children}</LayoutContent>
        </SystemProvider>
      </body>
    </html>
  );
}

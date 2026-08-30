'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import './globals.css';
import { SystemProvider, useSystem } from '@/context/SystemContext';
import { Sidebar } from '@/components/layout/Sidebar';
import { Navbar } from '@/components/layout/Navbar';

function LayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { isLoading } = useSystem();
  const isLoginPage = pathname === '/login';

  if (isLoading && !isLoginPage) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center gap-4">
        <div className="w-10 h-10 rounded-full border-4 border-zinc-700 border-t-orange-500 animate-spin" />
        <p className="text-zinc-400 text-sm font-medium">Loading system data…</p>
      </div>
    );
  }

  if (isLoginPage) {
    return <>{children}</>;
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

'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useSystem } from '@/context/SystemContext';
import {
  LayoutDashboard,
  CheckSquare,
  Clock,
  CalendarDays,
  MessageSquare,
  Users,
  FolderKanban,
  FileText,
  BarChart3,
  ShieldCheck,
  Zap,
  Power
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, logout, tasks, leaveApplications, customRoles } = useSystem();

  if (!currentUser) return null;

  const pendingLeavesCount = leaveApplications.filter(l => l.status === 'PENDING' && !l.isSoftDeleted).length;
  const activeTasksCount = tasks.filter(t => t.status === 'IN_PROGRESS').length;

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const navItems = [
    { href: '/', label: 'My Dashboard', icon: LayoutDashboard, badge: null, key: 'dashboard' },
    { href: '/tasks', label: 'Tasks & Timer', icon: CheckSquare, badge: activeTasksCount > 0 ? `${activeTasksCount} Active` : null, key: 'tasks' },
    { href: '/attendance', label: 'Attendance & Hours', icon: Clock, badge: null, key: 'attendance' },
    { href: '/leaves', label: 'Leaves & Comp-off', icon: CalendarDays, badge: pendingLeavesCount > 0 ? `${pendingLeavesCount} Pending` : null, key: 'leaves' },
    { href: '/chat', label: 'Internal Chat', icon: MessageSquare, badge: 'Live', key: 'chat' },
    { href: '/teams', label: 'Teams & Directory', icon: Users, badge: null, key: 'teams' },
    { href: '/projects', label: 'Projects & Masters', icon: FolderKanban, badge: null, key: 'projects' },
    { href: '/payslips', label: 'Payslips & Payroll', icon: FileText, badge: null, key: 'payslips' },
    { href: '/reports', label: 'Reports & Analytics', icon: BarChart3, badge: null, key: 'reports' },
    { href: '/admin', label: 'Web Admin Master', icon: ShieldCheck, badge: 'Settings', key: 'admin' },
  ];

  const userCustomRole = currentUser.customRoleId ? customRoles.find(r => r.id === currentUser.customRoleId) : null;

  const visibleNavItems = navItems.filter(item => {
    // Super Admin sees everything
    if (currentUser.role === 'SUPER_ADMIN') return true;
    
    // If user has a custom role, check 'canAccess' property for this menu key
    if (userCustomRole) {
      const perm = userCustomRole.permissions.find(p => p.key === item.key);
      if (perm) return perm.canAccess;
    }
    
    // Default fallback based on system roles if no custom role
    if (item.key === 'admin' && currentUser.role !== 'ADMIN_HR') return false;
    if (item.key === 'teams' && currentUser.role === 'EMPLOYEE') return false;
    if (item.key === 'projects' && currentUser.role === 'EMPLOYEE') return false;
    if (item.key === 'payslips' && currentUser.role === 'EMPLOYEE') return false;
    
    return true;
  });

  return (
    <aside className="w-64 bg-obsidian-950 text-white min-h-screen flex flex-col border-r border-obsidian-800 select-none">
      
      {/* Brand Header */}
      <div className="p-5 border-b border-obsidian-800 flex items-center space-x-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center shadow-glow-orange">
          <Zap className="w-5 h-5 text-white fill-current" />
        </div>
        <div>
          <h1 className="font-extrabold text-sm tracking-tight text-white flex items-center gap-1.5">
            Penguin Peak <span className="text-brand-500">PRO</span>
          </h1>
          <p className="text-[10px] text-zinc-400 font-medium">Enterprise HR & Task OS</p>
        </div>
      </div>

      {/* Main Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <p className="px-3 text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2">Main Menu</p>
        
        {visibleNavItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all group ${
                isActive
                  ? 'bg-brand-500 text-white shadow-glow-orange'
                  : 'text-zinc-400 hover:text-white hover:bg-obsidian-900'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Icon className={`w-4 h-4 transition-transform group-hover:scale-110 ${isActive ? 'text-white' : 'text-zinc-400 group-hover:text-brand-400'}`} />
                <span>{item.label}</span>
              </div>

              {item.badge && (
                <span
                  className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : item.badge === 'Live'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-brand-500/20 text-brand-400 border border-brand-500/30'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer Profile Status Summary & Logout Button */}
      <div className="p-4 m-3 bg-obsidian-900 border border-obsidian-800 rounded-2xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 overflow-hidden">
            <div className="relative flex-shrink-0">
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-9 h-9 rounded-full object-cover ring-1 ring-zinc-700"
              />
              <span
                className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full ring-2 ring-obsidian-900 ${
                  currentUser.status === 'ONLINE' ? 'bg-emerald-500' : 'bg-zinc-500'
                }`}
              />
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-white truncate">{currentUser.name}</p>
              <p className="text-[10px] text-brand-400 font-medium truncate">{currentUser.role.replace('_', ' ')}</p>
            </div>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center justify-center space-x-2"
        >
          <Power className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>

    </aside>
  );
};

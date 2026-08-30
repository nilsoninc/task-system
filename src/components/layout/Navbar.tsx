'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSystem } from '@/context/SystemContext';
import { formatTime } from '@/lib/utils';
import {
  Clock,
  LogOut,
  LogIn,
  Bell,
  Search,
  Power
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const router = useRouter();
  const {
    currentUser,
    logout,
    isCheckedIn,
    activeWorkSeconds,
    toggleCheckIn,
    systemSettings,
    notifications,
    markNotificationAsRead,
    clearAllNotifications,
    teams
  } = useSystem();

  const [currentTime, setCurrentTime] = useState<string>('');
  const [showNotifications, setShowNotifications] = useState(false);

  // Filter relevant notifications for current user / role / team
  const myTeamIds = currentUser ? teams.filter(t => t.leaderId === currentUser.id).map(t => t.id) : [];

  const relevantNotifications = (notifications || []).filter(n => {
    if (n.userId === 'ALL') return true;
    if (n.userId === currentUser?.id) return true;
    if (currentUser?.role === 'SUPER_ADMIN' && (n.userId === 'SUPER_ADMIN' || n.targetRole === 'SUPER_ADMIN')) return true;
    if (currentUser?.role === 'ADMIN_HR' && (n.targetRole === 'ADMIN_HR' || n.targetRole === 'SUPER_ADMIN')) return true;
    if (currentUser?.role === 'TEAM_LEADER' && n.teamId && myTeamIds.includes(n.teamId)) return true;
    return false;
  });

  const unreadCount = relevantNotifications.filter(n => !n.isRead).length;

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, 1000);
    setCurrentTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    return () => clearInterval(timer);
  }, []);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  if (!currentUser) return null;

  const isSuperAdmin = currentUser.role === 'SUPER_ADMIN';

  return (
    <header className="sticky top-0 z-40 w-full bg-white border-b border-zinc-200 shadow-subtle px-4 sm:px-6 py-3">
      <div className="flex items-center justify-between">
        
        {/* Search & Clock */}
        <div className="flex items-center space-x-4">
          <div className="relative hidden md:block w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Search tasks, projects, staff..."
              className="w-full pl-9 pr-4 py-1.5 text-xs bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-none focus:border-brand-500 transition-colors"
            />
          </div>
          
          <div className="hidden lg:flex items-center space-x-2 text-xs text-zinc-500 font-medium px-3 py-1 bg-zinc-100 rounded-md">
            <Clock className="w-3.5 h-3.5 text-brand-500 animate-pulse" />
            <span>Time: <strong className="text-zinc-800 font-mono">{currentTime || '09:00:00 AM'}</strong></span>
          </div>
        </div>

        {/* Right Controls: Check-in (EXCEPT Super Admin), Notifications, Profile, Logout */}
        <div className="flex items-center space-x-3">
          
          {/* Attendance Check-in Widget (EXCLUDED FOR SUPER ADMIN) */}
          {!isSuperAdmin && (
            <div className="flex items-center space-x-2 bg-zinc-50 border border-zinc-200 p-1.5 rounded-xl">
              <div className="text-right px-2 hidden sm:block">
                <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider block">Today Session</span>
                <span className="font-mono text-xs font-bold text-zinc-900">{formatTime(activeWorkSeconds)}</span>
              </div>

              <button
                onClick={toggleCheckIn}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  isCheckedIn
                    ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-sm'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm'
                }`}
              >
                {isCheckedIn ? <LogOut className="w-3.5 h-3.5" /> : <LogIn className="w-3.5 h-3.5" />}
                <span>{isCheckedIn ? 'Check Out' : 'Check In'}</span>
              </button>
            </div>
          )}

          {/* Real Live Notifications Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-xl transition-colors relative cursor-pointer"
              title="System Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-brand-500 text-white text-[9px] font-extrabold rounded-full flex items-center justify-center ring-2 ring-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white border border-zinc-200 rounded-2xl shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95">
                <div className="px-4 py-2 border-b border-zinc-100 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-extrabold text-zinc-900">Notifications</span>
                    {unreadCount > 0 && (
                      <span className="text-[10px] bg-brand-100 text-brand-700 px-1.5 py-0.2 rounded font-bold">
                        {unreadCount} Unread
                      </span>
                    )}
                  </div>
                  {relevantNotifications.length > 0 && (
                    <button
                      onClick={clearAllNotifications}
                      className="text-[10px] text-zinc-400 hover:text-zinc-600 cursor-pointer"
                    >
                      Clear All
                    </button>
                  )}
                </div>

                <div className="divide-y divide-zinc-100 max-h-72 overflow-y-auto">
                  {relevantNotifications.length === 0 ? (
                    <div className="p-6 text-center text-zinc-400 text-xs">
                      No notifications yet
                    </div>
                  ) : (
                    relevantNotifications.map((notif) => (
                      <div
                        key={notif.id}
                        onClick={() => {
                          markNotificationAsRead(notif.id);
                          if (notif.linkUrl) {
                            router.push(notif.linkUrl);
                            setShowNotifications(false);
                          }
                        }}
                        className={`px-4 py-2.5 hover:bg-zinc-50 transition-colors cursor-pointer text-left ${
                          !notif.isRead ? 'bg-brand-50/30' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between gap-1">
                          <p className="text-xs font-bold text-zinc-900 leading-snug">{notif.title}</p>
                          <span className="text-[9px] text-zinc-400 font-mono whitespace-nowrap">{notif.timestamp}</span>
                        </div>
                        <p className="text-[11px] text-zinc-600 mt-0.5 line-clamp-2">{notif.message}</p>
                        {notif.linkUrl && (
                          <span className="text-[10px] text-brand-600 font-bold mt-1 inline-block hover:underline">
                            View Details ➔
                          </span>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Profile Avatar */}
          <div className="flex items-center space-x-2 pl-2 border-l border-zinc-200">
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="w-8 h-8 rounded-full object-cover ring-2 ring-brand-500/30"
            />
            <div className="hidden xl:block text-left">
              <p className="text-xs font-bold text-zinc-900 leading-tight">{currentUser.name}</p>
              <span className="text-[10px] bg-brand-50 text-brand-700 font-bold px-1.5 py-0.5 rounded">
                {currentUser.role.replace('_', ' ')}
              </span>
            </div>
          </div>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="p-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer border border-rose-200"
            title="Logout of System"
          >
            <Power className="w-4 h-4" />
          </button>

        </div>

      </div>
    </header>
  );
};

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSystem } from '@/context/SystemContext';
import { formatTime } from '@/lib/utils';
import { UserProfileModal } from '@/components/modals/UserProfileModal';
import {
  Clock,
  LogOut,
  LogIn,
  Bell,
  Search,
  Power,
  Calendar,
  User,
  AlertTriangle
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const router = useRouter();
  const {
    currentUser,
    logout,
    isCheckedIn,
    activeWorkSeconds,
    toggleCheckIn,
    notifications,
    markNotificationAsRead,
    clearAllNotifications,
    teams
  } = useSystem();

  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDateFormatted, setCurrentDateFormatted] = useState<string>('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Format today's date in Day, Date Month (4 char) Year (e.g. Tuesday, 1 Sept 2026)
  const formatHeaderDate = (d: Date) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['Jan.', 'Feb.', 'Mar.', 'Apr.', 'May.', 'June', 'July', 'Aug.', 'Sept', 'Oct.', 'Nov.', 'Dec.'];
    return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
  };

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
    const updateDateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      setCurrentDateFormatted(formatHeaderDate(now));
    };
    updateDateTime();
    const timer = setInterval(updateDateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleLogoutClick = () => {
    if (isCheckedIn) {
      setShowLogoutConfirm(true);
    } else {
      logout();
      router.push('/login');
    }
  };

  const confirmCheckOutAndLogout = () => {
    toggleCheckIn();
    setShowLogoutConfirm(false);
    logout();
    router.push('/login');
  };

  const confirmJustLogout = () => {
    setShowLogoutConfirm(false);
    logout();
    router.push('/login');
  };

  if (!currentUser) return null;

  const isSuperAdmin = currentUser.role === 'SUPER_ADMIN';

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-white border-b border-zinc-200 shadow-subtle px-4 sm:px-6 py-3">
        <div className="flex items-center justify-between">
          
          {/* Search & Date/Clock Widget */}
          <div className="flex items-center space-x-3">
            <div className="relative hidden md:block w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                type="text"
                placeholder="Search tasks, projects..."
                className="w-full pl-9 pr-4 py-1.5 text-xs bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-none focus:border-brand-500 transition-colors"
              />
            </div>
            
            {/* Top Date in "Day, Month (4 char) Year" + Live Time */}
            <div className="flex items-center space-x-2 text-xs font-semibold px-3 py-1.5 bg-zinc-100 rounded-xl border border-zinc-200/80 text-zinc-700 shadow-xs">
              <Calendar className="w-3.5 h-3.5 text-brand-500 flex-shrink-0" />
              <span className="font-bold text-zinc-900">{currentDateFormatted || 'Monday, Aug. 2026'}</span>
              <span className="text-zinc-300">|</span>
              <Clock className="w-3.5 h-3.5 text-brand-500 animate-pulse flex-shrink-0" />
              <span className="font-mono text-zinc-800">{currentTime || '09:00:00 AM'}</span>
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

            {/* User Profile Avatar & Clickable Profile Opener */}
            <button
              onClick={() => setShowProfileModal(true)}
              className="flex items-center space-x-2 pl-2 border-l border-zinc-200 hover:opacity-85 transition-opacity cursor-pointer group text-left"
              title="Click to view & edit your profile"
            >
              <div className="relative">
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="w-8 h-8 rounded-full object-cover ring-2 ring-brand-500/30 group-hover:ring-brand-500 transition-all"
                />
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
              </div>
              <div className="hidden xl:block">
                <p className="text-xs font-bold text-zinc-900 leading-tight group-hover:text-brand-600 transition-colors">
                  {currentUser.name}
                </p>
                <span className="text-[10px] bg-brand-50 text-brand-700 font-bold px-1.5 py-0.5 rounded">
                  {currentUser.role.replace('_', ' ')}
                </span>
              </div>
            </button>

            {/* Logout Button */}
            <button
              onClick={handleLogoutClick}
              className="p-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer border border-rose-200"
              title="Logout of System"
            >
              <Power className="w-4 h-4" />
            </button>

          </div>

        </div>
      </header>

      {/* Profile Modal */}
      {showProfileModal && (
        <UserProfileModal
          isOpen={showProfileModal}
          onClose={() => setShowProfileModal(false)}
        />
      )}

      {/* Logout Warning Modal if Checked In */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl border border-zinc-200 space-y-4 animate-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-extrabold text-zinc-900">You are currently Checked In</h3>
              <p className="text-xs text-zinc-600">
                You have active attendance checked in for today. Would you like to record your Check Out now before logging out?
              </p>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-end gap-2 text-xs font-bold">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="w-full sm:w-auto px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmJustLogout}
                className="w-full sm:w-auto px-4 py-2 bg-zinc-200 hover:bg-zinc-300 text-zinc-800 rounded-xl transition-colors cursor-pointer"
              >
                Logout without Check Out
              </button>
              <button
                onClick={confirmCheckOutAndLogout}
                className="w-full sm:w-auto px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-xl shadow-glow-orange transition-all cursor-pointer"
              >
                Check Out & Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

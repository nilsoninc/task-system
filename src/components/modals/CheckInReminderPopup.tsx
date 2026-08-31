'use client';

import React, { useState, useEffect } from 'react';
import { useSystem } from '@/context/SystemContext';
import {
  AlertTriangle,
  LogIn,
  Clock,
  Calendar,
  X,
  ChevronUp,
  ShieldAlert,
  Flame
} from 'lucide-react';
import { formatTime } from '@/lib/utils';

export const CheckInReminderPopup: React.FC = () => {
  const { currentUser, isCheckedIn, toggleCheckIn, activeWorkSeconds } = useSystem();
  const [isMinimized, setIsMinimized] = useState(false);
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Do not show for Super Admin or if already checked in or if no logged-in user
  if (!currentUser || currentUser.role === 'SUPER_ADMIN' || isCheckedIn) {
    return null;
  }

  const todayDateStr = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }).format(new Date());

  const handleCheckInClick = () => {
    toggleCheckIn();
    setIsMinimized(false);
  };

  // Minimized Sticky Floating Widget (Bottom-Right)
  if (isMinimized) {
    return (
      <div className="fixed bottom-6 right-6 z-50 animate-bounce">
        <button
          onClick={() => setIsMinimized(false)}
          className="flex items-center space-x-3 bg-gradient-to-r from-rose-600 to-orange-600 text-white px-5 py-3 rounded-2xl shadow-2xl border-2 border-white/40 cursor-pointer hover:scale-105 transition-transform"
        >
          <span className="relative flex h-3.5 w-3.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-300 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-white"></span>
          </span>
          <div className="text-left">
            <p className="text-xs font-black uppercase tracking-wider">Check-In Required</p>
            <p className="text-[10px] text-white/90 font-medium">Click to Check In</p>
          </div>
          <ChevronUp className="w-4 h-4 ml-1" />
        </button>
      </div>
    );
  }

  // Full Prominent Popup Modal
  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200 select-none">
      <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border-2 border-rose-500/40 animate-in zoom-in-95 duration-200">
        
        {/* Top Vibrant Header */}
        <div className="bg-gradient-to-r from-rose-600 via-brand-500 to-orange-600 text-white p-6 relative overflow-hidden">
          <div className="absolute -right-8 -bottom-8 w-36 h-36 bg-white/10 rounded-full blur-xl pointer-events-none" />
          
          <div className="flex items-start justify-between relative z-10">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center ring-2 ring-white/40 shadow-inner">
                <AlertTriangle className="w-6 h-6 text-amber-200 animate-pulse" />
              </div>
              <div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-white/20 text-white border border-white/30">
                  Action Required
                </span>
                <h2 className="text-xl font-black tracking-tight mt-1 text-white">
                  Attendance Check-In Pending
                </h2>
              </div>
            </div>

            <button
              onClick={() => setIsMinimized(true)}
              className="p-1.5 text-white/80 hover:text-white hover:bg-white/20 rounded-xl transition-colors cursor-pointer"
              title="Minimize reminder temporarily"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Date & Time Bar */}
          <div className="mt-4 pt-3 border-t border-white/20 flex items-center justify-between text-xs text-white/95 font-semibold">
            <div className="flex items-center space-x-1.5">
              <Calendar className="w-3.5 h-3.5 text-amber-200" />
              <span>{todayDateStr}</span>
            </div>
            <div className="flex items-center space-x-1.5 font-mono">
              <Clock className="w-3.5 h-3.5 text-amber-200 animate-pulse" />
              <span>{currentTime}</span>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4 text-xs">
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-rose-900 space-y-2">
            <p className="font-extrabold text-sm text-rose-950 flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-rose-600" /> Hello, {currentUser.name}!
            </p>
            <p className="text-zinc-700 leading-relaxed">
              You are signed in to the <strong>Task System</strong>, but you have <strong>not checked in</strong> for today. Please complete your check-in to begin your daily work session.
            </p>
          </div>

          <div className="space-y-2.5">
            <p className="font-bold text-zinc-800 text-[11px] uppercase tracking-wider">
              While not checked in:
            </p>
            <div className="grid grid-cols-1 gap-2 text-zinc-600">
              <div className="flex items-center space-x-2 bg-zinc-50 p-2.5 rounded-xl border border-zinc-100">
                <span className="w-2 h-2 rounded-full bg-rose-500 flex-shrink-0" />
                <span>Daily working hours timer will not accumulate</span>
              </div>
              <div className="flex items-center space-x-2 bg-zinc-50 p-2.5 rounded-xl border border-zinc-100">
                <span className="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0" />
                <span>Task timers & worklogs cannot be submitted</span>
              </div>
              <div className="flex items-center space-x-2 bg-zinc-50 p-2.5 rounded-xl border border-zinc-100">
                <span className="w-2 h-2 rounded-full bg-rose-500 flex-shrink-0" />
                <span>Attendance register will reflect absent or delayed arrival</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-zinc-100 flex flex-col sm:flex-row items-center gap-3">
            <button
              onClick={handleCheckInClick}
              className="w-full sm:flex-1 py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold rounded-2xl text-sm shadow-lg shadow-emerald-500/25 transition-all cursor-pointer flex items-center justify-center space-x-2 hover:scale-[1.02]"
            >
              <LogIn className="w-4 h-4" />
              <span>Check In Now (Start Work Session)</span>
            </button>

            <button
              type="button"
              onClick={() => setIsMinimized(true)}
              className="w-full sm:w-auto px-4 py-3.5 text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100 font-bold rounded-2xl transition-colors cursor-pointer text-center"
            >
              Remind Later
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

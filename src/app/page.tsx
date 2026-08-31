'use client';

import React, { useState } from 'react';
import { useSystem } from '@/context/SystemContext';
import { formatTime, formatHoursDecimal, formatDate } from '@/lib/utils';
import Link from 'next/link';
import {
  Clock,
  LogOut,
  LogIn,
  Cake,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Timer,
  Square,
  Users,
  TrendingUp,
  Briefcase,
  UserCheck,
  UserX,
  ShieldAlert,
  ArrowRight,
  ExternalLink,
  FolderKanban,
  X,
  FileText,
  AlertTriangle,
  Play
} from 'lucide-react';
import { TaskDetailsModal } from '@/components/modals/TaskDetailsModal';
import { TaskEditModal } from '@/components/modals/TaskEditModal';
import { TaskWorklogModal } from '@/components/modals/TaskWorklogModal';
import { Task } from '@/lib/types';

export default function DashboardPage() {
  const {
    currentUser,
    users,
    tasks,
    taskTypes,
    projectTypes,
    projects,
    attendance,
    leaveApplications,
    compOffRequests,
    myTeamMemberIds,
    events,
    isCheckedIn,
    activeWorkSeconds,
    toggleCheckIn,
    toggleTaskTimer
  } = useSystem();

  // Modals for Top 4 KPI Cards
  const [activeKpiModal, setActiveKpiModal] = useState<'today_hours' | 'monthly_hours' | 'leave_balance' | 'active_tasks' | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [worklogTask, setWorklogTask] = useState<Task | null>(null);

  if (!currentUser) return null;

  const isSuperAdmin = currentUser.role === 'SUPER_ADMIN';
  const isAdminOrHR = isSuperAdmin || currentUser.role === 'ADMIN_HR';
  const isTeamLead = currentUser.role === 'TEAM_LEADER';
  const isRegularEmployee = currentUser.role === 'EMPLOYEE';

  // Format today date in Day, Date Month (4 char) Year (e.g. Tuesday, 1 Sept 2026)
  const getHeaderDate = () => {
    const d = new Date();
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['Jan.', 'Feb.', 'Mar.', 'Apr.', 'May.', 'June', 'July', 'Aug.', 'Sept', 'Oct.', 'Nov.', 'Dec.'];
    return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
  };

  // Pending leave requests requiring review
  const pendingLeavesToReview = leaveApplications.filter(l => {
    if (l.isSoftDeleted || l.status !== 'PENDING') return false;
    if (isAdminOrHR) return true;
    if (isTeamLead) return myTeamMemberIds.includes(l.userId);
    return false;
  });

  // Pending comp-off claims requiring review
  const pendingCompOffToReview = compOffRequests.filter(co => {
    if (co.status === 'PENDING') {
      if (isAdminOrHR) return true;
      if (isTeamLead) return myTeamMemberIds.includes(co.userId);
    }
    if (co.status === 'APPROVED_BY_TL' && isAdminOrHR) return true;
    return false;
  });

  // Staff Presence (Logged in / Logged out) - for Admin/TL
  const onlineUsers = users.filter(u => u.isLoggedIn || u.status === 'ONLINE');
  const offlineUsers = users.filter(u => !u.isLoggedIn && u.status !== 'ONLINE');

  // Tasks scoping: Employee only sees their own assigned tasks
  const activeTasks = tasks.filter(t => !t.isSoftDeleted);
  const displayedTasks = isSuperAdmin
    ? activeTasks
    : isTeamLead
    ? activeTasks.filter(t => t.assigneeId === currentUser.id || myTeamMemberIds.includes(t.assigneeId))
    : activeTasks.filter(t => t.assigneeId === currentUser.id);

  const runningTask = displayedTasks.find(t => t.isTimerRunning) || tasks.find(t => t.isTimerRunning);

  // My Leave Applications (filtered out soft deleted)
  const myLeaves = leaveApplications.filter(l => l.userId === currentUser.id && !l.isSoftDeleted);
  const myCompOffs = compOffRequests.filter(co => co.userId === currentUser.id);

  // Today's Date String
  const todayStr = new Date().toISOString().split('T')[0];
  const currentMonthPrefix = todayStr.slice(0, 7); // e.g. "2026-08"

  // User's Attendance for Current Month
  const myMonthlyAttendance = attendance.filter(a => a.userId === currentUser.id && a.date.startsWith(currentMonthPrefix));
  const myMonthlyHours = myMonthlyAttendance.reduce((acc, a) => acc + (a.workHours || 0), 0);
  const myMonthlyLateFlags = myMonthlyAttendance.filter(a => a.isLate).length;

  // Tasks accessed today by the user
  const todayAccessedTasks = tasks.filter(t => {
    if (t.assigneeId !== currentUser.id && !isSuperAdmin) return false;
    // Check if task has worklogs today or is currently running
    const hasLogToday = t.worklogs.some(w => w.date === todayStr || (!w.date && t.isTimerRunning));
    return hasLogToday || t.isTimerRunning;
  });

  // Birthdays
  const birthdays = users.map(u => ({
    name: u.name,
    avatar: u.avatar,
    title: u.title,
    birthDate: u.birthDate
  }));

  return (
    <div className="space-y-6">
      
      {/* ⚠️ Persistent Check-In Reminder Alert for Logged In User */}
      {!isCheckedIn && currentUser.role !== 'SUPER_ADMIN' && (
        <div className="bg-gradient-to-r from-amber-500 via-rose-500 to-rose-600 text-white rounded-2xl p-4 shadow-glow-orange flex flex-col sm:flex-row items-center justify-between gap-3 animate-pulse">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h4 className="font-extrabold text-sm text-white">
                Attendance Check-In Required!
              </h4>
              <p className="text-xs text-white/90 mt-0.5">
                You are currently not Checked In. Please Check In to track today's work hours, start task timers, and record attendance.
              </p>
            </div>
          </div>

          <button
            onClick={toggleCheckIn}
            className="px-5 py-2.5 bg-white hover:bg-zinc-100 text-rose-600 font-extrabold rounded-xl text-xs shadow-md transition-all cursor-pointer flex items-center space-x-2 flex-shrink-0"
          >
            <LogIn className="w-4 h-4" />
            <span>Check In Now</span>
          </button>
        </div>
      )}

      {/* Welcome & Persona Banner */}
      <div className="bg-gradient-to-r from-obsidian-950 via-obsidian-900 to-zinc-900 text-white rounded-2xl p-6 shadow-xl border border-obsidian-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 mb-1 flex-wrap gap-y-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-brand-500/20 text-brand-400 border border-brand-500/30 uppercase tracking-wide">
                Role: {currentUser.role.replace('_', ' ')}
              </span>
              <span className="text-xs text-zinc-400 font-medium">| Joining: {formatDate(currentUser.joiningDate)}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Good day, <span className="text-brand-400">{currentUser.name}</span> 👋
            </h1>
            <p className="text-xs sm:text-sm text-zinc-300 mt-1 max-w-2xl">
              {isRegularEmployee
                ? "Track your daily work hours, access assigned tasks with live timers, view leave balance, and submit attendance."
                : "Track daily work hours, manage assigned tasks with live timers, view staff presence, and review team requests."}
            </p>
          </div>

          {currentUser.role !== 'SUPER_ADMIN' && (
            <div className="flex items-center space-x-3 bg-obsidian-950/80 p-3 rounded-xl border border-obsidian-800">
              <div className="text-left">
                <p className="text-[10px] font-bold uppercase text-zinc-400 tracking-wider">Attendance Status</p>
                <p className="text-sm font-bold text-white flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${isCheckedIn ? 'bg-emerald-500 animate-ping' : 'bg-zinc-500'}`} />
                  {isCheckedIn ? 'LOGGED IN & CHECKED-IN' : 'LOGGED OUT'}
                </p>
              </div>
              <button
                onClick={toggleCheckIn}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-glow-orange cursor-pointer flex items-center space-x-1.5 ${
                  isCheckedIn
                    ? 'bg-rose-600 hover:bg-rose-700 text-white'
                    : 'bg-brand-500 hover:bg-brand-600 text-white'
                }`}
              >
                {isCheckedIn ? <LogOut className="w-4 h-4" /> : <LogIn className="w-4 h-4" />}
                <span>{isCheckedIn ? 'Check Out' : 'Check In'}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Hierarchy Review Notification Alert for Super Admin & Team Leader */}
      {(pendingLeavesToReview.length > 0 || pendingCompOffToReview.length > 0) && (
        <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs animate-in fade-in">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center flex-shrink-0 animate-bounce">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-xs text-amber-900">
                Action Required: Pending Approvals in your Hierarchy Queue
              </h4>
              <p className="text-[11px] text-amber-800 mt-0.5">
                {pendingLeavesToReview.length > 0 && `${pendingLeavesToReview.length} Leave Application(s)`}
                {pendingLeavesToReview.length > 0 && pendingCompOffToReview.length > 0 && ' and '}
                {pendingCompOffToReview.length > 0 && `${pendingCompOffToReview.length} Comp-Off Claim(s)`}
                {' are awaiting your review and approval.'}
              </p>
            </div>
          </div>
          <Link
            href="/leaves"
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 flex-shrink-0 shadow-sm"
          >
            <span>Open Leave Queue</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* Top 4 Interactive Metric Cards (All with Click Events) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* CARD 1: Today Work Hours */}
        <div
          onClick={() => setActiveKpiModal('today_hours')}
          className="card-clean p-4 flex items-center justify-between hover:border-brand-500 hover:shadow-md transition-all cursor-pointer group"
          title="Click to view task hours accessed today"
        >
          <div>
            <div className="flex items-center space-x-1.5">
              <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider group-hover:text-brand-600 transition-colors">
                Today Work Hours
              </p>
              <span className="text-[9px] bg-brand-50 text-brand-700 font-bold px-1.5 py-0.2 rounded">Click</span>
            </div>
            <h3 className="text-xl font-black text-zinc-900 font-mono mt-1">{formatTime(activeWorkSeconds)}</h3>
            <p className="text-[11px] text-emerald-600 font-medium mt-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> Target: 8.0 hrs
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-brand-50 text-brand-500 group-hover:bg-brand-500 group-hover:text-white transition-all flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        {/* CARD 2: Monthly Work Hours */}
        <div
          onClick={() => setActiveKpiModal('monthly_hours')}
          className="card-clean p-4 flex items-center justify-between hover:border-blue-500 hover:shadow-md transition-all cursor-pointer group"
          title="Click to view date-wise working hours and late flags"
        >
          <div>
            <div className="flex items-center space-x-1.5">
              <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider group-hover:text-blue-600 transition-colors">
                Monthly Work Hours
              </p>
              <span className="text-[9px] bg-blue-50 text-blue-700 font-bold px-1.5 py-0.2 rounded">Click</span>
            </div>
            <h3 className="text-xl font-black text-zinc-900 mt-1">{myMonthlyHours.toFixed(1)} / 160 hrs</h3>
            <p className="text-[11px] text-zinc-500 mt-1">
              {myMonthlyLateFlags > 0 ? `⚠️ ${myMonthlyLateFlags} Late Arrival Flag(s)` : '✅ On-Time Attendance'}
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all flex items-center justify-center">
            <Briefcase className="w-6 h-6" />
          </div>
        </div>

        {/* CARD 3: Available Leave Balance */}
        <div
          onClick={() => setActiveKpiModal('leave_balance')}
          className="card-clean p-4 flex items-center justify-between hover:border-purple-500 hover:shadow-md transition-all cursor-pointer group"
          title="Click to view leave taken details and balances"
        >
          <div>
            <div className="flex items-center space-x-1.5">
              <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider group-hover:text-purple-600 transition-colors">
                Available Leave Balance
              </p>
              <span className="text-[9px] bg-purple-50 text-purple-700 font-bold px-1.5 py-0.2 rounded">Click</span>
            </div>
            <h3 className="text-xl font-black text-zinc-900 mt-1">
              {currentUser.leaveBalance?.paid || 0} Days
            </h3>
            <p className="text-[11px] text-zinc-500 mt-1">
              Comp-off: {currentUser.leaveBalance?.compOff || 0} | Used: {currentUser.leaveBalance?.used || 0} days
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-all flex items-center justify-center">
            <Calendar className="w-6 h-6" />
          </div>
        </div>

        {/* CARD 4: Assigned Active Tasks */}
        <div
          onClick={() => setActiveKpiModal('active_tasks')}
          className="card-clean p-4 flex items-center justify-between hover:border-emerald-500 hover:shadow-md transition-all cursor-pointer group"
          title="Click to view active task details"
        >
          <div>
            <div className="flex items-center space-x-1.5">
              <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider group-hover:text-emerald-600 transition-colors">
                Assigned Active Tasks
              </p>
              <span className="text-[9px] bg-emerald-50 text-emerald-700 font-bold px-1.5 py-0.2 rounded">Click</span>
            </div>
            <h3 className="text-xl font-black text-zinc-900 mt-1">{displayedTasks.length} Tasks</h3>
            <p className="text-[11px] text-brand-600 font-semibold mt-1">
              {runningTask ? '⚡ Live Timer Running' : 'No active timer running'}
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-all flex items-center justify-center">
            <Timer className="w-6 h-6" />
          </div>
        </div>

      </div>

      {/* Main Column Grid: Tasks Overview (Left 2 cols) vs Leaves & Events (Right 1 col) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Assigned Tasks (+ Staff Presence ONLY for Super Admin/TL) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Running Timer Overlay Banner */}
          {runningTask && (
            <div className="bg-gradient-to-r from-brand-500 to-brand-600 text-white rounded-2xl p-4 shadow-glow-orange flex items-center justify-between animate-pulse">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white">
                  <Timer className="w-5 h-5 animate-spin" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-white/80">Active Task Timer Running</p>
                  <h4 className="text-sm font-bold text-white">{runningTask.title}</h4>
                </div>
              </div>
              <button
                onClick={() => toggleTaskTimer(runningTask.id)}
                className="px-4 py-2 bg-obsidian-950 hover:bg-black text-white text-xs font-bold rounded-xl shadow cursor-pointer flex items-center space-x-1.5"
              >
                <Square className="w-4 h-4 text-rose-500 fill-current" />
                <span>Stop Timer</span>
              </button>
            </div>
          )}

          {/* SECTION 1: Tasks Overview */}
          <div className="card-clean p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-bold text-base text-zinc-900 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-brand-500" />
                  {isSuperAdmin ? "All Team Members' Tasks" : 'My Assigned Tasks'}
                </h2>
                <p className="text-xs text-zinc-500">
                  {isRegularEmployee
                    ? 'Your active tasks with live timers. Click any task for full session logs & actions.'
                    : 'Click any task for full logs, or stop active timers directly.'}
                </p>
              </div>
              <Link
                href="/tasks"
                className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1"
              >
                <span>View Full Task Board</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-3">
              {displayedTasks.length === 0 ? (
                <p className="text-xs text-zinc-400 py-6 text-center">No active tasks found.</p>
              ) : (
                displayedTasks.map((t) => {
                  const taskType = taskTypes.find((tt) => tt.id === t.typeId);
                  const project = projects.find((p) => p.id === t.projectId);
                  const isExceeded = t.loggedHours > t.estimatedHours;
                  const isTimerRunning = Boolean(t.isTimerRunning);

                  return (
                    <div
                      key={t.id}
                      onClick={() => setSelectedTask(t)}
                      className={`p-3.5 bg-zinc-50 hover:bg-zinc-100/90 rounded-xl border border-zinc-200 flex items-center justify-between transition-all cursor-pointer ${
                        isTimerRunning ? 'border-brand-500 ring-2 ring-brand-500/20 bg-brand-50/20' : ''
                      }`}
                    >
                      <div className="space-y-1.5 max-w-lg">
                        <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                          <span
                            className="px-2 py-0.5 rounded text-[9px] font-bold uppercase text-white shadow-xs"
                            style={{ backgroundColor: taskType?.color || '#F97316' }}
                          >
                            {taskType?.name || 'Task'}
                          </span>

                          <span
                            className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                              t.priority === 'URGENT'
                                ? 'bg-rose-100 text-rose-700'
                                : t.priority === 'HIGH'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-zinc-200 text-zinc-700'
                            }`}
                          >
                            {t.priority}
                          </span>

                          <span className="text-[11px] font-medium text-zinc-500">
                            Due: {formatDate(t.dueDate)}
                          </span>

                          {isTimerRunning && (
                            <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-brand-500 text-white animate-pulse">
                              ⚡ In Progress
                            </span>
                          )}
                        </div>

                        <h4 className="text-xs font-bold text-zinc-900 leading-snug">{t.title}</h4>

                        {/* Project Name (shown clearly) */}
                        <div className="flex items-center space-x-2 text-[11px] text-zinc-500 pt-0.5">
                          <span className="font-semibold text-brand-700 bg-brand-50 px-2 py-0.5 rounded">
                            📁 {project?.name || 'General Project'}
                          </span>
                          <span>•</span>
                          <span className="text-zinc-400">Created: {formatDate(t.createdAt)}</span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <div className="text-right">
                          <span className="text-[10px] text-zinc-400 uppercase font-bold block">Logged Time</span>
                          <span
                            className={`text-xs font-mono font-bold ${
                              isExceeded ? 'text-rose-600' : 'text-zinc-800'
                            }`}
                          >
                            {formatHoursDecimal(t.loggedHours)} / {t.estimatedHours}h
                          </span>
                        </div>

                        {/* Task Action Buttons */}
                        <div className="flex items-center space-x-1.5" onClick={(e) => e.stopPropagation()}>
                          {isTimerRunning ? (
                            <button
                              onClick={() => toggleTaskTimer(t.id)}
                              className="px-3 py-1.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-bold flex items-center space-x-1 shadow-glow-orange cursor-pointer animate-pulse"
                              title="Stop Active Timer"
                            >
                              <Square className="w-3.5 h-3.5 fill-current" />
                              <span>Stop</span>
                            </button>
                          ) : (!isRegularEmployee && isSuperAdmin) ? (
                            <button
                              onClick={() => setWorklogTask(t)}
                              className="px-2.5 py-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-lg text-xs font-bold"
                            >
                              View Log
                            </button>
                          ) : t.status !== 'COMPLETED' ? (
                            <button
                              onClick={() => toggleTaskTimer(t.id)}
                              className="px-3 py-1.5 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-xs font-bold flex items-center space-x-1 shadow-sm cursor-pointer"
                              title="Start Task Timer"
                            >
                              <Play className="w-3.5 h-3.5 fill-current" />
                              <span>Start</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => setWorklogTask(t)}
                              className="px-2.5 py-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-lg text-xs font-bold"
                            >
                              View Log
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* SECTION 2: Staff Presence ONLY for Super Admin & Team Leader */}
          {!isRegularEmployee && (
            <div className="card-clean p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
                <div>
                  <h2 className="font-bold text-base text-zinc-900 flex items-center gap-2">
                    <Users className="w-5 h-5 text-brand-500" /> Staff Presence (Who is Logged In / Logged Out)
                  </h2>
                  <p className="text-xs text-zinc-500">Real-time attendance & online presence monitor across teams</p>
                </div>
                <span className="text-xs font-bold bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full">
                  {onlineUsers.length} Logged In
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Logged In Staff */}
                <div className="p-3 bg-emerald-50/50 border border-emerald-100 rounded-2xl space-y-2">
                  <p className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4 text-emerald-600" /> Currently Logged In ({onlineUsers.length})
                  </p>
                  
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {onlineUsers.map(u => (
                      <div key={u.id} className="p-2.5 bg-white rounded-xl border border-emerald-200 flex items-center justify-between text-xs shadow-sm">
                        <div className="flex items-center space-x-2.5">
                          <div className="relative">
                            <img src={u.avatar} alt={u.name} className="w-8 h-8 rounded-full object-cover ring-2 ring-emerald-500/30" />
                            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
                          </div>
                          <div>
                            <p className="font-bold text-zinc-900">{u.name}</p>
                            <p className="text-[10px] text-zinc-500">{u.title}</p>
                          </div>
                        </div>
                        <span className="font-mono text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold">
                          {u.checkInTime || 'Online'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Logged Out Staff */}
                <div className="p-3 bg-zinc-100/70 border border-zinc-200 rounded-2xl space-y-2">
                  <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
                    <UserX className="w-4 h-4 text-zinc-400" /> Logged Out / Offline ({offlineUsers.length})
                  </p>

                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {offlineUsers.map(u => (
                      <div key={u.id} className="p-2.5 bg-white/70 rounded-xl border border-zinc-200 flex items-center justify-between text-xs opacity-75">
                        <div className="flex items-center space-x-2.5">
                          <img src={u.avatar} alt={u.name} className="w-8 h-8 rounded-full object-cover grayscale" />
                          <div>
                            <p className="font-medium text-zinc-700">{u.name}</p>
                            <p className="text-[10px] text-zinc-400">{u.title}</p>
                          </div>
                        </div>
                        <span className="text-[10px] text-zinc-400 font-medium">Logged Out</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Right 1 Col: Projects Overview + Leaves Applied & Status + Birthdays + Events */}
        <div className="space-y-6">
          
          {/* Projects Overview Card */}
          <div className="card-clean p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-zinc-900 flex items-center gap-2">
                <FolderKanban className="w-4 h-4 text-brand-500" /> Projects Overview
              </h3>
              <Link
                href="/projects"
                className="text-[11px] font-bold text-brand-600 hover:text-brand-700 flex items-center gap-0.5"
              >
                <span>View All ({projects.length})</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="space-y-2">
              {projects.slice(0, 3).map((p) => {
                const pType = projectTypes.find((pt) => pt.id === p.typeId);
                return (
                  <Link
                    key={p.id}
                    href="/projects"
                    className="p-2.5 bg-zinc-50 hover:bg-zinc-100/90 rounded-xl border border-zinc-200 block transition-all group"
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-xs text-zinc-900 group-hover:text-brand-600 transition-colors truncate max-w-[180px]">
                        {p.name}
                      </p>
                      <span
                        className="px-1.5 py-0.5 rounded text-[8px] font-bold text-white uppercase flex-shrink-0"
                        style={{ backgroundColor: pType?.color || '#F97316' }}
                      >
                        {pType?.name || 'Project'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-zinc-400 mt-1">
                      <span>{p.estimatedHours || 0} hrs</span>
                      <span className="font-semibold text-zinc-600">{p.status.replace(/_/g, ' ')}</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* My Applied Leaves & Status */}
          <div className="card-clean p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-sm text-zinc-900 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-brand-500" /> My Applied Leaves & Status
              </h3>
            </div>

            <div className="divide-y divide-zinc-100">
              {myLeaves.length === 0 ? (
                <p className="text-xs text-zinc-400 py-4 text-center">No leave applications submitted.</p>
              ) : (
                myLeaves.slice(0, 5).map((l) => (
                  <div key={l.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-zinc-900">{l.leaveType} LEAVE</span>
                        <span className="text-zinc-400">•</span>
                        <span className="text-zinc-600">{l.days} Day(s)</span>
                      </div>
                      <p className="text-[10px] text-zinc-400">{formatDate(l.startDate)} - {formatDate(l.endDate)}</p>
                    </div>

                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      l.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' :
                      l.status === 'REJECTED' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {l.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Birthdays Card */}
          <div className="card-clean p-5">
            <h3 className="font-bold text-sm text-zinc-900 flex items-center gap-2 mb-3">
              <Cake className="w-4 h-4 text-brand-500" /> Upcoming Birthdays
            </h3>
            <div className="space-y-3">
              {birthdays.slice(0, 4).map((b, idx) => (
                <div key={idx} className="flex items-center space-x-3 p-2 bg-brand-50/50 rounded-xl border border-brand-100">
                  <img src={b.avatar} alt={b.name} className="w-8 h-8 rounded-full object-cover ring-2 ring-brand-400/40" />
                  <div className="flex-1">
                    <p className="text-xs font-bold text-zinc-900">{b.name}</p>
                    <p className="text-[10px] text-brand-700 font-semibold">{formatDate(b.birthDate)}</p>
                  </div>
                  <span className="text-xs">🎂</span>
                </div>
              ))}
            </div>
          </div>

          {/* Events & Holidays Card */}
          <div className="card-clean p-5">
            <h3 className="font-bold text-sm text-zinc-900 flex items-center gap-2 mb-3">
              <Calendar className="w-4 h-4 text-brand-500" /> Company Events & Holidays
            </h3>
            <div className="space-y-2.5">
              {events.slice(0, 4).map((ev) => (
                <div key={ev.id} className={`p-2.5 rounded-xl border text-xs ${
                  ev.isHoliday ? 'bg-amber-50 border-amber-200' : 'bg-zinc-50 border-zinc-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-zinc-900">{ev.title}</span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      ev.isHoliday ? 'bg-amber-200 text-amber-900' : 'bg-zinc-200 text-zinc-800'
                    }`}>
                      {formatDate(ev.date)}
                    </span>
                  </div>
                  <p className="text-[10px] text-zinc-500 mt-1">{ev.description}</p>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* KPI MODALS (ON CLICK OF TOP 4 CARDS) */}
      {/* ───────────────────────────────────────────────────────────── */}

      {/* 1. Modal: Today Work Hours Details */}
      {activeKpiModal === 'today_hours' && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-zinc-200 overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95">
            <div className="p-5 border-b border-zinc-100 flex items-center justify-between bg-zinc-50">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-brand-500 text-white flex items-center justify-center font-bold">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-zinc-900">Today's Work Hours & Accessed Tasks</h3>
                  <p className="text-xs text-zinc-500">{getHeaderDate()} • Total: {formatTime(activeWorkSeconds)}</p>
                </div>
              </div>
              <button
                onClick={() => setActiveKpiModal(null)}
                className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-700 hover:bg-zinc-200 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto flex-1 space-y-4">
              {todayAccessedTasks.length === 0 ? (
                <div className="py-8 text-center text-zinc-400 text-xs">
                  No task timers recorded yet today. Click START on any assigned task to begin tracking work hours.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-zinc-200">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-zinc-50 text-zinc-600 font-bold uppercase text-[10px]">
                      <tr>
                        <th className="p-3">Task Title</th>
                        <th className="p-3">Project</th>
                        <th className="p-3">Logged Total</th>
                        <th className="p-3">Status</th>
                        <th className="p-3">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {todayAccessedTasks.map((t) => {
                        const project = projects.find(p => p.id === t.projectId);
                        return (
                          <tr key={t.id} className="hover:bg-zinc-50">
                            <td className="p-3 font-bold text-zinc-900">{t.title}</td>
                            <td className="p-3 text-zinc-600">{project?.name || 'General'}</td>
                            <td className="p-3 font-mono font-bold text-brand-600">{formatHoursDecimal(t.loggedHours)} hrs</td>
                            <td className="p-3">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                t.isTimerRunning ? 'bg-brand-500 text-white animate-pulse' : 'bg-zinc-100 text-zinc-700'
                              }`}>
                                {t.isTimerRunning ? '⚡ Running' : t.status}
                              </span>
                            </td>
                            <td className="p-3">
                              <button
                                onClick={() => {
                                  setActiveKpiModal(null);
                                  setWorklogTask(t);
                                }}
                                className="text-brand-600 font-bold hover:underline cursor-pointer"
                              >
                                View Log
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-zinc-100 bg-zinc-50 flex justify-end">
              <button
                onClick={() => setActiveKpiModal(null)}
                className="px-4 py-2 bg-zinc-900 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Modal: Monthly Work Hours & Late Flags */}
      {activeKpiModal === 'monthly_hours' && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-zinc-200 overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95">
            <div className="p-5 border-b border-zinc-100 flex items-center justify-between bg-zinc-50">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold">
                  <Briefcase className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-zinc-900">Current Month Working Hours & Attendance</h3>
                  <p className="text-xs text-zinc-500">Date-wise working hours, leave taken & late arrival flags</p>
                </div>
              </div>
              <button
                onClick={() => setActiveKpiModal(null)}
                className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-700 hover:bg-zinc-200 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto flex-1 space-y-4">
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl">
                  <p className="text-[10px] font-bold text-blue-900 uppercase">Total Hours</p>
                  <p className="text-lg font-black text-blue-700 mt-0.5">{myMonthlyHours.toFixed(1)} hrs</p>
                </div>
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                  <p className="text-[10px] font-bold text-emerald-900 uppercase">Present Days</p>
                  <p className="text-lg font-black text-emerald-700 mt-0.5">{myMonthlyAttendance.length} Days</p>
                </div>
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                  <p className="text-[10px] font-bold text-amber-900 uppercase">Late Flags</p>
                  <p className="text-lg font-black text-amber-700 mt-0.5">{myMonthlyLateFlags}</p>
                </div>
              </div>

              <div className="overflow-x-auto rounded-xl border border-zinc-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-50 text-zinc-600 font-bold uppercase text-[10px]">
                    <tr>
                      <th className="p-3">Date</th>
                      <th className="p-3">Check In</th>
                      <th className="p-3">Check Out</th>
                      <th className="p-3">Work Hours</th>
                      <th className="p-3">Status / Flags</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {myMonthlyAttendance.map((att) => (
                      <tr key={att.id} className="hover:bg-zinc-50">
                        <td className="p-3 font-bold text-zinc-800">{formatDate(att.date)}</td>
                        <td className="p-3 font-mono text-emerald-700">{att.checkIn}</td>
                        <td className="p-3 font-mono text-rose-700">{att.checkOut || 'Active'}</td>
                        <td className="p-3 font-mono font-bold text-zinc-900">{att.workHours} hrs</td>
                        <td className="p-3">
                          {att.isLate ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                              ⚠️ Late Arrival
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              On Time
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="p-4 border-t border-zinc-100 bg-zinc-50 flex justify-end">
              <button
                onClick={() => setActiveKpiModal(null)}
                className="px-4 py-2 bg-zinc-900 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Modal: Available Leave Balance & History */}
      {activeKpiModal === 'leave_balance' && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-zinc-200 overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95">
            <div className="p-5 border-b border-zinc-100 flex items-center justify-between bg-zinc-50">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-zinc-900">Leave Balance & Leave Taken Details</h3>
                  <p className="text-xs text-zinc-500">Your available credits and full history of applied leaves</p>
                </div>
              </div>
              <button
                onClick={() => setActiveKpiModal(null)}
                className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-700 hover:bg-zinc-200 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto flex-1 space-y-4">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl">
                  <p className="text-[10px] font-bold text-purple-900 uppercase">Paid Leave</p>
                  <p className="text-lg font-black text-purple-700">{currentUser.leaveBalance?.paid || 0}d Available</p>
                </div>
                <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl">
                  <p className="text-[10px] font-bold text-indigo-900 uppercase">Comp-off</p>
                  <p className="text-lg font-black text-indigo-700">{currentUser.leaveBalance?.compOff || 0}d Available</p>
                </div>
                <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl">
                  <p className="text-[10px] font-bold text-zinc-500 uppercase">Used</p>
                  <p className="text-lg font-black text-zinc-700">{currentUser.leaveBalance?.used || 0}d Taken</p>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-xs text-zinc-900">Leaves Taken History ({myLeaves.length})</h4>
                {myLeaves.length === 0 ? (
                  <p className="text-xs text-zinc-400 py-4 text-center">No leaves taken.</p>
                ) : (
                  <div className="divide-y divide-zinc-100 border border-zinc-200 rounded-xl overflow-hidden">
                    {myLeaves.map(l => (
                      <div key={l.id} className="p-3 flex items-center justify-between text-xs bg-white">
                        <div>
                          <p className="font-bold text-zinc-900">{l.leaveType} LEAVE • {l.days} Day(s)</p>
                          <p className="text-[11px] text-zinc-500">{formatDate(l.startDate)} - {formatDate(l.endDate)} • Reason: {l.reason}</p>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          l.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' :
                          l.status === 'REJECTED' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {l.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 border-t border-zinc-100 bg-zinc-50 flex justify-end">
              <button
                onClick={() => setActiveKpiModal(null)}
                className="px-4 py-2 bg-zinc-900 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Modal: Assigned Active Tasks List */}
      {activeKpiModal === 'active_tasks' && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-zinc-200 overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95">
            <div className="p-5 border-b border-zinc-100 flex items-center justify-between bg-zinc-50">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
                  <Timer className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-zinc-900">Assigned Active Tasks</h3>
                  <p className="text-xs text-zinc-500">List of all active tasks assigned to your User ID</p>
                </div>
              </div>
              <button
                onClick={() => setActiveKpiModal(null)}
                className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-700 hover:bg-zinc-200 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto flex-1 space-y-2">
              {displayedTasks.length === 0 ? (
                <p className="text-xs text-zinc-400 py-6 text-center">No active tasks assigned.</p>
              ) : (
                displayedTasks.map((t) => {
                  const project = projects.find(p => p.id === t.projectId);
                  return (
                    <div key={t.id} className="p-3 bg-zinc-50 rounded-xl border border-zinc-200 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-bold text-brand-700 bg-brand-50 px-2 py-0.5 rounded">
                          {project?.name || 'General Project'}
                        </span>
                        <h4 className="text-xs font-bold text-zinc-900 mt-1">{t.title}</h4>
                        <p className="text-[10px] text-zinc-500">Due: {formatDate(t.dueDate)} • Est: {t.estimatedHours}h • Logged: {formatHoursDecimal(t.loggedHours)}h</p>
                      </div>

                      <button
                        onClick={() => {
                          setActiveKpiModal(null);
                          setSelectedTask(t);
                        }}
                        className="px-3 py-1.5 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-xs font-bold cursor-pointer"
                      >
                        Details
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            <div className="p-4 border-t border-zinc-100 bg-zinc-50 flex justify-end">
              <button
                onClick={() => setActiveKpiModal(null)}
                className="px-4 py-2 bg-zinc-900 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Task Details & Worklogs Modal */}
      {selectedTask && (
        <TaskDetailsModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onEdit={(t) => {
            setSelectedTask(null);
            setEditingTask(t);
          }}
        />
      )}

      {/* Task Edit Modal */}
      {editingTask && (
        <TaskEditModal
          task={editingTask}
          isOpen={Boolean(editingTask)}
          onClose={() => setEditingTask(null)}
        />
      )}

      {/* Task Worklog Modal */}
      {worklogTask && (
        <TaskWorklogModal
          task={worklogTask}
          projectName={projects.find(p => p.id === worklogTask.projectId)?.name}
          onClose={() => setWorklogTask(null)}
        />
      )}

    </div>
  );
}

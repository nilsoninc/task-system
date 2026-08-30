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
  FolderKanban
} from 'lucide-react';
import { TaskDetailsModal } from '@/components/modals/TaskDetailsModal';
import { TaskEditModal } from '@/components/modals/TaskEditModal';
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

  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  if (!currentUser) return null;

  const isSuperAdmin = currentUser.role === 'SUPER_ADMIN';
  const isAdminOrHR = isSuperAdmin || currentUser.role === 'ADMIN_HR';
  const isTeamLead = currentUser.role === 'TEAM_LEADER';

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

  // Staff Presence (Logged in / Logged out)
  const onlineUsers = users.filter(u => u.isLoggedIn || u.status === 'ONLINE');
  const offlineUsers = users.filter(u => !u.isLoggedIn && u.status !== 'ONLINE');

  // Tasks scoping: Super Admin sees all active tasks across all team members; TL sees team members; user sees assigned tasks
  const activeTasks = tasks.filter(t => !t.isSoftDeleted);
  const displayedTasks = isSuperAdmin
    ? activeTasks
    : isTeamLead
    ? activeTasks.filter(t => t.assigneeId === currentUser.id || myTeamMemberIds.includes(t.assigneeId))
    : activeTasks.filter(t => t.assigneeId === currentUser.id);

  const runningTask = displayedTasks.find(t => t.isTimerRunning) || tasks.find(t => t.isTimerRunning);

  // My Leave Applications (filtered out soft deleted)
  const myLeaves = leaveApplications.filter(l => l.userId === currentUser.id && !l.isSoftDeleted);

  // Birthdays
  const birthdays = users.map(u => ({
    name: u.name,
    avatar: u.avatar,
    title: u.title,
    birthDate: u.birthDate
  }));

  return (
    <div className="space-y-6">
      
      {/* Welcome & Persona Banner */}
      <div className="bg-gradient-to-r from-obsidian-950 via-obsidian-900 to-zinc-900 text-white rounded-2xl p-6 shadow-xl border border-obsidian-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-brand-500/20 text-brand-400 border border-brand-500/30 uppercase tracking-wide">
                Role: {currentUser.role.replace('_', ' ')}
              </span>
              <span className="text-xs text-zinc-400">| Joining: {formatDate(currentUser.joiningDate)}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Good day, <span className="text-brand-400">{currentUser.name}</span> 👋
            </h1>
            <p className="text-xs sm:text-sm text-zinc-300 mt-1 max-w-2xl">
              Track daily work hours, manage assigned tasks with live timers, view staff presence, and request leave.
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

      {/* Top 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {currentUser.role !== 'SUPER_ADMIN' && (
          <div className="card-clean p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Today Work Hours</p>
              <h3 className="text-xl font-black text-zinc-900 font-mono mt-1">{formatTime(activeWorkSeconds)}</h3>
              <p className="text-[11px] text-emerald-600 font-medium mt-1 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> Target: 8.0 hrs
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-brand-50 text-brand-500 flex items-center justify-center">
              <Clock className="w-6 h-6" />
            </div>
          </div>
        )}

        <div className="card-clean p-4 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Monthly Work Hours</p>
            <h3 className="text-xl font-black text-zinc-900 mt-1">154.5 / 160 hrs</h3>
            <div className="w-32 bg-zinc-100 rounded-full h-1.5 mt-2 overflow-hidden">
              <div className="bg-brand-500 h-full rounded-full" style={{ width: '96.5%' }} />
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Briefcase className="w-6 h-6" />
          </div>
        </div>

        <div className="card-clean p-4 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Available Leave Balance</p>
            <h3 className="text-xl font-black text-zinc-900 mt-1">
              {currentUser.leaveBalance.paid + currentUser.leaveBalance.sick + currentUser.leaveBalance.casual} Days
            </h3>
            <p className="text-[11px] text-zinc-500 mt-1">
              Used: {currentUser.leaveBalance.used} days | Comp-off: {currentUser.leaveBalance.compOff}
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <Calendar className="w-6 h-6" />
          </div>
        </div>

        <div className="card-clean p-4 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
              {isSuperAdmin ? 'Total Active Tasks (All Teams)' : 'Assigned Active Tasks'}
            </p>
            <h3 className="text-xl font-black text-zinc-900 mt-1">{displayedTasks.length} Tasks</h3>
            <p className="text-[11px] text-brand-600 font-semibold mt-1">
              {runningTask ? '⚡ Active Task Timer Running' : 'No active timer running'}
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Timer className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Column Grid: Tasks & Staff Presence (Left 2 cols) vs Leaves & Events (Right 1 col) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Assigned Tasks + STAFF PRESENCE DIRECTLY BELOW */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Running Timer Overlay Banner */}
          {runningTask && (
            <div className="bg-gradient-to-r from-brand-500 to-brand-600 text-white rounded-2xl p-4 shadow-glow-orange flex items-center justify-between animate-pulse">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white">
                  <Timer className="w-5 h-5 animate-spin" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-white/80">Active Task Timer</p>
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
                  {isSuperAdmin
                    ? 'Super Admin view of tasks across all team members. Click any task for full session logs & actions.'
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
                  const assignee = users.find((u) => u.id === t.assigneeId);
                  const taskType = taskTypes.find((tt) => tt.id === t.typeId);
                  const isExceeded = t.loggedHours > t.estimatedHours;

                  return (
                    <div
                      key={t.id}
                      onClick={() => setSelectedTask(t)}
                      className={`p-3.5 bg-zinc-50 hover:bg-zinc-100/90 rounded-xl border border-zinc-200 flex items-center justify-between transition-all cursor-pointer ${
                        t.isTimerRunning ? 'border-brand-500 ring-2 ring-brand-500/20 bg-brand-50/20' : ''
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

                          {t.isTimerRunning && (
                            <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-brand-500 text-white animate-pulse">
                              ⚡ In Progress
                            </span>
                          )}
                        </div>

                        <h4 className="text-xs font-bold text-zinc-900 leading-snug">{t.title}</h4>

                        {/* Assignee Information on Card (especially useful for Super Admin) */}
                        <div className="flex items-center space-x-2 text-[11px] text-zinc-500 pt-0.5">
                          {assignee && (
                            <div className="flex items-center space-x-1.5">
                              <img
                                src={assignee.avatar}
                                alt={assignee.name}
                                className="w-4 h-4 rounded-full object-cover"
                              />
                              <span className="font-semibold text-zinc-700">{assignee.name}</span>
                            </div>
                          )}
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

                        {/* ONLY Show Stop button if timer is in progress / active */}
                        {t.isTimerRunning && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleTaskTimer(t.id);
                            }}
                            className="px-3 py-1.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-bold flex items-center space-x-1 shadow-glow-orange cursor-pointer animate-pulse"
                            title="Stop Active Timer"
                          >
                            <Square className="w-3.5 h-3.5 fill-current" />
                            <span>Stop</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* SECTION 2: STAFF PRESENCE (Directly below My Assigned Tasks) */}
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
              {/* Logged In Staff Column */}
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

              {/* Logged Out Staff Column */}
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
                myLeaves.map((l) => (
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
              {birthdays.map((b, idx) => (
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
              {events.map((ev) => (
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

    </div>
  );
}

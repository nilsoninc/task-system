'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useSystem } from '@/context/SystemContext';
import { formatTime, formatDate } from '@/lib/utils';
import { AttendanceRecord, Task } from '@/lib/types';
import {
  Clock,
  LogIn,
  LogOut,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  CalendarDays,
  UserCheck,
  UserX,
  TrendingUp,
  FileCheck,
  Filter,
  ListChecks,
  X,
  Search,
  RotateCcw,
  Briefcase,
  Layers,
  ChevronRight,
  Sparkles,
  Info,
  ArrowRight,
  ExternalLink,
  Users
} from 'lucide-react';

export default function AttendancePage() {
  const {
    currentUser,
    myTeamMemberIds,
    attendance,
    leaveApplications,
    users,
    tasks,
    projects,
    taskTypes,
    isCheckedIn,
    activeWorkSeconds,
    toggleCheckIn
  } = useSystem();

  // Filters State
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [filterUser, setFilterUser] = useState<string>('ALL');
  const [filterLateFlag, setFilterLateFlag] = useState<'ALL' | 'LATE' | 'ON_TIME'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Selected Attendance Record for Task Log Pop-up
  const [selectedTaskLogAtt, setSelectedTaskLogAtt] = useState<AttendanceRecord | null>(null);

  if (!currentUser) return null;

  const isSuperAdmin = currentUser.role === 'SUPER_ADMIN';
  const isAdminOrHR = currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'ADMIN_HR';
  const isTeamLead = currentUser.role === 'TEAM_LEADER';

  // Base visible records by user role
  const visibleAttendance = useMemo(() => {
    return attendance.filter(att => {
      if (isAdminOrHR) return true;
      if (isTeamLead) return att.userId === currentUser.id || myTeamMemberIds.includes(att.userId);
      return att.userId === currentUser.id;
    });
  }, [attendance, isAdminOrHR, isTeamLead, currentUser, myTeamMemberIds]);

  const availableUsers = useMemo(() => {
    if (isAdminOrHR) return users;
    if (isTeamLead) return users.filter(u => myTeamMemberIds.includes(u.id) || u.id === currentUser.id);
    return [currentUser];
  }, [isAdminOrHR, isTeamLead, users, myTeamMemberIds, currentUser]);

  // Compute Employee-level Average Working Hours per day across all available attendance records
  const employeeAvgHoursMap = useMemo(() => {
    const map: Record<string, { totalHours: number; daysCount: number; avgHours: number }> = {};
    visibleAttendance.forEach(att => {
      if (!map[att.userId]) {
        map[att.userId] = { totalHours: 0, daysCount: 0, avgHours: 0 };
      }
      map[att.userId].totalHours += att.workHours || 0;
      map[att.userId].daysCount += 1;
    });

    Object.keys(map).forEach(userId => {
      const data = map[userId];
      data.avgHours = data.daysCount > 0 ? parseFloat((data.totalHours / data.daysCount).toFixed(1)) : 0;
    });

    return map;
  }, [visibleAttendance]);

  // Filter attendance records
  const filteredAttendance = useMemo(() => {
    return visibleAttendance.filter(att => {
      // Duration Filter: fromDate
      if (fromDate && att.date < fromDate) return false;
      // Duration Filter: toDate
      if (toDate && att.date > toDate) return false;

      // Employee Selection Filter
      if (filterUser !== 'ALL' && att.userId !== filterUser) return false;

      // Late Arrival Flag Filter
      if (filterLateFlag === 'LATE' && !att.isLate) return false;
      if (filterLateFlag === 'ON_TIME' && att.isLate) return false;

      // Keyword Search Filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const emp = users.find(u => u.id === att.userId);
        const matchesName = emp?.name.toLowerCase().includes(query);
        const matchesNotes = att.notes?.toLowerCase().includes(query);
        const matchesDate = att.date.includes(query);
        if (!matchesName && !matchesNotes && !matchesDate) return false;
      }

      return true;
    });
  }, [visibleAttendance, fromDate, toDate, filterUser, filterLateFlag, searchQuery, users]);

  // Today Date & Derived Metrics for Top 3 KPI Cards
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const formattedToday = useMemo(() => formatDate(todayStr), [todayStr]);

  // Tracked team members for today's pulse
  const trackedMembers = useMemo(() => {
    if (isAdminOrHR) return users.filter(u => u.role !== 'SUPER_ADMIN');
    if (isTeamLead) return users.filter(u => myTeamMemberIds.includes(u.id));
    return [currentUser];
  }, [isAdminOrHR, isTeamLead, users, myTeamMemberIds, currentUser]);

  // 1. Today's Present & Absent calculation
  const todayPresentMembers = useMemo(() => {
    return trackedMembers.filter(u => {
      const hasTodayAtt = attendance.some(
        a => a.userId === u.id && a.date === todayStr && a.status !== 'ABSENT'
      );
      return hasTodayAtt || u.isLoggedIn || u.status === 'ONLINE' || !!u.checkInTime;
    });
  }, [trackedMembers, attendance, todayStr]);

  const todayPresentCount = todayPresentMembers.length;
  const todayAbsentCount = Math.max(0, trackedMembers.length - todayPresentCount);

  // 2. Late Arrival Flagged - Number of team members flagged today
  const todayLateMembers = useMemo(() => {
    return trackedMembers.filter(u => {
      return attendance.some(a => a.userId === u.id && a.date === todayStr && a.isLate);
    });
  }, [trackedMembers, attendance, todayStr]);

  const todayLateCount = todayLateMembers.length;

  // 3. Today's Leave - Count of team members on approved/active leave today
  const todayLeaveApplications = useMemo(() => {
    return leaveApplications.filter(l => {
      if (l.isSoftDeleted || l.status === 'REJECTED') return false;
      const isScoped = trackedMembers.some(u => u.id === l.userId);
      return isScoped && todayStr >= l.startDate && todayStr <= l.endDate;
    });
  }, [leaveApplications, trackedMembers, todayStr]);

  const todayLeaveCount = todayLeaveApplications.length;

  // Summary Metrics for filtered attendance
  const totalFilteredHours = useMemo(() => {
    return filteredAttendance.reduce((acc, curr) => acc + (curr.workHours || 0), 0);
  }, [filteredAttendance]);

  const avgWorkingHoursFiltered = useMemo(() => {
    if (filteredAttendance.length === 0) return 0;
    return parseFloat((totalFilteredHours / filteredAttendance.length).toFixed(1));
  }, [totalFilteredHours, filteredAttendance]);

  const lateArrivalsCount = useMemo(() => {
    return filteredAttendance.filter(a => a.isLate).length;
  }, [filteredAttendance]);

  // Quick Preset Handlers
  const handleQuickDuration = (preset: 'ALL' | 'TODAY' | 'WEEK' | 'MONTH') => {
    const today = new Date();
    const todayIso = today.toISOString().split('T')[0];

    if (preset === 'ALL') {
      setFromDate('');
      setToDate('');
    } else if (preset === 'TODAY') {
      setFromDate(todayIso);
      setToDate(todayIso);
    } else if (preset === 'WEEK') {
      const past7 = new Date();
      past7.setDate(today.getDate() - 7);
      setFromDate(past7.toISOString().split('T')[0]);
      setToDate(todayIso);
    } else if (preset === 'MONTH') {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      setFromDate(firstDay.toISOString().split('T')[0]);
      setToDate(todayIso);
    }
  };

  const handleResetFilters = () => {
    setFromDate('');
    setToDate('');
    setFilterUser('ALL');
    setFilterLateFlag('ALL');
    setSearchQuery('');
  };

  // Find Tasks related to selected attendance record
  const selectedTaskLogData = useMemo(() => {
    if (!selectedTaskLogAtt) return { user: null, matchedTasks: [], totalTaskHours: 0 };
    const emp = users.find(u => u.id === selectedTaskLogAtt.userId);
    const dateStr = selectedTaskLogAtt.date;

    // Find all tasks assigned to this user or with worklogs logged on this date
    const matchedTasks: { task: Task; worklogsOnDate: Task['worklogs']; hoursOnDate: number }[] = [];
    let totalTaskHours = 0;

    tasks.forEach(t => {
      // Find worklogs matching this date & user
      const logsOnDate = (t.worklogs || []).filter(wl => {
        const isUser = wl.userId === selectedTaskLogAtt.userId;
        const isDateMatch = wl.startTime ? wl.startTime.includes(dateStr) : false;
        return isUser && isDateMatch;
      });

      const hoursFromLogs = logsOnDate.reduce((sum, l) => sum + (l.durationSeconds / 3600), 0);

      // If worklog matches or the task is assigned to user and was active around this date
      const isAssigned = t.assigneeId === selectedTaskLogAtt.userId;
      if (logsOnDate.length > 0 || isAssigned) {
        matchedTasks.push({
          task: t,
          worklogsOnDate: logsOnDate,
          hoursOnDate: parseFloat(hoursFromLogs.toFixed(1))
        });
        totalTaskHours += hoursFromLogs;
      }
    });

    return {
      user: emp,
      matchedTasks,
      totalTaskHours: parseFloat(totalTaskHours.toFixed(1))
    };
  }, [selectedTaskLogAtt, users, tasks]);

  return (
    <div className="space-y-6">
      
      {/* Page Title & Check-In Widget (EXCLUDED FOR SUPER ADMIN) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-zinc-900 tracking-tight flex items-center gap-2">
            <Clock className="w-6 h-6 text-brand-500" /> Attendance & Work Hours Log
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            Real-time check-in / check-out session tracking, late arrival alerts, daily work hours, and task execution logs.
          </p>
        </div>

        {/* Live Active Clock Widget - Excluded for Super Admin */}
        {!isSuperAdmin && (
          <div className="bg-obsidian-950 text-white p-3 rounded-2xl border border-obsidian-800 flex items-center space-x-4 shadow-xl">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-brand-400 block">Today Session</span>
              <span className="font-mono text-lg font-black text-white">{formatTime(activeWorkSeconds)}</span>
            </div>

            <button
              onClick={toggleCheckIn}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-glow-orange cursor-pointer flex items-center space-x-1.5 ${
                isCheckedIn
                  ? 'bg-rose-500 hover:bg-rose-600 text-white'
                  : 'bg-brand-500 hover:bg-brand-600 text-white'
              }`}
            >
              {isCheckedIn ? <LogOut className="w-4 h-4" /> : <LogIn className="w-4 h-4" />}
              <span>{isCheckedIn ? 'Check Out' : 'Check In'}</span>
            </button>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 3 DASHBOARD SUMMARY METRIC CARDS                                           */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* 1. Today's Attendance (date) - <present> / <Absent> */}
        <div className="card-clean p-5 border-l-4 border-l-emerald-500 flex flex-col justify-between hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-extrabold text-zinc-400 uppercase tracking-wider">
                Today&apos;s Attendance ({formattedToday})
              </p>
              <div className="flex items-baseline space-x-2 mt-1.5">
                <span className="text-3xl font-black text-emerald-600 font-mono">{todayPresentCount}</span>
                <span className="text-xl font-bold text-zinc-300 font-mono">/</span>
                <span className="text-3xl font-black text-rose-500 font-mono">{todayAbsentCount}</span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-sm">
              <UserCheck className="w-6 h-6" />
            </div>
          </div>
          
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-zinc-100 text-xs">
            <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              {todayPresentCount} Present
            </span>
            <span className="inline-flex items-center gap-1 font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
              {todayAbsentCount} Absent
            </span>
            <span className="text-[11px] text-zinc-400 ml-auto font-medium">
              {trackedMembers.length} Staff
            </span>
          </div>
        </div>

        {/* 2. Late Arrival Flagged - <Number of Team members> */}
        <div className="card-clean p-5 border-l-4 border-l-amber-500 flex flex-col justify-between hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-extrabold text-zinc-400 uppercase tracking-wider">
                Late Arrival Flagged
              </p>
              <div className="flex items-baseline space-x-2 mt-1.5">
                <span className="text-3xl font-black text-amber-600 font-mono">{todayLateCount}</span>
                <span className="text-xs font-extrabold text-zinc-500 uppercase tracking-wider">
                  {todayLateCount === 1 ? 'Team Member' : 'Team Members'}
                </span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shadow-sm">
              <AlertTriangle className="w-6 h-6" />
            </div>
          </div>

          <div className="flex items-center justify-between mt-3 pt-3 border-t border-zinc-100 text-xs">
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">
              Flagged for check-in after grace period
            </span>
            <span className="text-[11px] font-bold text-zinc-400">
              {lateArrivalsCount} Total in Filter
            </span>
          </div>
        </div>

        {/* 3. Today's Leave - <count of Team Members> connect with Leave section and filtered with today's date */}
        <div className="card-clean p-5 border-l-4 border-l-blue-500 flex flex-col justify-between hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-extrabold text-zinc-400 uppercase tracking-wider">
                Today&apos;s Leave
              </p>
              <div className="flex items-baseline space-x-2 mt-1.5">
                <span className="text-3xl font-black text-blue-600 font-mono">{todayLeaveCount}</span>
                <span className="text-xs font-extrabold text-zinc-500 uppercase tracking-wider">
                  {todayLeaveCount === 1 ? 'Team Member' : 'Team Members'}
                </span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-sm">
              <CalendarDays className="w-6 h-6" />
            </div>
          </div>

          <div className="flex items-center justify-between mt-3 pt-3 border-t border-zinc-100 text-xs">
            <span className="text-[11px] font-medium text-zinc-500">
              On approved leave today
            </span>
            <Link
              href="/leaves?filter=today"
              className="inline-flex items-center gap-1 text-xs font-bold text-brand-600 hover:text-brand-700 bg-brand-50 hover:bg-brand-100 px-2.5 py-1 rounded-lg transition-colors group cursor-pointer"
            >
              <span>View in Leave section</span>
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>

      </div>

      {/* Advanced Filters Section */}
      <div className="card-clean p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-100 pb-3">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 bg-brand-50 text-brand-500 rounded-lg">
              <Filter className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-zinc-900">Attendance Filter & Date Range</h3>
              <p className="text-[11px] text-zinc-400">Filter by duration dates, employee selection, and late arrival flag</p>
            </div>
          </div>

          {/* Preset Buttons & Clear */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] text-zinc-400 font-semibold mr-1 hidden sm:inline">Presets:</span>
            <button
              onClick={() => handleQuickDuration('ALL')}
              className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-colors cursor-pointer ${
                !fromDate && !toDate ? 'bg-brand-500 text-white shadow-sm' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
              }`}
            >
              All Time
            </button>
            <button
              onClick={() => handleQuickDuration('TODAY')}
              className="px-2.5 py-1 text-[11px] font-bold bg-zinc-100 text-zinc-600 hover:bg-zinc-200 rounded-lg transition-colors cursor-pointer"
            >
              Today
            </button>
            <button
              onClick={() => handleQuickDuration('WEEK')}
              className="px-2.5 py-1 text-[11px] font-bold bg-zinc-100 text-zinc-600 hover:bg-zinc-200 rounded-lg transition-colors cursor-pointer"
            >
              Last 7 Days
            </button>
            <button
              onClick={() => handleQuickDuration('MONTH')}
              className="px-2.5 py-1 text-[11px] font-bold bg-zinc-100 text-zinc-600 hover:bg-zinc-200 rounded-lg transition-colors cursor-pointer"
            >
              This Month
            </button>
            {(fromDate || toDate || filterUser !== 'ALL' || filterLateFlag !== 'ALL' || searchQuery) && (
              <button
                onClick={handleResetFilters}
                className="px-2.5 py-1 text-[11px] font-bold text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer flex items-center gap-1 ml-1"
                title="Reset all filters"
              >
                <RotateCcw className="w-3 h-3" /> Reset
              </button>
            )}
          </div>
        </div>

        {/* Filter Inputs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          
          {/* Duration: From - To */}
          <div>
            <label className="font-bold text-zinc-700 block mb-1 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-brand-500" /> Duration (From Date)
            </label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full bg-zinc-50 border border-zinc-200 px-3 py-2 rounded-xl focus:outline-none focus:border-brand-500 text-zinc-800 font-medium"
            />
          </div>

          <div>
            <label className="font-bold text-zinc-700 block mb-1 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-brand-500" /> Duration (To Date)
            </label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full bg-zinc-50 border border-zinc-200 px-3 py-2 rounded-xl focus:outline-none focus:border-brand-500 text-zinc-800 font-medium"
            />
          </div>

          {/* Employee Selection with "All" */}
          <div>
            <label className="font-bold text-zinc-700 block mb-1 flex items-center gap-1">
              <UserCheck className="w-3.5 h-3.5 text-brand-500" /> Employee Selection
            </label>
            <select
              value={filterUser}
              onChange={(e) => setFilterUser(e.target.value)}
              className="w-full bg-zinc-50 border border-zinc-200 px-3 py-2 rounded-xl focus:outline-none focus:border-brand-500 text-zinc-800 font-medium cursor-pointer"
            >
              <option value="ALL">All Employees ({availableUsers.length})</option>
              {availableUsers.map(u => (
                <option key={u.id} value={u.id}>
                  {u.name} — {u.role.replace('_', ' ')}
                </option>
              ))}
            </select>
          </div>

          {/* Late Arrival Flag */}
          <div>
            <label className="font-bold text-zinc-700 block mb-1 flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500" /> Late Arrival Flag
            </label>
            <select
              value={filterLateFlag}
              onChange={(e) => setFilterLateFlag(e.target.value as 'ALL' | 'LATE' | 'ON_TIME')}
              className="w-full bg-zinc-50 border border-zinc-200 px-3 py-2 rounded-xl focus:outline-none focus:border-brand-500 text-zinc-800 font-medium cursor-pointer"
            >
              <option value="ALL">All Attendance Records</option>
              <option value="LATE">⚠️ Late Arrivals Only</option>
              <option value="ON_TIME">✅ On-Time Only</option>
            </select>
          </div>

        </div>

        {/* Search Notes & Keyword Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by employee name, notes, or date keywords..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs focus:outline-none focus:border-brand-500 text-zinc-800 font-medium"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Attendance Log Table */}
      <div className="card-clean p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <FileCheck className="w-5 h-5 text-brand-500" />
            <div>
              <h3 className="font-bold text-sm text-zinc-900">Employee Attendance Register</h3>
              <p className="text-[11px] text-zinc-400">
                Showing {filteredAttendance.length} records • Click on the Task Log icon to inspect daily task executions
              </p>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-100 border-b border-zinc-200 text-zinc-600 font-extrabold uppercase tracking-wider">
              <tr>
                <th className="p-3">Employee</th>
                <th className="p-3">Date</th>
                <th className="p-3">Check-In</th>
                <th className="p-3">Check-Out</th>
                <th className="p-3">Work Hours</th>
                <th className="p-3">Avg working Hrs (per day)</th>
                <th className="p-3">Late Arrival Flag</th>
                <th className="p-3 text-center">Task Log</th>
                <th className="p-3">Notes / Rationale</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filteredAttendance.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-zinc-400">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <Clock className="w-8 h-8 text-zinc-300 stroke-1" />
                      <p className="font-bold text-zinc-600">No attendance records found</p>
                      <p className="text-xs text-zinc-400">Try adjusting your duration dates or filter criteria</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredAttendance.map((att) => {
                  const emp = users.find(u => u.id === att.userId);
                  const userAvg = employeeAvgHoursMap[att.userId]?.avgHours || att.workHours || 0;
                  const totalDays = employeeAvgHoursMap[att.userId]?.daysCount || 1;

                  // Count tasks worked on by this employee on this date
                  const userTasksCount = tasks.filter(t => {
                    const hasLog = (t.worklogs || []).some(w => w.userId === att.userId && w.startTime?.includes(att.date));
                    return hasLog || t.assigneeId === att.userId;
                  }).length;

                  return (
                    <tr key={att.id} className="hover:bg-zinc-50/80 transition-colors group">
                      {/* Employee Profile */}
                      <td className="p-3">
                        <div className="flex items-center space-x-2.5">
                          <img
                            src={emp?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                            alt={emp?.name}
                            className="w-8 h-8 rounded-full object-cover ring-1 ring-zinc-200 shadow-sm"
                          />
                          <div>
                            <p className="font-bold text-zinc-900 group-hover:text-brand-600 transition-colors">{emp?.name || 'Staff User'}</p>
                            <p className="text-[10px] text-zinc-400">{emp?.title || emp?.role?.replace('_', ' ')}</p>
                          </div>
                        </div>
                      </td>

                      {/* Date */}
                      <td className="p-3 font-semibold text-zinc-700 whitespace-nowrap">
                        {formatDate(att.date)}
                      </td>

                      {/* Check-In */}
                      <td className="p-3 font-mono font-bold text-emerald-600 whitespace-nowrap">
                        {att.checkIn}
                      </td>

                      {/* Check-Out */}
                      <td className="p-3 font-mono font-bold text-zinc-600 whitespace-nowrap">
                        {att.checkOut || (
                          <span className="px-2 py-0.5 bg-brand-50 text-brand-600 rounded text-[10px] font-bold border border-brand-200">
                            Active Session
                          </span>
                        )}
                      </td>

                      {/* Total Work Hours for Day */}
                      <td className="p-3 font-mono font-bold text-zinc-900 whitespace-nowrap">
                        <div className="flex items-center space-x-1.5">
                          <span>{att.workHours} hrs</span>
                          <div className="w-12 bg-zinc-100 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-brand-500 h-full rounded-full"
                              style={{ width: `${Math.min(100, (att.workHours / 8.5) * 100)}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Avg working Hrs (per day) Column */}
                      <td className="p-3 whitespace-nowrap">
                        <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 bg-zinc-100 text-zinc-800 rounded-lg border border-zinc-200 font-mono font-bold text-xs">
                          <TrendingUp className="w-3 h-3 text-brand-500" />
                          <span>{userAvg} hrs/day</span>
                          <span className="text-[9px] text-zinc-400 font-sans font-normal">({totalDays}d)</span>
                        </div>
                      </td>

                      {/* Late Arrival Flag Column */}
                      <td className="p-3 whitespace-nowrap">
                        {att.isLate ? (
                          <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 flex items-center w-fit gap-1 shadow-xs">
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-500" /> LATE ARRIVAL
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center w-fit gap-1 shadow-xs">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> ON-TIME
                          </span>
                        )}
                      </td>

                      {/* Task Log Column - Interactive Popup Icon */}
                      <td className="p-3 text-center whitespace-nowrap">
                        <button
                          onClick={() => setSelectedTaskLogAtt(att)}
                          className="inline-flex items-center space-x-1.5 px-2.5 py-1.5 bg-brand-50 hover:bg-brand-100 text-brand-700 hover:text-brand-800 rounded-xl border border-brand-200 text-xs font-bold transition-all shadow-xs cursor-pointer group-hover:border-brand-300"
                          title="Click to view all tasks performed by this employee"
                        >
                          <ListChecks className="w-3.5 h-3.5 text-brand-500" />
                          <span>Task Log</span>
                          <span className="bg-brand-500 text-white text-[9px] font-black px-1.5 py-0.2 rounded-full">
                            {userTasksCount}
                          </span>
                        </button>
                      </td>

                      {/* Notes / Rationale */}
                      <td className="p-3 text-zinc-500 italic max-w-xs truncate">
                        {att.notes || 'Normal shift routine'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Task Log Interactive Modal / Pop-Up */}
      {selectedTaskLogAtt && selectedTaskLogData.user && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-zinc-200 text-zinc-900 rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
              <div className="flex items-center space-x-3">
                <img
                  src={selectedTaskLogData.user.avatar}
                  alt={selectedTaskLogData.user.name}
                  className="w-11 h-11 rounded-2xl object-cover ring-2 ring-brand-500/20 shadow-sm"
                />
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="font-black text-base text-zinc-900">
                      {selectedTaskLogData.user.name}
                    </h3>
                    <span className="px-2 py-0.5 bg-brand-50 text-brand-600 rounded text-[10px] font-extrabold uppercase border border-brand-200">
                      {selectedTaskLogData.user.role.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 flex items-center gap-2 mt-0.5">
                    <span>📅 Date: <strong className="text-zinc-800">{formatDate(selectedTaskLogAtt.date)}</strong></span>
                    <span>•</span>
                    <span>Shift Attendance: <strong className="text-emerald-600 font-mono">{selectedTaskLogAtt.workHours} hrs</strong></span>
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedTaskLogAtt(null)}
                className="p-2 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Metrics Overview */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 bg-zinc-50 rounded-2xl border border-zinc-100 text-center">
                <p className="text-[10px] font-bold uppercase text-zinc-400 tracking-wider">Tasks in Scope</p>
                <p className="text-lg font-black text-zinc-900 mt-0.5">{selectedTaskLogData.matchedTasks.length}</p>
              </div>
              <div className="p-3 bg-brand-50 rounded-2xl border border-brand-100 text-center">
                <p className="text-[10px] font-bold uppercase text-brand-600 tracking-wider">Logged Task Hours</p>
                <p className="text-lg font-black text-brand-600 font-mono mt-0.5">{selectedTaskLogData.totalTaskHours} hrs</p>
              </div>
              <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-100 text-center">
                <p className="text-[10px] font-bold uppercase text-emerald-600 tracking-wider">Daily Attendance</p>
                <p className="text-lg font-black text-emerald-700 font-mono mt-0.5">{selectedTaskLogAtt.workHours} hrs</p>
              </div>
            </div>

            {/* Matched Tasks & Worklogs List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-extrabold text-xs text-zinc-800 uppercase tracking-wider flex items-center gap-1.5">
                  <ListChecks className="w-4 h-4 text-brand-500" /> Tasks Performed & Active Assignments
                </h4>
                <span className="text-[11px] text-zinc-400 font-medium">
                  {selectedTaskLogData.matchedTasks.length} tasks recorded
                </span>
              </div>

              {selectedTaskLogData.matchedTasks.length === 0 ? (
                <div className="p-6 bg-zinc-50 border border-zinc-100 rounded-2xl text-center text-zinc-400 space-y-1">
                  <Info className="w-6 h-6 mx-auto text-zinc-300" />
                  <p className="text-xs font-bold text-zinc-600">No active tasks recorded for this date</p>
                  <p className="text-[11px] text-zinc-400">Employee was present for {selectedTaskLogAtt.workHours} hours on routine operational tasks.</p>
                </div>
              ) : (
                <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                  {selectedTaskLogData.matchedTasks.map(({ task, worklogsOnDate, hoursOnDate }) => {
                    const project = projects.find(p => p.id === task.projectId);
                    const taskType = taskTypes.find(t => t.id === task.typeId);

                    return (
                      <div
                        key={task.id}
                        className="p-3.5 bg-zinc-50/80 hover:bg-zinc-50 border border-zinc-200/80 rounded-2xl space-y-2 transition-all"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex flex-wrap items-center gap-1.5 mb-1">
                              <span className="px-2 py-0.5 bg-white border border-zinc-200 text-zinc-700 rounded text-[10px] font-bold">
                                {project?.name || 'General Project'}
                              </span>
                              {taskType && (
                                <span
                                  className="px-2 py-0.5 rounded text-[10px] font-bold text-white shadow-xs"
                                  style={{ backgroundColor: taskType.color || '#F97316' }}
                                >
                                  {taskType.name}
                                </span>
                              )}
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  task.priority === 'URGENT'
                                    ? 'bg-rose-100 text-rose-700 border border-rose-200'
                                    : task.priority === 'HIGH'
                                    ? 'bg-amber-100 text-amber-700 border border-amber-200'
                                    : 'bg-zinc-200 text-zinc-700'
                                }`}
                              >
                                {task.priority}
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  task.status === 'COMPLETED'
                                    ? 'bg-emerald-100 text-emerald-700'
                                    : task.status === 'IN_PROGRESS'
                                    ? 'bg-blue-100 text-blue-700'
                                    : 'bg-zinc-100 text-zinc-600'
                                }`}
                              >
                                {task.status.replace('_', ' ')}
                              </span>
                            </div>
                            <h5 className="font-bold text-xs text-zinc-900">{task.title}</h5>
                            <p className="text-[11px] text-zinc-500 line-clamp-1 mt-0.5">{task.description}</p>
                          </div>

                          <div className="text-right flex-shrink-0">
                            <span className="font-mono text-xs font-black text-brand-600 block">
                              {task.loggedHours} / {task.estimatedHours} hrs
                            </span>
                            <span className="text-[10px] text-zinc-400 font-semibold">Total Logged</span>
                          </div>
                        </div>

                        {/* Worklog session details if any */}
                        {worklogsOnDate.length > 0 && (
                          <div className="pt-2 border-t border-zinc-200/60 space-y-1">
                            <p className="text-[10px] font-extrabold uppercase text-zinc-400 tracking-wider">
                              Worklog Sessions on {formatDate(selectedTaskLogAtt.date)}:
                            </p>
                            {worklogsOnDate.map((wl, idx) => (
                              <div key={idx} className="flex items-center justify-between text-[11px] bg-white p-1.5 px-2.5 rounded-lg border border-zinc-200/60">
                                <span className="text-zinc-600 italic">
                                  {wl.notes || 'Routine task execution'}
                                </span>
                                <span className="font-mono font-bold text-zinc-800">
                                  {(wl.durationSeconds / 3600).toFixed(1)} hrs
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="pt-2 border-t border-zinc-100 flex items-center justify-between">
              <span className="text-[11px] text-zinc-400">
                Shift status: <strong className={selectedTaskLogAtt.isLate ? 'text-rose-600' : 'text-emerald-600'}>
                  {selectedTaskLogAtt.isLate ? 'Late Arrival' : 'On-Time'}
                </strong> ({selectedTaskLogAtt.checkIn} - {selectedTaskLogAtt.checkOut || 'Active'})
              </span>
              <button
                onClick={() => setSelectedTaskLogAtt(null)}
                className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Close Log
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

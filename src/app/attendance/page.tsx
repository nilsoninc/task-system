'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useSystem } from '@/context/SystemContext';
import { formatTime, formatDate } from '@/lib/utils';
import { AttendanceRecord } from '@/lib/types';
import {
  Clock,
  LogIn,
  LogOut,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  CalendarDays,
  TrendingUp,
  Briefcase,
  X,
  FileCheck,
  ChevronRight,
  Sparkles,
  Info,
  ArrowRight,
  ExternalLink,
  Award,
  Layers
} from 'lucide-react';
import { TaskWorklogModal } from '@/components/modals/TaskWorklogModal';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const YEARS = ['2024', '2025', '2026', '2027'];

export default function AttendancePage() {
  const {
    currentUser,
    myTeamMemberIds,
    attendance,
    leaveApplications,
    compOffRequests,
    users,
    tasks,
    projects,
    isCheckedIn,
    activeWorkSeconds,
    toggleCheckIn
  } = useSystem();

  const todayDate = new Date();
  const currentMonthIdx = todayDate.getMonth(); // 0-11
  const currentYearStr = todayDate.getFullYear().toString();

  // Filters State: Month & Year
  const [selectedMonth, setSelectedMonth] = useState<number>(currentMonthIdx);
  const [selectedYear, setSelectedYear] = useState<string>(currentYearStr);

  // Active KPI modal for card clicks
  const [activeKpiModal, setActiveKpiModal] = useState<'attendance' | 'late' | 'leaves' | 'avg_hours' | null>(null);

  // Selected Attendance Record for Task Log Pop-up
  const [selectedTaskLogAtt, setSelectedTaskLogAtt] = useState<AttendanceRecord | null>(null);

  if (!currentUser) return null;

  const isSuperAdmin = currentUser.role === 'SUPER_ADMIN';
  const isAdminOrHR = isSuperAdmin || currentUser.role === 'ADMIN_HR';
  const isTeamLead = currentUser.role === 'TEAM_LEADER';
  const isRegularEmployee = currentUser.role === 'EMPLOYEE';

  // Format month prefix e.g. "2026-08"
  const selectedMonthStr = String(selectedMonth + 1).padStart(2, '0');
  const selectedMonthPrefix = `${selectedYear}-${selectedMonthStr}`;
  const selectedMonthLabel = `${MONTH_NAMES[selectedMonth]} ${selectedYear}`;

  // User's Attendance for selected month
  const userMonthAttendance = useMemo(() => {
    return attendance.filter(a => a.userId === currentUser.id && a.date.startsWith(selectedMonthPrefix));
  }, [attendance, currentUser.id, selectedMonthPrefix]);

  // User's Leaves for selected month
  const userMonthLeaves = useMemo(() => {
    return leaveApplications.filter(l => {
      if (l.userId !== currentUser.id || l.isSoftDeleted || l.status === 'REJECTED') return false;
      return l.startDate.startsWith(selectedMonthPrefix) || l.endDate.startsWith(selectedMonthPrefix);
    });
  }, [leaveApplications, currentUser.id, selectedMonthPrefix]);

  // User's Comp-offs for selected month
  const userMonthCompOffs = useMemo(() => {
    return compOffRequests.filter(co => {
      if (co.userId !== currentUser.id || co.status === 'REJECTED') return false;
      return co.workDate.startsWith(selectedMonthPrefix);
    });
  }, [compOffRequests, currentUser.id, selectedMonthPrefix]);

  // 1. Current Month Attendance Metrics
  const totalDaysInSelectedMonth = useMemo(() => {
    return new Date(Number(selectedYear), selectedMonth + 1, 0).getDate();
  }, [selectedYear, selectedMonth]);

  // Estimated working days (excluding Sundays approx)
  const workingDaysInMonth = Math.round(totalDaysInSelectedMonth * 0.77);
  const presentDaysCount = userMonthAttendance.filter(a => a.status === 'PRESENT').length;

  // 2. Late Arrival Flags
  const lateAttendanceRecords = useMemo(() => {
    return userMonthAttendance.filter(a => a.isLate);
  }, [userMonthAttendance]);
  const totalLateFlags = lateAttendanceRecords.length;

  // 3. Leaves Taken & Comp-off details
  const totalLeavesDaysTaken = useMemo(() => {
    return userMonthLeaves.reduce((acc, l) => acc + (l.days || 1), 0);
  }, [userMonthLeaves]);

  // 4. Average Working Hours
  const totalHoursWorkedInMonth = useMemo(() => {
    return userMonthAttendance.reduce((acc, a) => acc + (a.workHours || 0), 0);
  }, [userMonthAttendance]);

  const avgWorkingHoursPerDay = useMemo(() => {
    if (userMonthAttendance.length === 0) return 0;
    return parseFloat((totalHoursWorkedInMonth / userMonthAttendance.length).toFixed(1));
  }, [totalHoursWorkedInMonth, userMonthAttendance.length]);

  // Build combined register rows for the table: attendance days + leave days + comp-off days
  const registerRows = useMemo(() => {
    const rowMap = new Map<string, {
      date: string;
      checkIn?: string;
      checkOut?: string;
      workHours?: number;
      isLate?: boolean;
      status: string;
      notes?: string;
      isLeave?: boolean;
      isCompOff?: boolean;
      leaveType?: string;
      record?: AttendanceRecord;
    }>();

    // 1. Add attendance records
    userMonthAttendance.forEach(att => {
      rowMap.set(att.date, {
        date: att.date,
        checkIn: att.checkIn,
        checkOut: att.checkOut,
        workHours: att.workHours,
        isLate: att.isLate,
        status: att.status,
        notes: att.notes,
        record: att
      });
    });

    // 2. Add Leaves as rows if not already checked in
    userMonthLeaves.forEach(l => {
      const d = l.startDate;
      if (d.startsWith(selectedMonthPrefix)) {
        if (!rowMap.has(d)) {
          rowMap.set(d, {
            date: d,
            checkIn: '--:--',
            checkOut: '--:--',
            workHours: 0,
            status: `${l.leaveType} LEAVE`,
            notes: `Approved Leave: ${l.reason}`,
            isLeave: true,
            leaveType: l.leaveType
          });
        }
      }
    });

    // 3. Add Comp-off days
    userMonthCompOffs.forEach(co => {
      const d = co.workDate;
      if (d.startsWith(selectedMonthPrefix) && !rowMap.has(d)) {
        rowMap.set(d, {
          date: d,
          checkIn: '--:--',
          checkOut: '--:--',
          workHours: co.hoursWorked,
          status: 'COMP-OFF WORK',
          notes: `Comp-off credited: ${co.reason}`,
          isCompOff: true
        });
      }
    });

    // Sort descending by date
    return Array.from(rowMap.values()).sort((a, b) => b.date.localeCompare(a.date));
  }, [userMonthAttendance, userMonthLeaves, userMonthCompOffs, selectedMonthPrefix]);

  const getDayOfWeek = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', { weekday: 'short' });
    } catch {
      return '';
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Title Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-zinc-900 tracking-tight flex items-center gap-2">
            <Clock className="w-6 h-6 text-brand-500" /> Attendance & Work Hours Log
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            Personal attendance register, monthly working hours, late arrival flags, and leave records.
          </p>
        </div>

        {currentUser.role !== 'SUPER_ADMIN' && (
          <div className="flex items-center space-x-3 bg-zinc-50 border border-zinc-200 p-2 rounded-2xl">
            <div className="text-left px-2">
              <p className="text-[10px] font-bold uppercase text-zinc-400">Today Session</p>
              <p className="text-xs font-mono font-bold text-zinc-900">{formatTime(activeWorkSeconds)}</p>
            </div>
            <button
              onClick={toggleCheckIn}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer flex items-center space-x-1.5 ${
                isCheckedIn
                  ? 'bg-rose-600 hover:bg-rose-700 text-white'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              }`}
            >
              {isCheckedIn ? <LogOut className="w-3.5 h-3.5" /> : <LogIn className="w-3.5 h-3.5" />}
              <span>{isCheckedIn ? 'Check Out' : 'Check In'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Top 4 KPI Cards (All with Click Events) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* 1st Card: Current Month Attendance */}
        <div
          onClick={() => setActiveKpiModal('attendance')}
          className="card-clean p-4 flex items-center justify-between hover:border-emerald-500 hover:shadow-md transition-all cursor-pointer group"
          title="Click to view detailed attendance breakdown"
        >
          <div>
            <div className="flex items-center space-x-1.5">
              <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider group-hover:text-emerald-600 transition-colors">
                Current Month Attendance
              </p>
              <span className="text-[9px] bg-emerald-50 text-emerald-700 font-bold px-1.5 py-0.2 rounded">Click</span>
            </div>
            <h3 className="text-xl font-black text-zinc-900 mt-1 font-mono">
              {presentDaysCount} / {workingDaysInMonth} Days
            </h3>
            <div className="w-28 bg-zinc-100 rounded-full h-1.5 mt-2 overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full"
                style={{ width: `${Math.min(100, (presentDaysCount / Math.max(1, workingDaysInMonth)) * 100)}%` }}
              />
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-all flex items-center justify-center">
            <Calendar className="w-6 h-6" />
          </div>
        </div>

        {/* 2nd Card: Late Arrival Flagged */}
        <div
          onClick={() => setActiveKpiModal('late')}
          className="card-clean p-4 flex items-center justify-between hover:border-amber-500 hover:shadow-md transition-all cursor-pointer group"
          title="Click to view late arrival records and timestamps"
        >
          <div>
            <div className="flex items-center space-x-1.5">
              <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider group-hover:text-amber-600 transition-colors">
                Late Arrival Flagged
              </p>
              <span className="text-[9px] bg-amber-50 text-amber-700 font-bold px-1.5 py-0.2 rounded">Click</span>
            </div>
            <h3 className="text-xl font-black text-zinc-900 mt-1 font-mono">
              {totalLateFlags} Flags
            </h3>
            <p className="text-[11px] text-zinc-500 mt-1">
              {totalLateFlags > 0 ? '⚠️ Punch-in after 09:30 AM' : '✅ 100% On-Time Record'}
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition-all flex items-center justify-center">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        {/* 3rd Card: My Leaves */}
        <div
          onClick={() => setActiveKpiModal('leaves')}
          className="card-clean p-4 flex items-center justify-between hover:border-purple-500 hover:shadow-md transition-all cursor-pointer group"
          title="Click to view leaves and comp-off records"
        >
          <div>
            <div className="flex items-center space-x-1.5">
              <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider group-hover:text-purple-600 transition-colors">
                My Leaves
              </p>
              <span className="text-[9px] bg-purple-50 text-purple-700 font-bold px-1.5 py-0.2 rounded">Click</span>
            </div>
            <h3 className="text-xl font-black text-zinc-900 mt-1 font-mono">
              {totalLeavesDaysTaken} Days Taken
            </h3>
            <p className="text-[11px] text-purple-700 font-semibold mt-1">
              Comp-off: {userMonthCompOffs.length} Day(s)
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-all flex items-center justify-center">
            <CalendarDays className="w-6 h-6" />
          </div>
        </div>

        {/* 4th Card: AVG. Working Hrs. */}
        <div
          onClick={() => setActiveKpiModal('avg_hours')}
          className="card-clean p-4 flex items-center justify-between hover:border-blue-500 hover:shadow-md transition-all cursor-pointer group"
          title="Click to view average working hours analysis"
        >
          <div>
            <div className="flex items-center space-x-1.5">
              <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider group-hover:text-blue-600 transition-colors">
                AVG. Working Hrs.
              </p>
              <span className="text-[9px] bg-blue-50 text-blue-700 font-bold px-1.5 py-0.2 rounded">Click</span>
            </div>
            <h3 className="text-xl font-black text-zinc-900 mt-1 font-mono">
              {avgWorkingHoursPerDay} hrs / day
            </h3>
            <p className="text-[11px] text-emerald-600 font-medium mt-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> Total: {totalHoursWorkedInMonth.toFixed(1)} hrs
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all flex items-center justify-center">
            <Briefcase className="w-6 h-6" />
          </div>
        </div>

      </div>

      {/* Attendance Details (Month & Year Selectors) */}
      <div className="card-clean p-5 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-100 pb-3">
          <div>
            <h2 className="font-extrabold text-sm text-zinc-900 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-brand-500" /> Attendance Details
            </h2>
            <p className="text-xs text-zinc-500">
              Select month and year to view your personal attendance register and work session logs.
            </p>
          </div>

          {/* Month & Year Dropdown Controls */}
          <div className="flex items-center space-x-2">
            <div>
              <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-0.5">Month</label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="px-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold text-zinc-800 focus:outline-none focus:border-brand-500 cursor-pointer"
              >
                {MONTH_NAMES.map((m, idx) => (
                  <option key={idx} value={idx}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-0.5">Year</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="px-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold text-zinc-800 focus:outline-none focus:border-brand-500 cursor-pointer"
              >
                {YEARS.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Quick Month Summary Strip */}
        <div className="flex items-center space-x-4 text-xs font-medium text-zinc-600 pt-1">
          <span>Viewing: <strong className="text-zinc-900">{selectedMonthLabel}</strong></span>
          <span>•</span>
          <span>Logged Days: <strong className="text-zinc-900">{registerRows.length}</strong></span>
          <span>•</span>
          <span>Total Work: <strong className="text-brand-600 font-mono">{totalHoursWorkedInMonth.toFixed(1)} hrs</strong></span>
        </div>
      </div>

      {/* Attendance Register Table: "Attendance for <selected month and year>" */}
      <div className="card-clean overflow-hidden">
        <div className="p-4 border-b border-zinc-100 bg-zinc-50/70 flex items-center justify-between">
          <h3 className="font-extrabold text-sm text-zinc-900">
            Attendance for {selectedMonthLabel}
          </h3>
          <span className="text-xs font-bold text-zinc-500">
            {registerRows.length} Record(s) Found
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-100 text-zinc-500 font-bold uppercase tracking-wider text-[10px] border-b border-zinc-200">
              <tr>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Day</th>
                <th className="py-3 px-4">Check In</th>
                <th className="py-3 px-4">Check Out</th>
                <th className="py-3 px-4">Work Hours</th>
                <th className="py-3 px-4">Status & Category</th>
                <th className="py-3 px-4">Notes & Activity</th>
                <th className="py-3 px-4 text-right">Task Log</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {registerRows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-zinc-400">
                    No attendance or leave records recorded for {selectedMonthLabel}.
                  </td>
                </tr>
              ) : (
                registerRows.map((row, idx) => {
                  const isLeaveRow = row.isLeave;
                  const isCompOffRow = row.isCompOff;

                  return (
                    <tr
                      key={idx}
                      className={`transition-colors ${
                        isLeaveRow
                          ? 'bg-amber-50/60 hover:bg-amber-100/60'
                          : isCompOffRow
                          ? 'bg-indigo-50/60 hover:bg-indigo-100/60'
                          : row.isLate
                          ? 'bg-amber-50/30 hover:bg-zinc-50'
                          : 'hover:bg-zinc-50'
                      }`}
                    >
                      <td className="py-3 px-4 font-bold text-zinc-900 whitespace-nowrap">
                        {formatDate(row.date)}
                      </td>

                      <td className="py-3 px-4 font-medium text-zinc-500 whitespace-nowrap">
                        {getDayOfWeek(row.date)}
                      </td>

                      <td className="py-3 px-4 font-mono font-semibold text-emerald-700 whitespace-nowrap">
                        {row.checkIn || '--:--'}
                      </td>

                      <td className="py-3 px-4 font-mono font-semibold text-rose-700 whitespace-nowrap">
                        {row.checkOut || '--:--'}
                      </td>

                      <td className="py-3 px-4 font-mono font-bold text-zinc-900 whitespace-nowrap">
                        {row.workHours ? `${row.workHours} hrs` : '--'}
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        {isLeaveRow ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-200 text-amber-900 border border-amber-300">
                            🌴 {row.status}
                          </span>
                        ) : isCompOffRow ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-indigo-200 text-indigo-900 border border-indigo-300">
                            ⭐ {row.status}
                          </span>
                        ) : row.isLate ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-100 text-amber-800 border border-amber-200">
                            ⚠️ Late Arrival
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800">
                            ✅ Present
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-zinc-600 max-w-xs truncate" title={row.notes}>
                        {row.notes || (row.isLate ? 'Late arrival flagged' : 'On-time daily punch')}
                      </td>

                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        {row.record ? (
                          <button
                            onClick={() => setSelectedTaskLogAtt(row.record || null)}
                            className="px-2.5 py-1 bg-brand-50 hover:bg-brand-100 text-brand-700 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                          >
                            View Log
                          </button>
                        ) : (
                          <span className="text-[10px] text-zinc-400 italic">No task log</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* KPI DETAIL MODALS (ON CLICK OF TOP 4 ATTENDANCE CARDS) */}
      {/* ───────────────────────────────────────────────────────────── */}

      {/* 1. Modal: Attendance Breakdown */}
      {activeKpiModal === 'attendance' && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-xl rounded-2xl p-6 shadow-2xl border border-zinc-200 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-black text-zinc-900">Current Month Attendance Details</h3>
                  <p className="text-xs text-zinc-500">{selectedMonthLabel}</p>
                </div>
              </div>
              <button
                onClick={() => setActiveKpiModal(null)}
                className="p-1 text-zinc-400 hover:text-zinc-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                <p className="text-[10px] font-bold text-emerald-800 uppercase">Present Days</p>
                <p className="text-xl font-black text-emerald-700 mt-1">{presentDaysCount}d</p>
              </div>
              <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl">
                <p className="text-[10px] font-bold text-zinc-500 uppercase">Total Days</p>
                <p className="text-xl font-black text-zinc-800 mt-1">{totalDaysInSelectedMonth}d</p>
              </div>
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl">
                <p className="text-[10px] font-bold text-blue-800 uppercase">Total Hours</p>
                <p className="text-xl font-black text-blue-700 mt-1">{totalHoursWorkedInMonth.toFixed(1)}h</p>
              </div>
            </div>

            <p className="text-xs text-zinc-600">
              You have completed <strong>{presentDaysCount}</strong> working sessions in <strong>{selectedMonthLabel}</strong> with a completion rate of {Math.round((presentDaysCount / Math.max(1, workingDaysInMonth)) * 100)}%.
            </p>

            <div className="pt-3 border-t border-zinc-100 flex justify-end">
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

      {/* 2. Modal: Late Arrival Flags */}
      {activeKpiModal === 'late' && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-xl rounded-2xl p-6 shadow-2xl border border-zinc-200 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-amber-600 text-white flex items-center justify-center font-bold">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-black text-zinc-900">Late Arrival Flags ({totalLateFlags})</h3>
                  <p className="text-xs text-zinc-500">Punch-ins recorded after the 09:30 AM threshold</p>
                </div>
              </div>
              <button
                onClick={() => setActiveKpiModal(null)}
                className="p-1 text-zinc-400 hover:text-zinc-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {lateAttendanceRecords.length === 0 ? (
              <div className="py-8 text-center text-zinc-400 text-xs">
                🎉 Congratulations! No late arrival flags recorded for {selectedMonthLabel}.
              </div>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {lateAttendanceRecords.map(r => (
                  <div key={r.id} className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-amber-900">{formatDate(r.date)}</p>
                      <p className="text-[10px] text-amber-700">Punch-in: <strong className="font-mono">{r.checkIn}</strong> (Threshold: 09:30 AM)</p>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-200 text-amber-900">
                      Flagged
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div className="pt-3 border-t border-zinc-100 flex justify-end">
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

      {/* 3. Modal: My Leaves & Comp-off */}
      {activeKpiModal === 'leaves' && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-xl rounded-2xl p-6 shadow-2xl border border-zinc-200 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold">
                  <CalendarDays className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-black text-zinc-900">My Leaves & Comp-Off Details</h3>
                  <p className="text-xs text-zinc-500">Summary for {selectedMonthLabel}</p>
                </div>
              </div>
              <button
                onClick={() => setActiveKpiModal(null)}
                className="p-1 text-zinc-400 hover:text-zinc-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl">
                <p className="text-[10px] font-bold text-purple-900 uppercase">Leaves Taken</p>
                <p className="text-xl font-black text-purple-700 mt-1">{totalLeavesDaysTaken} Days</p>
              </div>
              <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl">
                <p className="text-[10px] font-bold text-indigo-900 uppercase">Comp-off Credits</p>
                <p className="text-xl font-black text-indigo-700 mt-1">{userMonthCompOffs.length} Days</p>
              </div>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto">
              <h4 className="font-bold text-xs text-zinc-900">Applied Leaves ({userMonthLeaves.length})</h4>
              {userMonthLeaves.length === 0 ? (
                <p className="text-xs text-zinc-400 text-center py-2">No leave applications for this month.</p>
              ) : (
                userMonthLeaves.map(l => (
                  <div key={l.id} className="p-2.5 bg-zinc-50 rounded-xl border border-zinc-200 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-zinc-900">{l.leaveType} LEAVE • {l.days} day(s)</p>
                      <p className="text-[10px] text-zinc-500">{formatDate(l.startDate)} to {formatDate(l.endDate)}</p>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      {l.status}
                    </span>
                  </div>
                ))
              )}
            </div>

            <div className="pt-3 border-t border-zinc-100 flex justify-end">
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

      {/* 4. Modal: AVG Working Hours Analysis */}
      {activeKpiModal === 'avg_hours' && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-xl rounded-2xl p-6 shadow-2xl border border-zinc-200 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold">
                  <Briefcase className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-black text-zinc-900">Average Daily Working Hours</h3>
                  <p className="text-xs text-zinc-500">Monthly productivity & time log analysis</p>
                </div>
              </div>
              <button
                onClick={() => setActiveKpiModal(null)}
                className="p-1 text-zinc-400 hover:text-zinc-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl">
                <p className="text-[10px] font-bold text-blue-900 uppercase">Average / Day</p>
                <p className="text-xl font-black text-blue-700 mt-1">{avgWorkingHoursPerDay} hrs</p>
              </div>
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                <p className="text-[10px] font-bold text-emerald-900 uppercase">Daily Target</p>
                <p className="text-xl font-black text-emerald-700 mt-1">8.0 hrs</p>
              </div>
            </div>

            <p className="text-xs text-zinc-600">
              Total hours recorded in {selectedMonthLabel}: <strong>{totalHoursWorkedInMonth.toFixed(1)} hrs</strong> across {userMonthAttendance.length} attendance sessions.
            </p>

            <div className="pt-3 border-t border-zinc-100 flex justify-end">
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

      {/* Task Worklog Modal for attendance task inspection */}
      {selectedTaskLogAtt && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-lg rounded-2xl p-6 shadow-2xl border border-zinc-200 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <div>
                <h3 className="text-base font-black text-zinc-900">Attendance Task Activity</h3>
                <p className="text-xs text-zinc-500">Date: {formatDate(selectedTaskLogAtt.date)}</p>
              </div>
              <button
                onClick={() => setSelectedTaskLogAtt(null)}
                className="p-1 text-zinc-400 hover:text-zinc-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200">
                <p className="text-[10px] font-bold text-zinc-400 uppercase">Punch Timestamps</p>
                <p className="text-xs font-mono font-bold text-zinc-900 mt-0.5">
                  In: <span className="text-emerald-700">{selectedTaskLogAtt.checkIn}</span> • Out: <span className="text-rose-700">{selectedTaskLogAtt.checkOut || 'Active'}</span>
                </p>
                <p className="text-xs font-bold text-brand-600 mt-1">
                  Recorded Work: {selectedTaskLogAtt.workHours} hrs
                </p>
              </div>

              <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200">
                <p className="text-[10px] font-bold text-zinc-400 uppercase">Notes / Activity Summary</p>
                <p className="text-xs text-zinc-700 mt-0.5">{selectedTaskLogAtt.notes || 'Daily work session'}</p>
              </div>
            </div>

            <div className="pt-3 border-t border-zinc-100 flex justify-end">
              <button
                onClick={() => setSelectedTaskLogAtt(null)}
                className="px-4 py-2 bg-zinc-900 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

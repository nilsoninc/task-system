'use client';

import React, { useState, useMemo } from 'react';
import { useSystem } from '@/context/SystemContext';
import { formatCurrency, formatHoursDecimal, formatDate } from '@/lib/utils';
import {
  BarChart3,
  Printer,
  Clock,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Lock,
  UserCheck,
  Search,
  Filter,
  Eye,
  FileText,
  DollarSign,
  TrendingDown,
  TrendingUp,
  AlertCircle,
  HelpCircle,
  X,
  Building,
  Info,
  CalendarCheck2,
  Receipt,
  Percent,
  Check,
  ChevronRight,
  FolderKanban,
  UserCheck2,
  Users,
  Timer,
  Play,
  Square,
  Layers
} from 'lucide-react';
import { Task, TaskWorklog, UserProfile, Project } from '@/lib/types';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const YEARS = ['2024', '2025', '2026', '2027', '2028'];

// Helper to calculate total working days in a month (excluding Sundays)
function getMonthWorkingDays(monthName: string, yearStr: string): number {
  const monthIndex = MONTH_NAMES.indexOf(monthName);
  const year = parseInt(yearStr) || new Date().getFullYear();
  const safeMonth = monthIndex >= 0 ? monthIndex : new Date().getMonth();
  const daysInMonth = new Date(year, safeMonth + 1, 0).getDate();
  
  let workingDays = 0;
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, safeMonth, day);
    const dayOfWeek = date.getDay(); // 0 is Sunday
    if (dayOfWeek !== 0) {
      workingDays++;
    }
  }
  return workingDays || 24;
}

// Parse "HH:MM" format to decimal hours
function parseHoursString(hhmm: string): number {
  if (!hhmm) return 8.0;
  const parts = hhmm.split(':');
  const h = parseFloat(parts[0]) || 0;
  const m = parseFloat(parts[1]) || 0;
  return h + (m / 60);
}

// Format duration seconds to "HH:MM:SS"
function formatDurationFromSeconds(seconds: number): string {
  if (!seconds || seconds <= 0) return '00:00:00';
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

// Format date range string
function formatRange(start?: string, end?: string): string {
  if (!start && !end) return 'N/A';
  if (start && end) return `${formatDate(start)} - ${formatDate(end)}`;
  if (start) return `From ${formatDate(start)}`;
  return `Due ${formatDate(end!)}`;
}

export default function ReportsPage() {
  const {
    currentUser,
    tasks,
    attendance,
    leaveApplications,
    users,
    projects,
    teams,
    projectTypes,
    taskTypes,
    systemSettings
  } = useSystem();

  const currentYear = new Date().getFullYear();
  const currentMonthNum = new Date().getMonth() + 1;
  const currentMonthName = MONTH_NAMES[new Date().getMonth()];
  const currentYearStr = currentYear.toString();

  const defaultFromDate = `${currentYear}-${String(currentMonthNum).padStart(2, '0')}-01`;
  const lastDay = new Date(currentYear, currentMonthNum, 0).getDate();
  const defaultToDate = `${currentYear}-${String(currentMonthNum).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

  // Active Report Tab
  const [activeTab, setActiveTab] = useState<
    'attendance' | 'salary' | 'individual_tasks' | 'projects' | 'tasks' | 'leaves' | 'late'
  >('attendance');

  // Month & Year Filter for Attendance & Salary
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthName);
  const [selectedYear, setSelectedYear] = useState<string>(currentYearStr);
  const [nameSearch, setNameSearch] = useState<string>('');
  const [lateFlagFilter, setLateFlagFilter] = useState<'ALL' | 'YES' | 'NO'>('ALL');

  // Filter States for "Individual Task Report"
  const [taskFilterUserId, setTaskFilterUserId] = useState<string>('ALL');
  const [taskFilterFromDate, setTaskFilterFromDate] = useState<string>(defaultFromDate);
  const [taskFilterToDate, setTaskFilterToDate] = useState<string>(defaultToDate);
  const [taskFilterProjectId, setTaskFilterProjectId] = useState<string>('ALL');
  const [taskFilterTypeId, setTaskFilterTypeId] = useState<string>('ALL');

  // Filter States for "Project Report"
  const [projFilterSearch, setProjFilterSearch] = useState<string>('');
  const [projFilterFromDate, setProjFilterFromDate] = useState<string>(defaultFromDate);
  const [projFilterToDate, setProjFilterToDate] = useState<string>(defaultToDate);
  const [projFilterTypeId, setProjFilterTypeId] = useState<string>('ALL');

  // Modals state
  const [taskLogUser, setTaskLogUser] = useState<UserProfile | null>(null);
  const [salaryModalUser, setSalaryModalUser] = useState<UserProfile | null>(null);
  const [viewWorklogTask, setViewWorklogTask] = useState<Task | null>(null);
  const [viewProjectLogs, setViewProjectLogs] = useState<Project | null>(null);

  if (!currentUser) return null;
  const isSuperAdmin = currentUser.role === 'SUPER_ADMIN';
  const isTeamLead = currentUser.role === 'TEAM_LEADER';

  // Scoped Users list
  const scopedUsers = useMemo(() => {
    return isSuperAdmin
      ? users
      : isTeamLead
      ? users.filter(u => u.teamId === currentUser.teamId || u.id === currentUser.id)
      : users.filter(u => u.id === currentUser.id);
  }, [users, currentUser, isSuperAdmin, isTeamLead]);

  // Working Days & Hours Constants for the selected period
  const totalWorkingDaysInPeriod = useMemo(() => {
    return getMonthWorkingDays(selectedMonth, selectedYear);
  }, [selectedMonth, selectedYear]);

  const minDailyWorkingHoursDecimal = useMemo(() => {
    return parseHoursString(systemSettings.minDailyWorkingHours || '08:00');
  }, [systemSettings.minDailyWorkingHours]);

  const expectedPeriodHours = useMemo(() => {
    return Math.round(totalWorkingDaysInPeriod * minDailyWorkingHoursDecimal * 10) / 10;
  }, [totalWorkingDaysInPeriod, minDailyWorkingHoursDecimal]);

  const lateLimitThreshold = systemSettings.lateArrivalFlagLimit ?? 3;

  // ─────────────────────────────────────────────────────────────────────────────
  // Computed Dataset for Attendance & Salary Reports
  // ─────────────────────────────────────────────────────────────────────────────
  const reportRecords = useMemo(() => {
    const monthIndex = MONTH_NAMES.indexOf(selectedMonth);
    const monthPrefix = `${selectedYear}-${String(monthIndex + 1).padStart(2, '0')}`;

    return scopedUsers.map((u) => {
      // 1. User Attendance in Period
      const userAtt = attendance.filter((a) => {
        if (a.userId !== u.id) return false;
        return a.date ? a.date.startsWith(monthPrefix) : true;
      });

      const daysPresent = userAtt.filter((a) => a.status === 'PRESENT' || a.workHours > 0).length;
      const totalOfficeHrs = userAtt.reduce((sum, a) => sum + (Number(a.workHours) || 0), 0);
      const lateArrivalCount = userAtt.filter((a) => a.isLate).length;

      // 2. User Tasks in Period
      const userTasks = tasks.filter((t) => t.assigneeId === u.id && !t.isSoftDeleted);
      const totalTaskHrs = userTasks.reduce((sum, t) => sum + (Number(t.loggedHours) || 0), 0);

      // 3. User Leaves in Period
      const userLeaves = leaveApplications.filter((l) => {
        if (l.userId !== u.id || l.isSoftDeleted || l.status !== 'APPROVED') return false;
        return (l.startDate && l.startDate.startsWith(monthPrefix)) || (l.appliedOn && l.appliedOn.startsWith(monthPrefix));
      });

      const unpaidLeaveDays = userLeaves
        .filter((l) => l.leaveType === 'UNPAID')
        .reduce((sum, l) => sum + (l.days || 0), 0);

      const paidLeaveDays = userLeaves
        .filter((l) => l.leaveType === 'PAID' || l.leaveType === 'CASUAL' || l.leaveType === 'SICK')
        .reduce((sum, l) => sum + (l.days || 0), 0);

      const compOffDays = userLeaves
        .filter((l) => l.leaveType === 'COMP_OFF')
        .reduce((sum, l) => sum + (l.days || 0), 0);

      const totalLeaveDays = unpaidLeaveDays + paidLeaveDays + compOffDays;

      // 4. Working Hours Deficit & Red Flag Calculation
      const hoursDeficit = Math.max(0, expectedPeriodHours - totalOfficeHrs);
      const hasRedFlag = (expectedPeriodHours - totalOfficeHrs) > 5;

      // 5. Late Arrival Penalty Calculation
      const extraLateDays = Math.max(0, lateArrivalCount - lateLimitThreshold);
      const latePenaltyDays = extraLateDays * 0.5;

      // 6. Salary & Deductions Breakdown
      const baseSalary = (u.salary?.basic || 0) + (u.salary?.hra || 0) + (u.salary?.specialAllowance || 0) || 50000;
      
      const payslipConfig = systemSettings.payslipConfig;
      const earningsConfig = payslipConfig?.earnings;
      const deductionsConfig = payslipConfig?.deductions;

      const basicSalary = earningsConfig?.basicSalary !== false ? (u.salary?.basic || Math.round(baseSalary * 0.50)) : 0;
      const hra = earningsConfig?.hra ? (u.salary?.hra || Math.round(baseSalary * 0.25)) : 0;
      const special = earningsConfig?.specialAllowance ? (u.salary?.specialAllowance || Math.round(baseSalary * 0.15)) : 0;
      const da = earningsConfig?.daAllowance ? Math.round(baseSalary * 0.05) : 0;
      const ta = earningsConfig?.taAllowance ? Math.round(baseSalary * 0.03) : 0;
      const food = earningsConfig?.foodAllowance ? Math.round(baseSalary * 0.02) : 0;

      const grossSalary = basicSalary + hra + special + da + ta + food || baseSalary;
      const perDayRate = totalWorkingDaysInPeriod > 0 ? grossSalary / totalWorkingDaysInPeriod : grossSalary / 30;

      // Deductions
      const unpaidLeaveDeduction = deductionsConfig?.leaveDeduction !== false ? Math.round(perDayRate * unpaidLeaveDays) : 0;
      const latePenaltyDeduction = Math.round(perDayRate * latePenaltyDays);
      const pfDeduction = deductionsConfig?.providentFund ? Math.round((basicSalary || grossSalary) * ((deductionsConfig.pfPercentage || 12) / 100)) : 0;
      const taxDeduction = deductionsConfig?.incomeTax ? Math.round(grossSalary * ((deductionsConfig.taxPercentage || 10) / 100)) : 0;

      // Prof Tax from 3 Slabs
      let profTaxDeduction = 0;
      if (deductionsConfig?.profTax) {
        const slabs = deductionsConfig.profTaxSlabs || [];
        const sortedSlabs = [...slabs].sort((a, b) => (b.minSalary || 0) - (a.minSalary || 0));
        for (const slab of sortedSlabs) {
          if (grossSalary > (slab.minSalary || 0)) {
            profTaxDeduction = Number(slab.taxAmount || 0);
            break;
          }
        }
      }

      const totalDeductions = unpaidLeaveDeduction + latePenaltyDeduction + pfDeduction + taxDeduction + profTaxDeduction;
      const netPayable = Math.max(0, grossSalary - totalDeductions);

      return {
        user: u,
        daysPresent,
        totalOfficeHrs: Math.round(totalOfficeHrs * 10) / 10,
        totalTaskHrs: Math.round(totalTaskHrs * 10) / 10,
        lateArrivalCount,
        unpaidLeaveDays,
        paidLeaveDays,
        compOffDays,
        totalLeaveDays,
        hoursDeficit: Math.round(hoursDeficit * 10) / 10,
        hasRedFlag,
        extraLateDays,
        latePenaltyDays,
        perDayRate: Math.round(perDayRate),
        grossSalary,
        basicSalary,
        hra,
        special,
        da,
        ta,
        food,
        unpaidLeaveDeduction,
        latePenaltyDeduction,
        pfDeduction,
        taxDeduction,
        profTaxDeduction,
        totalDeductions,
        netPayable,
        userTasks,
        userLeaves
      };
    });
  }, [
    scopedUsers,
    attendance,
    tasks,
    leaveApplications,
    selectedMonth,
    selectedYear,
    expectedPeriodHours,
    totalWorkingDaysInPeriod,
    lateLimitThreshold,
    systemSettings.payslipConfig
  ]);

  // Filtered Records for Attendance Report
  const filteredAttendanceRecords = useMemo(() => {
    return reportRecords.filter((rec) => {
      if (nameSearch.trim()) {
        const query = nameSearch.toLowerCase();
        const matchName = rec.user.name.toLowerCase().includes(query);
        const matchRole = (rec.user.title || rec.user.role).toLowerCase().includes(query);
        if (!matchName && !matchRole) return false;
      }
      if (lateFlagFilter === 'YES') {
        if (rec.lateArrivalCount <= 3) return false;
      } else if (lateFlagFilter === 'NO') {
        if (rec.lateArrivalCount > 3) return false;
      }
      return true;
    });
  }, [reportRecords, nameSearch, lateFlagFilter]);

  // Filtered Records for Salary Report
  const filteredSalaryRecords = useMemo(() => {
    return reportRecords.filter((rec) => {
      if (nameSearch.trim()) {
        const query = nameSearch.toLowerCase();
        const matchName = rec.user.name.toLowerCase().includes(query);
        const matchRole = (rec.user.title || rec.user.role).toLowerCase().includes(query);
        if (!matchName && !matchRole) return false;
      }
      return true;
    });
  }, [reportRecords, nameSearch]);

  // ─────────────────────────────────────────────────────────────────────────────
  // Computed Dataset for "Individual Task Report"
  // ─────────────────────────────────────────────────────────────────────────────
  const filteredIndividualTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (t.isSoftDeleted) return false;

      // Filter by Assignee Name / User
      if (taskFilterUserId !== 'ALL' && t.assigneeId !== taskFilterUserId) {
        return false;
      }

      // Filter by Project
      if (taskFilterProjectId !== 'ALL' && t.projectId !== taskFilterProjectId) {
        return false;
      }

      // Filter by Task Type
      if (taskFilterTypeId !== 'ALL' && t.typeId !== taskFilterTypeId) {
        return false;
      }

      // Filter by Date Duration
      const taskDate = t.startDate || t.createdAt?.split('T')[0] || t.dueDate;
      if (taskFilterFromDate && taskDate && taskDate < taskFilterFromDate) {
        return false;
      }
      if (taskFilterToDate && taskDate && taskDate > taskFilterToDate) {
        return false;
      }

      return true;
    });
  }, [tasks, taskFilterUserId, taskFilterProjectId, taskFilterTypeId, taskFilterFromDate, taskFilterToDate]);

  // ─────────────────────────────────────────────────────────────────────────────
  // Computed Dataset for "Project Report"
  // ─────────────────────────────────────────────────────────────────────────────
  const filteredProjectsReport = useMemo(() => {
    return projects.map((p) => {
      // Find all tasks for this project
      const projTasks = tasks.filter((t) => t.projectId === p.id && !t.isSoftDeleted);
      const totalLoggedHrs = projTasks.reduce((sum, t) => sum + (Number(t.loggedHours) || 0), 0);

      // Team count or user count
      let teamCountLabel = '1 Team';
      if (p.assignmentType === 'TEAM') {
        const teamObj = teams.find((tm) => tm.id === p.teamId);
        teamCountLabel = teamObj ? `${teamObj.name} (${teamObj.memberIds?.length || 0} Members)` : '1 Team';
      } else {
        const count = p.assignedUserIds?.length || 1;
        teamCountLabel = `${count} Individual${count > 1 ? 's' : ''}`;
      }

      const pType = projectTypes.find((pt) => pt.id === p.typeId);

      return {
        project: p,
        projectType: pType,
        teamCountLabel,
        totalLoggedHrs: Math.round(totalLoggedHrs * 10) / 10,
        tasksCount: projTasks.length,
        projTasks
      };
    }).filter(({ project, projectType }) => {
      // Search when 2 or more characters typed
      if (projFilterSearch.trim().length >= 2) {
        const q = projFilterSearch.toLowerCase();
        const matchName = project.name.toLowerCase().includes(q);
        const matchType = projectType?.name?.toLowerCase().includes(q);
        if (!matchName && !matchType) return false;
      }

      // Filter by Project Type
      if (projFilterTypeId !== 'ALL' && project.typeId !== projFilterTypeId) {
        return false;
      }

      // Filter by Date Duration
      const pStart = project.startDate || '';
      const pEnd = project.endDate || project.deadline || '';
      if (projFilterFromDate && pStart && pStart < projFilterFromDate && (!pEnd || pEnd < projFilterFromDate)) {
        return false;
      }
      if (projFilterToDate && pStart && pStart > projFilterToDate) {
        return false;
      }

      return true;
    });
  }, [projects, tasks, teams, projectTypes, projFilterSearch, projFilterTypeId, projFilterFromDate, projFilterToDate]);

  // Target User for Active Modal
  const selectedUserTaskRecord = useMemo(() => {
    if (!taskLogUser) return null;
    return reportRecords.find((r) => r.user.id === taskLogUser.id);
  }, [taskLogUser, reportRecords]);

  const selectedUserSalaryRecord = useMemo(() => {
    if (!salaryModalUser) return null;
    return reportRecords.find((r) => r.user.id === salaryModalUser.id);
  }, [salaryModalUser, reportRecords]);

  // Selected Task Worklogs for "View Log" in Individual Task Report
  const activeTaskWorklogs = useMemo(() => {
    if (!viewWorklogTask) return [];
    if (viewWorklogTask.worklogs && viewWorklogTask.worklogs.length > 0) {
      return viewWorklogTask.worklogs;
    }
    // Generate graceful fallback session if task has loggedHours
    if (viewWorklogTask.loggedHours > 0) {
      const assignee = users.find((u) => u.id === viewWorklogTask.assigneeId);
      const start = viewWorklogTask.startDate ? `${viewWorklogTask.startDate} 09:30 AM` : `${viewWorklogTask.createdAt?.split('T')[0] || '2026-08-01'} 09:30 AM`;
      const end = viewWorklogTask.startDate ? `${viewWorklogTask.startDate} 05:30 PM` : `${viewWorklogTask.createdAt?.split('T')[0] || '2026-08-01'} 05:30 PM`;
      return [
        {
          id: `synth-${viewWorklogTask.id}`,
          userId: viewWorklogTask.assigneeId,
          userName: assignee?.name || 'Assignee',
          startTime: start,
          endTime: end,
          durationSeconds: Math.round(viewWorklogTask.loggedHours * 3600),
          notes: viewWorklogTask.description || 'Sprint task milestone implementation & execution'
        }
      ];
    }
    return [];
  }, [viewWorklogTask, users]);

  const totalActiveTaskWorklogSeconds = useMemo(() => {
    return activeTaskWorklogs.reduce((acc, wl) => acc + (Number(wl.durationSeconds) || 0), 0);
  }, [activeTaskWorklogs]);

  // Selected Project Tasks for "View Log" in Project Report
  const activeProjectTaskEntries = useMemo(() => {
    if (!viewProjectLogs) return [];
    return tasks.filter((t) => t.projectId === viewProjectLogs.id && !t.isSoftDeleted);
  }, [viewProjectLogs, tasks]);

  const totalActiveProjectTaskHours = useMemo(() => {
    return activeProjectTaskEntries.reduce((acc, t) => acc + (Number(t.loggedHours) || 0), 0);
  }, [activeProjectTaskEntries]);

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-zinc-900 tracking-tight flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-brand-500" /> Reports & Analytics
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            {isSuperAdmin
              ? 'Super Master Admin enterprise analytical suite with attendance audits, automated salary calculations, individual task evaluations, and project reports.'
              : `Scoped analytics & productivity reports for ${currentUser.name} (${currentUser.role.replace('_', ' ')}).`}
          </p>
        </div>

        <button
          onClick={() => window.print()}
          className="px-4 py-2 bg-obsidian-950 hover:bg-black text-white rounded-xl text-xs font-bold border border-obsidian-800 cursor-pointer flex items-center space-x-1.5 shadow-sm"
        >
          <Printer className="w-4 h-4 text-brand-400" />
          <span>Export / Print Report</span>
        </button>
      </div>

      {/* Primary Report Selector Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2.5">
        {/* Tab 1: Attendance Report */}
        <button
          onClick={() => setActiveTab('attendance')}
          className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
            activeTab === 'attendance'
              ? 'bg-brand-500 text-white border-brand-500 shadow-glow-orange font-bold'
              : 'bg-white text-zinc-800 border-zinc-200 hover:border-brand-300'
          }`}
        >
          <CalendarCheck2 className="w-4 h-4 mb-1" />
          <h4 className="text-[11px] font-extrabold truncate">Attendance</h4>
          <p className={`text-[9px] mt-0.5 truncate ${activeTab === 'attendance' ? 'text-white/80' : 'text-zinc-400'}`}>
            Office & task hrs
          </p>
        </button>

        {/* Tab 2: Salary Report */}
        <button
          onClick={() => setActiveTab('salary')}
          className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
            activeTab === 'salary'
              ? 'bg-brand-500 text-white border-brand-500 shadow-glow-orange font-bold'
              : 'bg-white text-zinc-800 border-zinc-200 hover:border-brand-300'
          }`}
        >
          <Receipt className="w-4 h-4 mb-1" />
          <h4 className="text-[11px] font-extrabold truncate">Salary Report</h4>
          <p className={`text-[9px] mt-0.5 truncate ${activeTab === 'salary' ? 'text-white/80' : 'text-zinc-400'}`}>
            Leaves & penalties
          </p>
        </button>

        {/* Tab 3: Individual Task Report (NEW) */}
        <button
          onClick={() => setActiveTab('individual_tasks')}
          className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
            activeTab === 'individual_tasks'
              ? 'bg-brand-500 text-white border-brand-500 shadow-glow-orange font-bold'
              : 'bg-white text-zinc-800 border-zinc-200 hover:border-brand-300'
          }`}
        >
          <UserCheck2 className="w-4 h-4 mb-1" />
          <h4 className="text-[11px] font-extrabold truncate">Individual Task</h4>
          <p className={`text-[9px] mt-0.5 truncate ${activeTab === 'individual_tasks' ? 'text-white/80' : 'text-zinc-400'}`}>
            Member evaluation
          </p>
        </button>

        {/* Tab 4: Project Report (NEW) */}
        <button
          onClick={() => setActiveTab('projects')}
          className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
            activeTab === 'projects'
              ? 'bg-brand-500 text-white border-brand-500 shadow-glow-orange font-bold'
              : 'bg-white text-zinc-800 border-zinc-200 hover:border-brand-300'
          }`}
        >
          <FolderKanban className="w-4 h-4 mb-1" />
          <h4 className="text-[11px] font-extrabold truncate">Project Report</h4>
          <p className={`text-[9px] mt-0.5 truncate ${activeTab === 'projects' ? 'text-white/80' : 'text-zinc-400'}`}>
            Project evaluation
          </p>
        </button>

        {/* Tab 5: Task Hours */}
        <button
          onClick={() => setActiveTab('tasks')}
          className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
            activeTab === 'tasks'
              ? 'bg-brand-500 text-white border-brand-500 shadow-glow-orange font-bold'
              : 'bg-white text-zinc-800 border-zinc-200 hover:border-brand-300'
          }`}
        >
          <Clock className="w-4 h-4 mb-1" />
          <h4 className="text-[11px] font-extrabold truncate">Task Hours</h4>
          <p className={`text-[9px] mt-0.5 truncate ${activeTab === 'tasks' ? 'text-white/80' : 'text-zinc-400'}`}>
            Hours variance
          </p>
        </button>

        {/* Tab 6: Leave Utilization */}
        <button
          onClick={() => setActiveTab('leaves')}
          className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
            activeTab === 'leaves'
              ? 'bg-brand-500 text-white border-brand-500 shadow-glow-orange font-bold'
              : 'bg-white text-zinc-800 border-zinc-200 hover:border-brand-300'
          }`}
        >
          <Calendar className="w-4 h-4 mb-1" />
          <h4 className="text-[11px] font-extrabold truncate">Leaves</h4>
          <p className={`text-[9px] mt-0.5 truncate ${activeTab === 'leaves' ? 'text-white/80' : 'text-zinc-400'}`}>
            Utilization audit
          </p>
        </button>

        {/* Tab 7: Late Arrival Audit */}
        <button
          onClick={() => setActiveTab('late')}
          className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
            activeTab === 'late'
              ? 'bg-brand-500 text-white border-brand-500 shadow-glow-orange font-bold'
              : 'bg-white text-zinc-800 border-zinc-200 hover:border-brand-300'
          }`}
        >
          <AlertTriangle className="w-4 h-4 mb-1" />
          <h4 className="text-[11px] font-extrabold truncate">Late Audit</h4>
          <p className={`text-[9px] mt-0.5 truncate ${activeTab === 'late' ? 'text-white/80' : 'text-zinc-400'}`}>
            Flagged checkins
          </p>
        </button>
      </div>

      {/* ─────────────────────────────────────────────────────────────────────────────
          TAB 1: ATTENDANCE REPORT
      ───────────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'attendance' && (
        <div className="space-y-4">
          {/* Top Duration Summary Banner */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white p-4 rounded-2xl border border-zinc-200 shadow-sm">
            <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-100">
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Total Working Days</p>
              <p className="text-xl font-extrabold text-zinc-900 mt-1">{totalWorkingDaysInPeriod} Days</p>
              <p className="text-[10px] text-zinc-500 mt-0.5">For {selectedMonth} {selectedYear}</p>
            </div>

            <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-100">
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Expected Working Hrs</p>
              <p className="text-xl font-extrabold text-brand-600 font-mono mt-1">{expectedPeriodHours} hrs</p>
              <p className="text-[10px] text-zinc-500 mt-0.5">{systemSettings.minDailyWorkingHours || '08:00'} hrs/day min requirement</p>
            </div>

            <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-100">
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Staff in Scope</p>
              <p className="text-xl font-extrabold text-zinc-900 mt-1">{scopedUsers.length} Employees</p>
              <p className="text-[10px] text-zinc-500 mt-0.5">{isSuperAdmin ? 'Enterprise Organization' : 'Department Scope'}</p>
            </div>

            <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-100">
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Late Arrival Threshold</p>
              <p className="text-xl font-extrabold text-amber-700 mt-1">{lateLimitThreshold} Times Allowed</p>
              <p className="text-[10px] text-zinc-500 mt-0.5">Configured in Web Admin Master</p>
            </div>
          </div>

          {/* Table Filters Bar */}
          <div className="card-clean p-4">
            <div className="flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
              
              {/* Name Search on type */}
              <div className="relative w-full md:w-72">
                <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search by employee name or role..."
                  value={nameSearch}
                  onChange={(e) => setNameSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-zinc-200 rounded-xl bg-zinc-50 focus:bg-white focus:border-brand-500 font-medium"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
                {/* Month & Year Selectors */}
                <div className="flex items-center space-x-1">
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="px-3 py-2 border border-zinc-200 rounded-xl font-bold bg-zinc-50 focus:border-brand-500"
                  >
                    {MONTH_NAMES.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>

                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                    className="px-3 py-2 border border-zinc-200 rounded-xl font-bold bg-zinc-50 focus:border-brand-500"
                  >
                    {YEARS.map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>

                {/* Late Flags Filter Dropdown */}
                <div className="flex items-center space-x-1">
                  <span className="font-bold text-zinc-500 text-[11px]">Late Flags:</span>
                  <select
                    value={lateFlagFilter}
                    onChange={(e) => setLateFlagFilter(e.target.value as any)}
                    className="px-3 py-2 border border-zinc-200 rounded-xl font-bold bg-zinc-50 focus:border-brand-500"
                  >
                    <option value="ALL">All Staff</option>
                    <option value="YES">Yes (&gt; 3 times flagged)</option>
                    <option value="NO">No (&le; 3 times flagged)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Attendance Table */}
          <div className="card-clean overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-100 border-b border-zinc-200 text-zinc-600 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="p-3.5">Name</th>
                  <th className="p-3.5 text-center">Total Days Present</th>
                  <th className="p-3.5 text-center">Total Office Hrs</th>
                  <th className="p-3.5 text-center">Total Task Hrs</th>
                  <th className="p-3.5 text-center">Leaves (Count)</th>
                  <th className="p-3.5 text-center">Late Arrival (Count)</th>
                  <th className="p-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {filteredAttendanceRecords.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-zinc-400 font-medium">
                      No attendance records found matching the selected filters.
                    </td>
                  </tr>
                ) : (
                  filteredAttendanceRecords.map((rec) => (
                    <tr key={rec.user.id} className="hover:bg-zinc-50/80 transition-colors">
                      {/* Name with Role directly underneath */}
                      <td className="p-3.5">
                        <div className="flex items-center space-x-2.5">
                          <img
                            src={rec.user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                            alt={rec.user.name}
                            className="w-8 h-8 rounded-full object-cover border border-zinc-200 flex-shrink-0"
                          />
                          <div>
                            <p className="font-extrabold text-zinc-900">{rec.user.name}</p>
                            <p className="text-[10px] text-zinc-500 font-bold">
                              {rec.user.title || rec.user.role.replace('_', ' ')}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Total Days Present */}
                      <td className="p-3.5 text-center">
                        <span className="font-mono font-bold text-zinc-900">
                          {rec.daysPresent} <span className="text-zinc-400 font-normal">/ {totalWorkingDaysInPeriod}d</span>
                        </span>
                      </td>

                      {/* Total Office Hrs */}
                      <td className="p-3.5 text-center">
                        <span className="font-mono font-extrabold text-brand-600">
                          {rec.totalOfficeHrs}h
                        </span>
                      </td>

                      {/* Total Task Hrs */}
                      <td className="p-3.5 text-center">
                        <span className="font-mono font-extrabold text-emerald-600">
                          {rec.totalTaskHrs}h
                        </span>
                      </td>

                      {/* Leaves (Count) */}
                      <td className="p-3.5 text-center">
                        <span className={`font-mono font-bold px-2 py-0.5 rounded-md ${
                          rec.totalLeaveDays > 0 ? 'bg-amber-50 text-amber-800 border border-amber-200' : 'text-zinc-600'
                        }`}>
                          {rec.totalLeaveDays} Days
                        </span>
                      </td>

                      {/* Late Arrival (Count) */}
                      <td className="p-3.5 text-center">
                        <span className={`font-mono font-bold px-2.5 py-1 rounded-lg ${
                          rec.lateArrivalCount > 3
                            ? 'bg-rose-100 text-rose-800 border border-rose-200 font-extrabold'
                            : rec.lateArrivalCount > 0
                            ? 'bg-amber-50 text-amber-800 border border-amber-200'
                            : 'text-zinc-500'
                        }`}>
                          {rec.lateArrivalCount} Flags
                        </span>
                      </td>

                      {/* Action */}
                      <td className="p-3.5 text-right">
                        <button
                          onClick={() => setTaskLogUser(rec.user)}
                          className="px-3 py-1.5 bg-zinc-100 hover:bg-brand-50 hover:text-brand-600 text-zinc-700 rounded-lg text-xs font-bold transition-all cursor-pointer inline-flex items-center space-x-1 border border-zinc-200"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View All Task Logs</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────────────
          TAB 2: SALARY REPORT
      ───────────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'salary' && (
        <div className="space-y-4">
          {/* Top Info Banner for Salary Calculation Engine */}
          <div className="bg-zinc-50 p-4 rounded-2xl border border-zinc-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs">
            <div className="flex items-start space-x-3">
              <div className="w-9 h-9 rounded-xl bg-brand-100 text-brand-700 flex items-center justify-center font-bold flex-shrink-0">
                <Receipt className="w-5 h-5" />
              </div>
              <div>
                <p className="font-extrabold text-zinc-900 text-sm">Automated Salary Audit Engine</p>
                <p className="text-zinc-600 mt-0.5">
                  Calculates gross &amp; net payable salaries, unexcused unpaid leave deductions, late arrival half-day penalties (&gt; {lateLimitThreshold} times), and flags work hour deficits (&gt; 5 hrs).
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2 text-[11px] font-bold bg-white px-3 py-1.5 rounded-xl border border-zinc-200 text-zinc-700 flex-shrink-0">
              <span>Duration:</span>
              <span className="text-brand-600">{selectedMonth} {selectedYear}</span>
              <span>•</span>
              <span>Expected:</span>
              <span className="font-mono">{expectedPeriodHours}h</span>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="card-clean p-4">
            <div className="flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
              {/* Name Search */}
              <div className="relative w-full md:w-80">
                <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search employee name or role..."
                  value={nameSearch}
                  onChange={(e) => setNameSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-zinc-200 rounded-xl bg-zinc-50 focus:bg-white focus:border-brand-500 font-medium"
                />
              </div>

              {/* Month & Year Selectors */}
              <div className="flex items-center space-x-2 w-full md:w-auto justify-end">
                <span className="font-bold text-zinc-500 text-[11px]">Pay Period:</span>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="px-3 py-2 border border-zinc-200 rounded-xl font-bold bg-zinc-50 focus:border-brand-500"
                >
                  {MONTH_NAMES.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>

                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="px-3 py-2 border border-zinc-200 rounded-xl font-bold bg-zinc-50 focus:border-brand-500"
                >
                  {YEARS.map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Salary Report Table */}
          <div className="card-clean overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-100 border-b border-zinc-200 text-zinc-600 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="p-3.5">Name</th>
                  <th className="p-3.5 text-center">Present Days</th>
                  <th className="p-3.5 text-center">Leaves (Count)</th>
                  <th className="p-3.5 text-center">Office Hrs</th>
                  <th className="p-3.5 text-center">Task Hrs</th>
                  <th className="p-3.5 text-center">Late Arrival</th>
                  <th className="p-3.5 text-right">Salary (Gross)</th>
                  <th className="p-3.5 text-right">Deductions</th>
                  <th className="p-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {filteredSalaryRecords.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-zinc-400 font-medium">
                      No records found for this period.
                    </td>
                  </tr>
                ) : (
                  filteredSalaryRecords.map((rec) => (
                    <tr key={rec.user.id} className="hover:bg-zinc-50/80 transition-colors">
                      {/* Name with Role directly underneath & Red Flag Badge if deficit > 5 hrs */}
                      <td className="p-3.5">
                        <div className="flex items-center space-x-2.5">
                          <img
                            src={rec.user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                            alt={rec.user.name}
                            className="w-8 h-8 rounded-full object-cover border border-zinc-200 flex-shrink-0"
                          />
                          <div>
                            <div className="flex items-center space-x-1.5">
                              <p className="font-extrabold text-zinc-900">{rec.user.name}</p>
                              {rec.hasRedFlag && (
                                <span
                                  title={`Hours Deficit: User logged ${rec.totalOfficeHrs}h vs ${expectedPeriodHours}h expected (Deficit: -${rec.hoursDeficit}h > 5h threshold)`}
                                  className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-rose-600 text-white flex items-center space-x-0.5 shadow-sm animate-pulse cursor-help"
                                >
                                  <span>🚩 Deficit &gt;5h</span>
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-zinc-500 font-bold">
                              {rec.user.title || rec.user.role.replace('_', ' ')}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Present Days */}
                      <td className="p-3.5 text-center font-mono font-bold text-zinc-900">
                        {rec.daysPresent} <span className="text-zinc-400 font-normal">/ {totalWorkingDaysInPeriod}d</span>
                      </td>

                      {/* Leaves (Count) */}
                      <td className="p-3.5 text-center">
                        <div className="text-[11px] font-mono font-bold text-zinc-800">
                          {rec.totalLeaveDays} Days
                        </div>
                        {rec.unpaidLeaveDays > 0 && (
                          <span className="text-[10px] text-rose-600 font-bold block">
                            ({rec.unpaidLeaveDays}d Unpaid)
                          </span>
                        )}
                      </td>

                      {/* Office Hrs */}
                      <td className="p-3.5 text-center font-mono font-extrabold">
                        <span className={rec.hasRedFlag ? 'text-rose-600' : 'text-zinc-800'}>
                          {rec.totalOfficeHrs}h
                        </span>
                      </td>

                      {/* Task Hrs */}
                      <td className="p-3.5 text-center font-mono font-extrabold text-emerald-600">
                        {rec.totalTaskHrs}h
                      </td>

                      {/* Late Arrival */}
                      <td className="p-3.5 text-center">
                        <span className={`font-mono font-bold px-2 py-0.5 rounded-md ${
                          rec.lateArrivalCount > lateLimitThreshold
                            ? 'bg-rose-100 text-rose-800 border border-rose-200'
                            : 'text-zinc-600'
                        }`}>
                          {rec.lateArrivalCount} Flags
                        </span>
                        {rec.extraLateDays > 0 && (
                          <span className="text-[10px] text-rose-600 font-bold block mt-0.5">
                            (-{rec.latePenaltyDays}d penalty)
                          </span>
                        )}
                      </td>

                      {/* Salary (Gross) */}
                      <td className="p-3.5 text-right font-mono font-extrabold text-zinc-900">
                        {formatCurrency(rec.grossSalary, systemSettings)}
                      </td>

                      {/* Deductions */}
                      <td className="p-3.5 text-right font-mono font-bold text-rose-600">
                        -{formatCurrency(rec.totalDeductions, systemSettings)}
                      </td>

                      {/* Action */}
                      <td className="p-3.5 text-right">
                        <button
                          onClick={() => setSalaryModalUser(rec.user)}
                          className="px-3 py-1.5 bg-brand-50 hover:bg-brand-500 hover:text-white text-brand-700 rounded-lg text-xs font-bold transition-all cursor-pointer inline-flex items-center space-x-1 border border-brand-200 shadow-sm"
                        >
                          <Receipt className="w-3.5 h-3.5" />
                          <span>View Calculation</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────────────
          TAB 3: INDIVIDUAL TASK REPORT (NEW)
      ───────────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'individual_tasks' && (
        <div className="space-y-4">
          {/* Header Notice */}
          <div className="bg-brand-50/70 border border-brand-200 p-4 rounded-2xl text-xs text-brand-900 flex items-start space-x-3">
            <UserCheck2 className="w-5 h-5 text-brand-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Team Member Task Performance Evaluation</p>
              <p className="text-zinc-600 mt-0.5">
                Evaluates task execution for selected team members across projects or specific task types, with live timer session auditing and cumulative duration sums.
              </p>
            </div>
          </div>

          {/* Top Filters Bar */}
          <div className="card-clean p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              {/* Member Name */}
              <div>
                <label className="font-bold text-zinc-700 block mb-1">Team Member</label>
                <select
                  value={taskFilterUserId}
                  onChange={(e) => setTaskFilterUserId(e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-xl font-bold bg-zinc-50 focus:border-brand-500"
                >
                  <option value="ALL">All Team Members ({scopedUsers.length})</option>
                  {scopedUsers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} — {u.title || u.role.replace('_', ' ')}
                    </option>
                  ))}
                </select>
              </div>

              {/* Duration From - To */}
              <div>
                <label className="font-bold text-zinc-700 block mb-1">Duration (From — To)</label>
                <div className="grid grid-cols-2 gap-1.5">
                  <input
                    type="date"
                    value={taskFilterFromDate}
                    onChange={(e) => setTaskFilterFromDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-zinc-200 rounded-xl bg-zinc-50 font-medium text-[11px]"
                  />
                  <input
                    type="date"
                    value={taskFilterToDate}
                    onChange={(e) => setTaskFilterToDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-zinc-200 rounded-xl bg-zinc-50 font-medium text-[11px]"
                  />
                </div>
              </div>

              {/* Project */}
              <div>
                <label className="font-bold text-zinc-700 block mb-1">Project</label>
                <select
                  value={taskFilterProjectId}
                  onChange={(e) => setTaskFilterProjectId(e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-xl font-bold bg-zinc-50 focus:border-brand-500"
                >
                  <option value="ALL">All Projects ({projects.length})</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              {/* Task Type */}
              <div>
                <label className="font-bold text-zinc-700 block mb-1">Task Type</label>
                <select
                  value={taskFilterTypeId}
                  onChange={(e) => setTaskFilterTypeId(e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-xl font-bold bg-zinc-50 focus:border-brand-500"
                >
                  <option value="ALL">All Task Types ({taskTypes.length})</option>
                  {taskTypes.map((tt) => (
                    <option key={tt.id} value={tt.id}>{tt.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Tasks Table */}
          <div className="card-clean overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-100 border-b border-zinc-200 text-zinc-600 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="p-3.5">Task Title</th>
                  <th className="p-3.5">Project Name</th>
                  <th className="p-3.5 text-center">Priority</th>
                  <th className="p-3.5">Start &amp; End Date</th>
                  <th className="p-3.5">Last Access Date</th>
                  <th className="p-3.5 text-center">Estimated HRs</th>
                  <th className="p-3.5 text-center">Task HRs</th>
                  <th className="p-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {filteredIndividualTasks.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-zinc-400 font-medium">
                      No tasks found for the selected member and duration filters.
                    </td>
                  </tr>
                ) : (
                  filteredIndividualTasks.map((t) => {
                    const proj = projects.find((p) => p.id === t.projectId);
                    const tType = taskTypes.find((tt) => tt.id === t.typeId);
                    const assignee = users.find((u) => u.id === t.assigneeId);
                    const lastAccess = t.worklogs && t.worklogs.length > 0 
                      ? t.worklogs[0].startTime?.split(' ')[0] 
                      : (t.createdAt?.split('T')[0] || '2026-08-01');

                    return (
                      <tr key={t.id} className="hover:bg-zinc-50/80 transition-colors">
                        {/* Task Title with Task Type directly below */}
                        <td className="p-3.5">
                          <div>
                            <p className="font-extrabold text-zinc-900 text-xs">{t.title}</p>
                            <div className="flex items-center space-x-1.5 mt-0.5">
                              <span
                                className="px-2 py-0.5 rounded text-[9px] font-bold"
                                style={{
                                  backgroundColor: `${tType?.color || '#3b82f6'}20`,
                                  color: tType?.color || '#1d4ed8'
                                }}
                              >
                                {tType?.name || 'General Task'}
                              </span>
                              {assignee && (
                                <span className="text-[10px] text-zinc-400 font-medium">
                                  • {assignee.name}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Project Name */}
                        <td className="p-3.5 font-bold text-zinc-700">
                          {proj?.name || 'General Project'}
                        </td>

                        {/* Priority */}
                        <td className="p-3.5 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                            t.priority === 'URGENT' ? 'bg-rose-100 text-rose-800' :
                            t.priority === 'HIGH' ? 'bg-amber-100 text-amber-800' :
                            t.priority === 'MEDIUM' ? 'bg-blue-100 text-blue-800' : 'bg-zinc-100 text-zinc-700'
                          }`}>
                            {t.priority}
                          </span>
                        </td>

                        {/* Start & End Date */}
                        <td className="p-3.5 text-zinc-600 font-mono text-[11px]">
                          {formatRange(t.startDate, t.dueDate)}
                        </td>

                        {/* Last Access Date */}
                        <td className="p-3.5 text-zinc-600 font-mono text-[11px]">
                          {formatDate(lastAccess)}
                        </td>

                        {/* Estimated HRs */}
                        <td className="p-3.5 text-center font-mono font-bold text-zinc-700">
                          {t.estimatedHours}h
                        </td>

                        {/* Task HRs */}
                        <td className="p-3.5 text-center font-mono font-extrabold text-brand-600">
                          {formatHoursDecimal(t.loggedHours)}
                        </td>

                        {/* Action -> View Log */}
                        <td className="p-3.5 text-right">
                          <button
                            onClick={() => setViewWorklogTask(t)}
                            className="px-3 py-1.5 bg-brand-50 hover:bg-brand-500 hover:text-white text-brand-700 rounded-lg text-xs font-bold transition-all cursor-pointer inline-flex items-center space-x-1 border border-brand-200 shadow-sm"
                          >
                            <Timer className="w-3.5 h-3.5" />
                            <span>View Log</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────────────
          TAB 4: PROJECT REPORT (NEW)
      ───────────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'projects' && (
        <div className="space-y-4">
          {/* Header Notice */}
          <div className="bg-emerald-50/70 border border-emerald-200 p-4 rounded-2xl text-xs text-emerald-900 flex items-start space-x-3">
            <FolderKanban className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Project Progress &amp; Task Effort Evaluation</p>
              <p className="text-zinc-600 mt-0.5">
                Audits project estimated budgets against cumulative task execution time, team assignments, and milestone completion statuses.
              </p>
            </div>
          </div>

          {/* Top Filters Bar */}
          <div className="card-clean p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
              {/* Project Name Search (when typing >= 2 characters) */}
              <div className="relative">
                <label className="font-bold text-zinc-700 block mb-1">Project Name (Search &ge;2 chars)</label>
                <div className="relative">
                  <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Type project name..."
                    value={projFilterSearch}
                    onChange={(e) => setProjFilterSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-zinc-200 rounded-xl bg-zinc-50 focus:bg-white focus:border-brand-500 font-medium"
                  />
                </div>
              </div>

              {/* Duration From - To */}
              <div>
                <label className="font-bold text-zinc-700 block mb-1">Duration (From — To)</label>
                <div className="grid grid-cols-2 gap-1.5">
                  <input
                    type="date"
                    value={projFilterFromDate}
                    onChange={(e) => setProjFilterFromDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-zinc-200 rounded-xl bg-zinc-50 font-medium text-[11px]"
                  />
                  <input
                    type="date"
                    value={projFilterToDate}
                    onChange={(e) => setProjFilterToDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-zinc-200 rounded-xl bg-zinc-50 font-medium text-[11px]"
                  />
                </div>
              </div>

              {/* Project Type */}
              <div>
                <label className="font-bold text-zinc-700 block mb-1">Project Type</label>
                <select
                  value={projFilterTypeId}
                  onChange={(e) => setProjFilterTypeId(e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-xl font-bold bg-zinc-50 focus:border-brand-500"
                >
                  <option value="ALL">All Project Types ({projectTypes.length})</option>
                  {projectTypes.map((pt) => (
                    <option key={pt.id} value={pt.id}>{pt.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Project Report Table */}
          <div className="card-clean overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-100 border-b border-zinc-200 text-zinc-600 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="p-3.5">Project Name</th>
                  <th className="p-3.5">Team</th>
                  <th className="p-3.5">Start &amp; End Date</th>
                  <th className="p-3.5 text-center">Estimated HRs</th>
                  <th className="p-3.5 text-center">Total Task HRs</th>
                  <th className="p-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {filteredProjectsReport.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-zinc-400 font-medium">
                      No projects found matching the selected search criteria.
                    </td>
                  </tr>
                ) : (
                  filteredProjectsReport.map(({ project, projectType, teamCountLabel, totalLoggedHrs, tasksCount }) => (
                    <tr key={project.id} className="hover:bg-zinc-50/80 transition-colors">
                      {/* Project Name with Project Type directly below */}
                      <td className="p-3.5">
                        <div>
                          <p className="font-extrabold text-zinc-900 text-sm">{project.name}</p>
                          <div className="flex items-center space-x-1.5 mt-0.5">
                            <span
                              className="px-2 py-0.5 rounded text-[9px] font-bold"
                              style={{
                                backgroundColor: `${projectType?.color || '#10b981'}20`,
                                color: projectType?.color || '#047857'
                              }}
                            >
                              {projectType?.name || 'Standard Project'}
                            </span>
                            <span className="text-[10px] text-zinc-400 font-medium">
                              • {tasksCount} Tasks
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Team */}
                      <td className="p-3.5">
                        <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-zinc-100 text-zinc-800 border border-zinc-200 inline-flex items-center space-x-1">
                          <Users className="w-3.5 h-3.5 text-brand-500" />
                          <span>{teamCountLabel}</span>
                        </span>
                      </td>

                      {/* Start & End Date */}
                      <td className="p-3.5 text-zinc-600 font-mono text-[11px]">
                        {formatRange(project.startDate, project.endDate || project.deadline)}
                      </td>

                      {/* Estimated HRs */}
                      <td className="p-3.5 text-center font-mono font-bold text-zinc-700">
                        {project.estimatedHours || 0}h
                      </td>

                      {/* Total Task HRs */}
                      <td className="p-3.5 text-center font-mono font-extrabold text-brand-600">
                        {totalLoggedHrs}h
                      </td>

                      {/* Action -> View Log */}
                      <td className="p-3.5 text-right">
                        <button
                          onClick={() => setViewProjectLogs(project)}
                          className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-600 hover:text-white text-emerald-800 rounded-lg text-xs font-bold transition-all cursor-pointer inline-flex items-center space-x-1 border border-emerald-200 shadow-sm"
                        >
                          <Layers className="w-3.5 h-3.5" />
                          <span>View Log</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────────────
          TAB 5: TASK HOURS REPORT (Preserved & Enhanced)
      ───────────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'tasks' && (
        <div className="space-y-4">
          <div className="card-clean p-5 space-y-4">
            <div className="border-b border-zinc-100 pb-3 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-sm text-zinc-900">Task Logged Hours Variance Report</h3>
                <p className="text-xs text-zinc-500">Showing {tasks.length} task entries in scope</p>
              </div>
              <span className="text-[10px] font-bold bg-zinc-100 px-2.5 py-1 rounded text-zinc-700">
                {isSuperAdmin ? 'Enterprise Scope' : 'Scoped View'}
              </span>
            </div>

            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-100 border-b border-zinc-200 text-zinc-500 font-bold uppercase tracking-wider">
                <tr>
                  <th className="p-3">Task Title</th>
                  <th className="p-3">Project</th>
                  <th className="p-3">Assignee</th>
                  <th className="p-3 text-center">Estimated</th>
                  <th className="p-3 text-center">Logged Hours</th>
                  <th className="p-3 text-right">Variance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {tasks.map((t) => {
                  const proj = projects.find((p) => p.id === t.projectId);
                  const assignee = users.find((u) => u.id === t.assigneeId);
                  const diff = (t.loggedHours || 0) - (t.estimatedHours || 0);

                  return (
                    <tr key={t.id} className="hover:bg-zinc-50/80">
                      <td className="p-3 font-bold text-zinc-900">{t.title}</td>
                      <td className="p-3 font-semibold text-zinc-700">{proj?.name || 'General Project'}</td>
                      <td className="p-3">
                        <p className="font-bold text-zinc-900">{assignee?.name || 'Unassigned'}</p>
                        {assignee && (
                          <p className="text-[10px] text-zinc-500 font-semibold">{assignee.title || assignee.role.replace('_', ' ')}</p>
                        )}
                      </td>
                      <td className="p-3 text-center font-mono">{t.estimatedHours}h</td>
                      <td className="p-3 text-center font-mono font-bold text-brand-600">{formatHoursDecimal(t.loggedHours)}</td>
                      <td className="p-3 text-right font-mono font-bold">
                        <span className={diff > 0 ? 'text-rose-600' : 'text-emerald-600'}>
                          {diff > 0 ? `+${diff.toFixed(1)}h Over` : `${diff.toFixed(1)}h Under`}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────────────
          TAB 6: LEAVE UTILIZATION (Preserved & Enhanced)
      ───────────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'leaves' && (
        <div className="space-y-4">
          <div className="card-clean p-5 space-y-4">
            <div className="border-b border-zinc-100 pb-3 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-sm text-zinc-900">Leave Utilization Audit Report</h3>
                <p className="text-xs text-zinc-500">Active and processed leave requests</p>
              </div>
              <span className="text-[10px] font-bold bg-zinc-100 px-2.5 py-1 rounded text-zinc-700">
                {isSuperAdmin ? 'Enterprise Scope' : 'Scoped View'}
              </span>
            </div>

            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-100 border-b border-zinc-200 text-zinc-500 font-bold uppercase tracking-wider">
                <tr>
                  <th className="p-3">Employee</th>
                  <th className="p-3">Leave Type</th>
                  <th className="p-3 text-center">Duration</th>
                  <th className="p-3">Reason</th>
                  <th className="p-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {leaveApplications.filter((l) => !l.isSoftDeleted).map((l) => {
                  const applicant = users.find((u) => u.id === l.userId);
                  return (
                    <tr key={l.id} className="hover:bg-zinc-50/80">
                      <td className="p-3">
                        <p className="font-bold text-zinc-900">{l.userName}</p>
                        <p className="text-[10px] text-zinc-500 font-semibold">{applicant?.title || l.userRole.replace('_', ' ')}</p>
                      </td>
                      <td className="p-3 font-semibold text-zinc-700">{l.leaveType} LEAVE</td>
                      <td className="p-3 text-center font-mono font-bold">{l.days} Days</td>
                      <td className="p-3 text-zinc-600 max-w-xs truncate">{l.reason}</td>
                      <td className="p-3 text-right">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          l.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' : l.status === 'REJECTED' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {l.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────────────
          TAB 7: LATE ARRIVAL AUDIT (Preserved & Enhanced)
      ───────────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'late' && (
        <div className="space-y-4">
          <div className="card-clean p-5 space-y-4">
            <div className="border-b border-zinc-100 pb-3 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-sm text-zinc-900">Late Arrival Audit Scoped Log</h3>
                <p className="text-xs text-zinc-500">
                  Punch-in records logged after threshold ({systemSettings.morningPunchInThreshold})
                </p>
              </div>
              <span className="text-[10px] font-bold bg-zinc-100 px-2.5 py-1 rounded text-zinc-700">
                {isSuperAdmin ? 'Enterprise Scope' : 'Scoped View'}
              </span>
            </div>

            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-100 border-b border-zinc-200 text-zinc-500 font-bold uppercase tracking-wider">
                <tr>
                  <th className="p-3">Employee</th>
                  <th className="p-3">Date</th>
                  <th className="p-3 font-mono">Check-In Time</th>
                  <th className="p-3 text-center">Flag Status</th>
                  <th className="p-3 text-right">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {attendance.filter((a) => a.isLate).length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-zinc-400">No late arrival records logged.</td>
                  </tr>
                ) : (
                  attendance.filter((a) => a.isLate).map((a) => {
                    const emp = users.find((u) => u.id === a.userId);
                    return (
                      <tr key={a.id} className="hover:bg-zinc-50/80">
                        <td className="p-3">
                          <p className="font-bold text-zinc-900">{emp?.name || a.userId}</p>
                          <p className="text-[10px] text-zinc-500 font-semibold">{emp?.title || emp?.role.replace('_', ' ')}</p>
                        </td>
                        <td className="p-3 font-semibold text-zinc-700">{formatDate(a.date)}</td>
                        <td className="p-3 font-mono font-bold text-rose-600">{a.checkIn}</td>
                        <td className="p-3 text-center">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700 border border-rose-200">
                            FLAGGED LATE
                          </span>
                        </td>
                        <td className="p-3 text-right text-zinc-500 italic">{a.notes || 'Delayed checkin'}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────────────
          MODAL 1: VIEW ALL TASK LOGS (ATTENDANCE REPORT)
      ───────────────────────────────────────────────────────────────────────────── */}
      {taskLogUser && selectedUserTaskRecord && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-6 shadow-2xl border border-zinc-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
              <div className="flex items-center space-x-3">
                <img
                  src={taskLogUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                  alt={taskLogUser.name}
                  className="w-11 h-11 rounded-full object-cover border-2 border-brand-500"
                />
                <div>
                  <h3 className="font-extrabold text-base text-zinc-900">{taskLogUser.name} — Task Logs &amp; Work Breakdown</h3>
                  <p className="text-xs text-zinc-500">{taskLogUser.title || taskLogUser.role.replace('_', ' ')} • {selectedMonth} {selectedYear}</p>
                </div>
              </div>
              <button
                onClick={() => setTaskLogUser(null)}
                className="p-2 hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-3 gap-3 text-xs">
              <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200">
                <p className="text-zinc-400 font-bold uppercase text-[10px]">Total Assigned Tasks</p>
                <p className="text-lg font-extrabold text-zinc-900 mt-0.5">{selectedUserTaskRecord.userTasks.length} Tasks</p>
              </div>
              <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200">
                <p className="text-zinc-400 font-bold uppercase text-[10px]">Logged Task Hours</p>
                <p className="text-lg font-extrabold text-emerald-600 font-mono mt-0.5">{selectedUserTaskRecord.totalTaskHrs} hrs</p>
              </div>
              <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200">
                <p className="text-zinc-400 font-bold uppercase text-[10px]">Total Office Hours</p>
                <p className="text-lg font-extrabold text-brand-600 font-mono mt-0.5">{selectedUserTaskRecord.totalOfficeHrs} hrs</p>
              </div>
            </div>

            {/* Tasks List */}
            <div className="space-y-3">
              <h4 className="font-extrabold text-xs text-zinc-800 uppercase tracking-wider">Detailed Task Log Items:</h4>
              {selectedUserTaskRecord.userTasks.length === 0 ? (
                <div className="p-6 text-center text-zinc-400 border border-zinc-200 rounded-2xl">
                  No task logs recorded for this employee.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {selectedUserTaskRecord.userTasks.map((t) => {
                    const proj = projects.find((p) => p.id === t.projectId);
                    return (
                      <div key={t.id} className="p-3.5 rounded-xl border border-zinc-200 bg-zinc-50/60 flex items-center justify-between text-xs hover:border-brand-300 transition-colors">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-extrabold text-zinc-900 text-sm">{t.title}</span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              t.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' : 'bg-brand-100 text-brand-800'
                            }`}>
                              {t.status}
                            </span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-zinc-200 text-zinc-700">
                              {t.priority}
                            </span>
                          </div>
                          <p className="text-zinc-500 text-[11px]">{proj?.name || 'General Project'} • Due: {formatDate(t.dueDate)}</p>
                        </div>

                        <div className="text-right font-mono">
                          <p className="font-extrabold text-brand-600 text-sm">{t.loggedHours} hrs logged</p>
                          <p className="text-[10px] text-zinc-400">Est: {t.estimatedHours} hrs</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-zinc-100">
              <button
                onClick={() => setTaskLogUser(null)}
                className="px-5 py-2 bg-zinc-900 text-white font-bold rounded-xl text-xs hover:bg-black transition-all cursor-pointer"
              >
                Close Task Logs
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────────────
          MODAL 2: VIEW SALARY CALCULATION BREAKDOWN
      ───────────────────────────────────────────────────────────────────────────── */}
      {salaryModalUser && selectedUserSalaryRecord && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] overflow-y-auto p-6 space-y-5 shadow-2xl border border-zinc-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <div className="flex items-center space-x-3">
                <img
                  src={salaryModalUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                  alt={salaryModalUser.name}
                  className="w-11 h-11 rounded-full object-cover border-2 border-brand-500"
                />
                <div>
                  <h3 className="font-extrabold text-base text-zinc-900">{salaryModalUser.name} — Salary Calculation</h3>
                  <p className="text-xs text-zinc-500">{salaryModalUser.title || salaryModalUser.role.replace('_', ' ')} • {selectedMonth} {selectedYear}</p>
                </div>
              </div>
              <button
                onClick={() => setSalaryModalUser(null)}
                className="p-2 hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Attendance & Working Hours Comparison */}
            <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-3 text-xs">
              <h4 className="font-extrabold text-zinc-800 uppercase tracking-wider text-[11px]">1. Attendance &amp; Working Hours Audit</h4>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-2.5 bg-white rounded-xl border border-zinc-200">
                  <p className="text-zinc-400 font-bold text-[10px]">Working Days</p>
                  <p className="font-mono font-extrabold text-zinc-900">{selectedUserSalaryRecord.daysPresent} / {totalWorkingDaysInPeriod} Days</p>
                </div>
                <div className="p-2.5 bg-white rounded-xl border border-zinc-200">
                  <p className="text-zinc-400 font-bold text-[10px]">Actual vs Expected Hrs</p>
                  <p className="font-mono font-extrabold text-zinc-900">{selectedUserSalaryRecord.totalOfficeHrs}h / {expectedPeriodHours}h</p>
                </div>
                <div className="p-2.5 bg-white rounded-xl border border-zinc-200">
                  <p className="text-zinc-400 font-bold text-[10px]">Per-Day Salary Rate</p>
                  <p className="font-mono font-extrabold text-brand-600">{formatCurrency(selectedUserSalaryRecord.perDayRate, systemSettings)}/day</p>
                </div>
              </div>

              {/* Red Flag Notice if hours deficit > 5 */}
              {selectedUserSalaryRecord.hasRedFlag ? (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 text-xs flex items-start space-x-2.5">
                  <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-extrabold text-rose-800">Red Flag Assigned (Working Hours Deficit &gt; 5h)</p>
                    <p className="text-[11px] text-rose-700 mt-0.5">
                      Employee logged <strong>{selectedUserSalaryRecord.totalOfficeHrs}h</strong> vs monthly required <strong>{expectedPeriodHours}h</strong> (Deficit: <strong>-{selectedUserSalaryRecord.hoursDeficit}h</strong>).
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-xs flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>Working hours compliance verified (No deficit penalty flag).</span>
                </div>
              )}
            </div>

            {/* Leave & Late Penalty Breakdown */}
            <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-3 text-xs">
              <h4 className="font-extrabold text-zinc-800 uppercase tracking-wider text-[11px]">2. Leaves &amp; Late Arrival Deductions</h4>
              
              <div className="space-y-2 divide-y divide-zinc-200/60">
                {/* Leave without Pay */}
                <div className="flex items-center justify-between pt-1">
                  <div>
                    <p className="font-bold text-zinc-800">Leave without Pay (Unpaid LWP):</p>
                    <p className="text-[10px] text-zinc-400">{selectedUserSalaryRecord.unpaidLeaveDays} days × {formatCurrency(selectedUserSalaryRecord.perDayRate, systemSettings)}</p>
                  </div>
                  <span className="font-mono font-bold text-rose-600">
                    -{formatCurrency(selectedUserSalaryRecord.unpaidLeaveDeduction, systemSettings)}
                  </span>
                </div>

                {/* Leave with Pay & Comp-off (No Deduction) */}
                <div className="flex items-center justify-between pt-2">
                  <div>
                    <p className="font-bold text-zinc-800">Paid Leaves &amp; Comp-Off Taken:</p>
                    <p className="text-[10px] text-zinc-400">{selectedUserSalaryRecord.paidLeaveDays} Paid Days + {selectedUserSalaryRecord.compOffDays} Comp-Off (Exempt from deduction)</p>
                  </div>
                  <span className="font-mono font-bold text-emerald-600">
                    {formatCurrency(0, systemSettings)} (No deduction)
                  </span>
                </div>

                {/* Late Arrival Penalty */}
                <div className="flex items-center justify-between pt-2">
                  <div>
                    <p className="font-bold text-zinc-800">Late Arrival Penalty (&gt; {lateLimitThreshold} times threshold):</p>
                    <p className="text-[10px] text-zinc-400">
                      {selectedUserSalaryRecord.lateArrivalCount} late check-ins → {selectedUserSalaryRecord.extraLateDays} days above limit = {selectedUserSalaryRecord.latePenaltyDays} half-days LWP (no leave balance adjustment)
                    </p>
                  </div>
                  <span className="font-mono font-bold text-rose-600">
                    -{formatCurrency(selectedUserSalaryRecord.latePenaltyDeduction, systemSettings)}
                  </span>
                </div>
              </div>
            </div>

            {/* Payslip Configuration Breakdown */}
            <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-3 text-xs">
              <h4 className="font-extrabold text-zinc-800 uppercase tracking-wider text-[11px]">3. Payslip Configuration Allowances &amp; Statutory Deductions</h4>
              
              <div className="grid grid-cols-2 gap-4">
                {/* Earnings */}
                <div className="space-y-1.5 p-3 bg-white rounded-xl border border-zinc-200">
                  <p className="font-bold text-emerald-800 uppercase text-[10px] border-b border-zinc-100 pb-1">Earnings Included</p>
                  <div className="flex justify-between text-[11px]"><span className="text-zinc-600">Basic Salary:</span><span className="font-mono font-bold">{formatCurrency(selectedUserSalaryRecord.basicSalary, systemSettings)}</span></div>
                  {selectedUserSalaryRecord.hra > 0 && <div className="flex justify-between text-[11px]"><span className="text-zinc-600">HRA Allowance:</span><span className="font-mono font-bold">{formatCurrency(selectedUserSalaryRecord.hra, systemSettings)}</span></div>}
                  {selectedUserSalaryRecord.special > 0 && <div className="flex justify-between text-[11px]"><span className="text-zinc-600">Special Allowance:</span><span className="font-mono font-bold">{formatCurrency(selectedUserSalaryRecord.special, systemSettings)}</span></div>}
                  {selectedUserSalaryRecord.da > 0 && <div className="flex justify-between text-[11px]"><span className="text-zinc-600">DA Allowance:</span><span className="font-mono font-bold">{formatCurrency(selectedUserSalaryRecord.da, systemSettings)}</span></div>}
                  {selectedUserSalaryRecord.ta > 0 && <div className="flex justify-between text-[11px]"><span className="text-zinc-600">TA Allowance:</span><span className="font-mono font-bold">{formatCurrency(selectedUserSalaryRecord.ta, systemSettings)}</span></div>}
                  {selectedUserSalaryRecord.food > 0 && <div className="flex justify-between text-[11px]"><span className="text-zinc-600">Food Allowance:</span><span className="font-mono font-bold">{formatCurrency(selectedUserSalaryRecord.food, systemSettings)}</span></div>}
                  <div className="flex justify-between pt-1 border-t border-zinc-100 font-bold text-emerald-700"><span>Gross Salary:</span><span className="font-mono">{formatCurrency(selectedUserSalaryRecord.grossSalary, systemSettings)}</span></div>
                </div>

                {/* Deductions */}
                <div className="space-y-1.5 p-3 bg-white rounded-xl border border-zinc-200">
                  <p className="font-bold text-rose-800 uppercase text-[10px] border-b border-zinc-100 pb-1">Statutory Deductions</p>
                  {selectedUserSalaryRecord.pfDeduction > 0 && <div className="flex justify-between text-[11px]"><span className="text-zinc-600">Provident Fund (PF):</span><span className="font-mono font-bold text-rose-600">-{formatCurrency(selectedUserSalaryRecord.pfDeduction, systemSettings)}</span></div>}
                  {selectedUserSalaryRecord.taxDeduction > 0 && <div className="flex justify-between text-[11px]"><span className="text-zinc-600">Income Tax (TDS):</span><span className="font-mono font-bold text-rose-600">-{formatCurrency(selectedUserSalaryRecord.taxDeduction, systemSettings)}</span></div>}
                  {selectedUserSalaryRecord.profTaxDeduction > 0 && <div className="flex justify-between text-[11px]"><span className="text-zinc-600">Professional Tax:</span><span className="font-mono font-bold text-rose-600">-{formatCurrency(selectedUserSalaryRecord.profTaxDeduction, systemSettings)}</span></div>}
                  {selectedUserSalaryRecord.unpaidLeaveDeduction > 0 && <div className="flex justify-between text-[11px]"><span className="text-zinc-600">Unpaid Leave:</span><span className="font-mono font-bold text-rose-600">-{formatCurrency(selectedUserSalaryRecord.unpaidLeaveDeduction, systemSettings)}</span></div>}
                  {selectedUserSalaryRecord.latePenaltyDeduction > 0 && <div className="flex justify-between text-[11px]"><span className="text-zinc-600">Late Penalty:</span><span className="font-mono font-bold text-rose-600">-{formatCurrency(selectedUserSalaryRecord.latePenaltyDeduction, systemSettings)}</span></div>}
                  <div className="flex justify-between pt-1 border-t border-zinc-100 font-bold text-rose-700"><span>Total Deductions:</span><span className="font-mono">-{formatCurrency(selectedUserSalaryRecord.totalDeductions, systemSettings)}</span></div>
                </div>
              </div>
            </div>

            {/* Final Net Payable Banner */}
            <div className="p-4 rounded-2xl bg-zinc-900 text-white flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Net Calculated Payable Salary</p>
                <p className="text-2xl font-extrabold font-mono text-emerald-400 mt-0.5">
                  {formatCurrency(selectedUserSalaryRecord.netPayable, systemSettings)}
                </p>
              </div>
              <button
                onClick={() => setSalaryModalUser(null)}
                className="px-5 py-2.5 bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-xl text-xs transition-all cursor-pointer shadow-glow-orange"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────────────
          MODAL 3: VIEW WORKLOG DETAILS (INDIVIDUAL TASK REPORT)
      ───────────────────────────────────────────────────────────────────────────── */}
      {viewWorklogTask && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-5 shadow-2xl border border-zinc-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="font-extrabold text-base text-zinc-900">{viewWorklogTask.title}</h3>
                  {(() => {
                    const tt = taskTypes.find((t) => t.id === viewWorklogTask.typeId);
                    return (
                      <span
                        className="px-2 py-0.5 rounded text-[10px] font-bold"
                        style={{
                          backgroundColor: `${tt?.color || '#3b82f6'}20`,
                          color: tt?.color || '#1d4ed8'
                        }}
                      >
                        {tt?.name || 'Task Type'}
                      </span>
                    );
                  })()}
                </div>
                <p className="text-xs text-zinc-500 mt-0.5 font-medium">
                  Project: <strong className="text-zinc-800">{projects.find((p) => p.id === viewWorklogTask.projectId)?.name || 'General'}</strong> • Assigned to: <strong className="text-zinc-800">{users.find((u) => u.id === viewWorklogTask.assigneeId)?.name || 'Team Member'}</strong>
                </p>
              </div>
              <button
                onClick={() => setViewWorklogTask(null)}
                className="p-2 hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Worklog Sessions Table */}
            <div className="border border-zinc-200 rounded-2xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-100 border-b border-zinc-200 text-zinc-600 font-bold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="p-3.5">Start Timer</th>
                    <th className="p-3.5">Stop Timer</th>
                    <th className="p-3.5 text-center">Total Time</th>
                    <th className="p-3.5">Stop Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {activeTaskWorklogs.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-6 text-center text-zinc-400 font-medium">
                        No individual live worklog sessions recorded for this task.
                      </td>
                    </tr>
                  ) : (
                    activeTaskWorklogs.map((wl, idx) => (
                      <tr key={wl.id || idx} className="hover:bg-zinc-50/80 transition-colors">
                        <td className="p-3.5 font-mono text-zinc-800 font-bold">
                          {wl.startTime ? formatDate(wl.startTime) + ' ' + wl.startTime.split(' ')[1] : 'N/A'}
                        </td>
                        <td className="p-3.5 font-mono text-zinc-800 font-bold">
                          {wl.endTime ? formatDate(wl.endTime) + ' ' + wl.endTime.split(' ')[1] : (
                            <span className="text-emerald-600 font-extrabold flex items-center gap-1">
                              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                              In Progress
                            </span>
                          )}
                        </td>
                        <td className="p-3.5 text-center font-mono font-extrabold text-brand-600">
                          {formatDurationFromSeconds(wl.durationSeconds)} ({formatHoursDecimal(wl.durationSeconds / 3600)})
                        </td>
                        <td className="p-3.5 text-zinc-600 max-w-xs truncate">
                          {wl.notes || 'Worklog session completed'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                {/* Total of Total Time Column Sum Footer */}
                {activeTaskWorklogs.length > 0 && (
                  <tfoot className="bg-zinc-50 border-t-2 border-zinc-200 font-bold">
                    <tr>
                      <td colSpan={2} className="p-3.5 text-zinc-800 uppercase tracking-wider text-xs">
                        Total Sum of Recorded Worklogs:
                      </td>
                      <td className="p-3.5 text-center font-mono font-extrabold text-brand-600 text-sm">
                        {formatDurationFromSeconds(totalActiveTaskWorklogSeconds)} ({formatHoursDecimal(totalActiveTaskWorklogSeconds / 3600)})
                      </td>
                      <td className="p-3.5 text-right text-zinc-500 font-medium">
                        {activeTaskWorklogs.length} session{activeTaskWorklogs.length > 1 ? 's' : ''}
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>

            <div className="flex justify-end pt-2 border-t border-zinc-100">
              <button
                onClick={() => setViewWorklogTask(null)}
                className="px-5 py-2 bg-zinc-900 text-white font-bold rounded-xl text-xs hover:bg-black transition-all cursor-pointer"
              >
                Close Worklogs
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────────────
          MODAL 4: VIEW PROJECT TASKS LOG (PROJECT REPORT)
      ───────────────────────────────────────────────────────────────────────────── */}
      {viewProjectLogs && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-5 shadow-2xl border border-zinc-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <div>
                <h3 className="font-extrabold text-base text-zinc-900">{viewProjectLogs.name} — Project Task Evaluation</h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Project Duration: <strong className="text-zinc-800">{formatRange(viewProjectLogs.startDate, viewProjectLogs.endDate || viewProjectLogs.deadline)}</strong> • Estimated Budget: <strong className="text-brand-600">{viewProjectLogs.estimatedHours || 0} hrs</strong>
                </p>
              </div>
              <button
                onClick={() => setViewProjectLogs(null)}
                className="p-2 hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Detailed Project Tasks Table */}
            <div className="border border-zinc-200 rounded-2xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-100 border-b border-zinc-200 text-zinc-600 font-bold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="p-3.5">Task Title</th>
                    <th className="p-3.5">Task Type</th>
                    <th className="p-3.5">Start &amp; End Date</th>
                    <th className="p-3.5 text-center">Total Task Time</th>
                    <th className="p-3.5 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {activeProjectTaskEntries.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-zinc-400 font-medium">
                        No tasks created or assigned for this project yet.
                      </td>
                    </tr>
                  ) : (
                    activeProjectTaskEntries.map((t) => {
                      const tt = taskTypes.find((type) => type.id === t.typeId);
                      const assignee = users.find((u) => u.id === t.assigneeId);

                      return (
                        <tr key={t.id} className="hover:bg-zinc-50/80 transition-colors">
                          <td className="p-3.5">
                            <p className="font-extrabold text-zinc-900">{t.title}</p>
                            {assignee && (
                              <p className="text-[10px] text-zinc-400 font-medium">Assigned to: {assignee.name}</p>
                            )}
                          </td>
                          <td className="p-3.5">
                            <span
                              className="px-2 py-0.5 rounded text-[10px] font-bold"
                              style={{
                                backgroundColor: `${tt?.color || '#3b82f6'}20`,
                                color: tt?.color || '#1d4ed8'
                              }}
                            >
                              {tt?.name || 'Task'}
                            </span>
                          </td>
                          <td className="p-3.5 text-zinc-600 font-mono text-[11px]">
                            {formatRange(t.startDate, t.dueDate)}
                          </td>
                          <td className="p-3.5 text-center font-mono font-extrabold text-brand-600">
                            {formatHoursDecimal(t.loggedHours)}
                          </td>
                          <td className="p-3.5 text-right">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              t.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' :
                              t.status === 'IN_PROGRESS' ? 'bg-brand-100 text-brand-800' :
                              t.status === 'IN_REVIEW' ? 'bg-purple-100 text-purple-800' : 'bg-zinc-100 text-zinc-700'
                            }`}>
                              {t.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
                {/* Total of Total Task Time Column Sum Footer */}
                {activeProjectTaskEntries.length > 0 && (
                  <tfoot className="bg-zinc-50 border-t-2 border-zinc-200 font-bold">
                    <tr>
                      <td colSpan={3} className="p-3.5 text-zinc-800 uppercase tracking-wider text-xs">
                        Total Project Task Time Sum:
                      </td>
                      <td className="p-3.5 text-center font-mono font-extrabold text-brand-600 text-sm">
                        {formatHoursDecimal(totalActiveProjectTaskHours)}
                      </td>
                      <td className="p-3.5 text-right text-zinc-500 font-medium">
                        {activeProjectTaskEntries.length} task{activeProjectTaskEntries.length > 1 ? 's' : ''}
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>

            <div className="flex justify-end pt-2 border-t border-zinc-100">
              <button
                onClick={() => setViewProjectLogs(null)}
                className="px-5 py-2 bg-zinc-900 text-white font-bold rounded-xl text-xs hover:bg-black transition-all cursor-pointer"
              >
                Close Project Logs
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

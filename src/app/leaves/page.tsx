'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useSystem } from '@/context/SystemContext';
import { LeaveType, LeaveApplication, LeaveRule, CompOffRequest, PaidLeaveCredit } from '@/lib/types';
import { formatDate, calculateDateDiffDays } from '@/lib/utils';
import {
  CalendarDays,
  Plus,
  CheckCircle,
  XCircle,
  Clock,
  ShieldAlert,
  FileText,
  Award,
  Settings,
  X,
  AlertCircle,
  Gift,
  Trash2,
  Edit,
  Trash,
  Calendar,
  Filter,
  Check,
  UserCheck,
  TrendingUp,
  UserPlus,
  ArrowRight,
  Briefcase,
  Users,
  CheckCircle2,
  Eye,
  SlidersHorizontal,
  ChevronRight
} from 'lucide-react';

export default function LeavesPage() {
  const {
    currentUser,
    myTeamMemberIds,
    teams,
    leaveApplications,
    compOffRequests,
    paidLeaveCredits,
    leaveRules,
    users,
    projects,
    systemSettings,
    applyLeave,
    editLeave,
    reviewLeave,
    softDeleteLeave,
    hardDeleteLeave,
    addPaidLeaveCredit,
    editPaidLeaveCredit,
    deletePaidLeaveCredit,
    submitCompOff,
    reviewCompOff,
    editCompOff,
    deleteCompOff,
    addLeaveRule
  } = useSystem();

  const [activeTab, setActiveTab] = useState<'applications' | 'approvals' | 'comp-off' | 'credits' | 'rules' | 'audit'>('applications');
  
  // Card Filter State (drill-down on clicking any of the top dashboard cards or URL query param)
  const [activeCardFilter, setActiveCardFilter] = useState<'TODAY' | 'THIS_WEEK' | 'NEXT_WEEK' | 'THIS_MONTH' | 'PENDING' | 'COMP_OFF' | null>(null);

  // Modals
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState<LeaveApplication | null>(null);
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [showCompOffModal, setShowCompOffModal] = useState(false);
  const [showRuleModal, setShowRuleModal] = useState(false);
  const [rejectionModalLeave, setRejectionModalLeave] = useState<LeaveApplication | null>(null);
  const [rejectionReasonInput, setRejectionReasonInput] = useState('');

  // Apply Leave Form States
  const [leaveType, setLeaveType] = useState<LeaveType>('PAID');
  const [startDate, setStartDate] = useState('2026-08-31');
  const [endDate, setEndDate] = useState('2026-09-02');
  const [reason, setReason] = useState('');
  const [workInAbsence, setWorkInAbsence] = useState('');
  const [attachmentName, setAttachmentName] = useState('');
  const [formError, setFormError] = useState('');

  // Group / Individual Paid Leave Credit State
  const [creditTarget, setCreditTarget] = useState<'individual' | 'group'>('individual');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([users[0]?.id || '']);
  const [creditDays, setCreditDays] = useState(3);
  const [creditValidFrom, setCreditValidFrom] = useState('2026-09-01');
  const [creditValidTo, setCreditValidTo] = useState('2026-12-31');
  const [creditReason, setCreditReason] = useState('Annual Incentive / Performance Paid Leave Credit');
  const [probationCondition, setProbationCondition] = useState<'ALL' | 'LESS_THAN' | 'GREATER_THAN' | 'GREATER_EQUAL'>('ALL');
  const [probationCutoffDate, setProbationCutoffDate] = useState('2026-06-01');

  // Comp-off Request Form State
  const [compEmployeeId, setCompEmployeeId] = useState(currentUser?.id || users[0]?.id || '');
  const [workDate, setWorkDate] = useState('2026-08-23'); // Sunday
  const [hoursWorked, setHoursWorked] = useState(8);
  const [compDays, setCompDays] = useState(1);
  const [compReason, setCompReason] = useState('Weekend deployment and release support');
  const [projectWorkedOn, setProjectWorkedOn] = useState(projects[0]?.name || 'Task System Platform');
  const [compStatus, setCompStatus] = useState<'PENDING' | 'APPROVED_BY_TL' | 'APPROVED' | 'REJECTED'>('PENDING');

  // Edit Comp-Off Form States
  const [showEditCompOffModal, setShowEditCompOffModal] = useState<CompOffRequest | null>(null);
  const [editCompWorkDate, setEditCompWorkDate] = useState('');
  const [editCompHours, setEditCompHours] = useState(8);
  const [editCompDays, setEditCompDays] = useState(1);
  const [editCompReason, setEditCompReason] = useState('');
  const [editCompProject, setEditCompProject] = useState('');
  const [editCompStatus, setEditCompStatus] = useState<CompOffRequest['status']>('PENDING');

  // Edit Paid Leave Credit Form States
  const [showEditCreditModal, setShowEditCreditModal] = useState<PaidLeaveCredit | null>(null);
  const [editCreditDays, setEditCreditDays] = useState(3);
  const [editCreditReason, setEditCreditReason] = useState('');
  const [editCreditValidFrom, setEditCreditValidFrom] = useState('');
  const [editCreditValidTo, setEditCreditValidTo] = useState('');

  // Leave Rule Form State
  const [ruleType, setRuleType] = useState<LeaveType>('PAID');
  const [ruleTitle, setRuleTitle] = useState('');
  const [ruleMaxDays, setRuleMaxDays] = useState(systemSettings.totalPaidLeavePerYear || 18);
  const [ruleNoticeDays, setRuleNoticeDays] = useState<number>(systemSettings.minNoticeDaysRequired);
  const [ruleMaxConsecutive, setRuleMaxConsecutive] = useState(10);
  const [ruleCarryForward, setRuleCarryForward] = useState(true);
  const [ruleDesc, setRuleDesc] = useState('');

  if (!currentUser) return null;

  const isSuperAdmin = currentUser.role === 'SUPER_ADMIN';
  const isHR = currentUser.role === 'ADMIN_HR';
  const isTeamLead = currentUser.role === 'TEAM_LEADER';
  const isRegularEmployee = currentUser.role === 'EMPLOYEE';
  const isSeniorApprover = isSuperAdmin || isHR || isTeamLead;
  const isAdminOrHR = isSuperAdmin || isHR;

  // Active (non-soft-deleted) leave applications for regular users
  const visibleApplications = leaveApplications.filter(l => {
    if (l.isSoftDeleted) return false;
    if (isAdminOrHR) return true;
    if (isTeamLead) return l.userId === currentUser.id || myTeamMemberIds.includes(l.userId);
    return l.userId === currentUser.id;
  });
  
  const softDeletedApplications = leaveApplications.filter(l => l.isSoftDeleted && isAdminOrHR);

  // Pending Approvals Queue as per hierarchy
  const pendingApprovals = leaveApplications.filter(l => {
    if (l.isSoftDeleted || l.status !== 'PENDING') return false;
    if (isAdminOrHR) return true;
    if (isTeamLead) return myTeamMemberIds.includes(l.userId);
    return false;
  });

  const visibleCompOffRequests = compOffRequests.filter(co => {
    if (isAdminOrHR) return true;
    if (isTeamLead) return co.userId === currentUser.id || myTeamMemberIds.includes(co.userId);
    return co.userId === currentUser.id;
  });

  // Current user's team & Leader
  const userTeam = teams.find(t => t.id === currentUser.teamId);
  const teamLeader = userTeam ? users.find(u => u.id === userTeam.leaderId) : null;

  // Helper date calculations for Week & Month ranges
  const dateRanges = useMemo(() => {
    const now = new Date();
    
    // This Week (Monday to Sunday)
    const currentDay = now.getDay();
    const distanceToMonday = (currentDay + 6) % 7;
    const thisMonday = new Date(now);
    thisMonday.setDate(now.getDate() - distanceToMonday);
    thisMonday.setHours(0, 0, 0, 0);

    const thisSunday = new Date(thisMonday);
    thisSunday.setDate(thisMonday.getDate() + 6);
    thisSunday.setHours(23, 59, 59, 999);

    // Next Week
    const nextMonday = new Date(thisMonday);
    nextMonday.setDate(thisMonday.getDate() + 7);
    nextMonday.setHours(0, 0, 0, 0);

    const nextSunday = new Date(nextMonday);
    nextSunday.setDate(nextMonday.getDate() + 6);
    nextSunday.setHours(23, 59, 59, 999);

    // Current Month
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    const thisMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    return {
      thisWeek: { start: thisMonday, end: thisSunday },
      nextWeek: { start: nextMonday, end: nextSunday },
      thisMonth: { start: thisMonthStart, end: thisMonthEnd, name: now.toLocaleString('default', { month: 'long', year: 'numeric' }) }
    };
  }, []);

  const isOverlap = (startDateStr: string, endDateStr: string, rangeStart: Date, rangeEnd: Date) => {
    const lStart = new Date(startDateStr).getTime();
    const lEnd = new Date(endDateStr).getTime();
    const rStart = rangeStart.getTime();
    const rEnd = rangeEnd.getTime();
    return lStart <= rEnd && lEnd >= rStart;
  };

  // Card 1: Count of leaves applied for this week (from all team members / visible)
  const thisWeekLeaves = useMemo(() => {
    return visibleApplications.filter(l => isOverlap(l.startDate, l.endDate, dateRanges.thisWeek.start, dateRanges.thisWeek.end));
  }, [visibleApplications, dateRanges]);

  // Card 2: Count of leaves applied for next week (from all team members)
  const nextWeekLeaves = useMemo(() => {
    return visibleApplications.filter(l => isOverlap(l.startDate, l.endDate, dateRanges.nextWeek.start, dateRanges.nextWeek.end));
  }, [visibleApplications, dateRanges]);

  // Card 3: Count of leaves applied for current month (from all team members)
  const thisMonthLeaves = useMemo(() => {
    return visibleApplications.filter(l => isOverlap(l.startDate, l.endDate, dateRanges.thisMonth.start, dateRanges.thisMonth.end));
  }, [visibleApplications, dateRanges]);

  // Card 4: Approval Pending Leave count (from all team members)
  const pendingLeavesList = useMemo(() => {
    return visibleApplications.filter(l => l.status === 'PENDING');
  }, [visibleApplications]);

  // Check for URL query parameter filter (e.g. from Attendance page: /leaves?filter=today)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const filter = params.get('filter');
      if (filter === 'today' || filter === 'TODAY') {
        setActiveCardFilter('TODAY');
      }
    }
  }, []);

  const todayIso = useMemo(() => new Date().toISOString().split('T')[0], []);
  const todayLeaves = useMemo(() => {
    return visibleApplications.filter(l => todayIso >= l.startDate && todayIso <= l.endDate);
  }, [visibleApplications, todayIso]);

  // Card 5: Comp-Off leave request count (from all team members)
  const compOffList = useMemo(() => {
    return visibleCompOffRequests;
  }, [visibleCompOffRequests]);

  // Filtered list based on active card click
  const cardFilteredLeaves = useMemo(() => {
    if (activeCardFilter === 'TODAY') return todayLeaves;
    if (activeCardFilter === 'THIS_WEEK') return thisWeekLeaves;
    if (activeCardFilter === 'NEXT_WEEK') return nextWeekLeaves;
    if (activeCardFilter === 'THIS_MONTH') return thisMonthLeaves;
    if (activeCardFilter === 'PENDING') return pendingLeavesList;
    return [];
  }, [activeCardFilter, todayLeaves, thisWeekLeaves, nextWeekLeaves, thisMonthLeaves, pendingLeavesList]);

  // Filter staff matching probation condition for Group Credit
  const eligibleProbationStaff = useMemo(() => {
    if (creditTarget === 'individual') return [];
    if (probationCondition === 'ALL') return users;

    const cutoff = new Date(probationCutoffDate).getTime();
    return users.filter(u => {
      // Calculate probation completion date based on joiningDate + eligibility months
      const joinMs = new Date(u.joiningDate).getTime();
      const probMs = joinMs + (systemSettings.probationPaidLeaveEligibilityMonths || 6) * 30 * 24 * 60 * 60 * 1000;
      
      if (probationCondition === 'LESS_THAN') {
        return probMs < cutoff;
      }
      if (probationCondition === 'GREATER_THAN') {
        return probMs > cutoff;
      }
      if (probationCondition === 'GREATER_EQUAL') {
        return probMs >= cutoff;
      }
      return true;
    });
  }, [users, creditTarget, probationCondition, probationCutoffDate, systemSettings.probationPaidLeaveEligibilityMonths]);

  // Apply Leave with Min Advance Notice Validation & Absence Handover
  const handleApplyLeave = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!startDate || !endDate || !reason.trim()) return;

    // Check min notice days required
    const todayMs = new Date().getTime();
    const startMs = new Date(startDate).getTime();
    const diffDays = Math.ceil((startMs - todayMs) / (1000 * 60 * 60 * 24));

    if (diffDays < systemSettings.minNoticeDaysRequired) {
      setFormError(
        `Leave Policy Violation: Company configuration requires a minimum of ${systemSettings.minNoticeDaysRequired} advance notice days for leave application.`
      );
      return;
    }

    const daysCount = calculateDateDiffDays(startDate, endDate);

    applyLeave({
      leaveType,
      startDate,
      endDate,
      days: daysCount,
      reason,
      workInAbsence: workInAbsence.trim() || undefined,
      attachmentName: attachmentName || undefined
    });

    setReason('');
    setWorkInAbsence('');
    setShowApplyModal(false);
  };

  // Edit Leave Application
  const handleEditLeaveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!showEditModal) return;

    const daysCount = calculateDateDiffDays(startDate, endDate);

    editLeave(showEditModal.id, {
      leaveType,
      startDate,
      endDate,
      days: daysCount,
      reason,
      workInAbsence: workInAbsence.trim() || undefined
    });

    setShowEditModal(null);
  };

  // Credit Paid Leave to Individual or Group
  const handleCreditLeave = (e: React.FormEvent) => {
    e.preventDefault();
    const targetIds = creditTarget === 'group' ? eligibleProbationStaff.map(u => u.id) : selectedUserIds;
    
    if (targetIds.length === 0) {
      alert('No eligible employees selected for credit.');
      return;
    }

    addPaidLeaveCredit(targetIds, Number(creditDays), creditReason, creditValidFrom, creditValidTo);
    setShowCreditModal(false);
  };

  // Edit Comp-Off Request
  const handleSaveEditCompOff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!showEditCompOffModal) return;
    editCompOff(showEditCompOffModal.id, {
      workDate: editCompWorkDate,
      hoursWorked: Number(editCompHours),
      convertedDays: Number(editCompDays),
      reason: editCompReason,
      projectWorkedOn: editCompProject,
      status: editCompStatus
    });
    setShowEditCompOffModal(null);
  };

  // Edit Paid Leave Credit
  const handleSaveEditCredit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!showEditCreditModal) return;
    editPaidLeaveCredit(showEditCreditModal.id, {
      days: Number(editCreditDays),
      reason: editCreditReason,
      validFrom: editCreditValidFrom,
      validTo: editCreditValidTo
    });
    setShowEditCreditModal(null);
  };

  // Submit Comp-off Extra Work
  const handleCompOffSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const targetUser = users.find(u => u.id === compEmployeeId) || currentUser;

    submitCompOff({
      userId: targetUser.id,
      userName: targetUser.name,
      workDate,
      hoursWorked: Number(hoursWorked),
      convertedDays: Number(compDays),
      reason: compReason,
      projectWorkedOn,
      status: compStatus
    });

    setCompReason('');
    setShowCompOffModal(false);
  };

  const handleCreateRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ruleTitle.trim()) return;

    addLeaveRule({
      leaveType: ruleType,
      title: ruleTitle,
      maxDaysPerYear: Number(ruleMaxDays),
      noticePeriodDays: Number(ruleNoticeDays),
      maxConsecutiveDays: Number(ruleMaxConsecutive),
      allowCarryForward: ruleCarryForward,
      description: ruleDesc
    });

    setRuleTitle('');
    setShowRuleModal(false);
  };

  const openRejectionModal = (leave: LeaveApplication) => {
    setRejectionModalLeave(leave);
    setRejectionReasonInput('Insufficient notice period or overlapping team deadlines');
  };

  const confirmRejection = () => {
    if (!rejectionModalLeave) return;
    reviewLeave(rejectionModalLeave.id, 'REJECTED', rejectionReasonInput);
    setRejectionModalLeave(null);
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-zinc-900 tracking-tight flex items-center gap-2">
            <CalendarDays className="w-6 h-6 text-brand-500" /> Leave & Comp-Off Management
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            Hierarchy-based approvals (Team Leader & Super Admin), min advance notice ({systemSettings.minNoticeDaysRequired} days), absence handover tracking, and comp-off overtime claims.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              setFormError('');
              setWorkInAbsence('');
              setShowApplyModal(true);
            }}
            className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-xs font-bold shadow-glow-orange cursor-pointer flex items-center space-x-1.5 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Apply For Leave</span>
          </button>

          <button
            onClick={() => {
              setFormError('');
              setCompEmployeeId(currentUser.id);
              setCompDays(1);
              setHoursWorked(8);
              setCompStatus('PENDING');
              setShowCompOffModal(true);
            }}
            className="px-4 py-2 bg-obsidian-950 hover:bg-black text-white rounded-xl text-xs font-bold border border-obsidian-800 cursor-pointer flex items-center space-x-1.5 shadow-sm"
          >
            <Award className="w-4 h-4 text-brand-400" />
            <span>Weekend/Holiday Comp-Off</span>
          </button>

          {(isSuperAdmin || isHR) && (
            <button
              onClick={() => setShowCreditModal(true)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold cursor-pointer flex items-center space-x-1.5 shadow-sm"
            >
              <Gift className="w-4 h-4" />
              <span>Credit Paid Leave (Group/User)</span>
            </button>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5 DASHBOARD SUMMARY METRIC CARDS (INTERACTIVE DRILL-DOWN FILTERS)          */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        
        {/* 1st Card: This Week Leaves */}
        <div
          onClick={() => setActiveCardFilter(activeCardFilter === 'THIS_WEEK' ? null : 'THIS_WEEK')}
          className={`card-clean p-4 cursor-pointer transition-all border-l-4 border-l-brand-500 hover:shadow-md ${
            activeCardFilter === 'THIS_WEEK' ? 'ring-2 ring-brand-500 bg-brand-50/40 shadow-md' : 'hover:border-zinc-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider">This Week Leaves</span>
            <span className="p-1.5 bg-brand-50 text-brand-600 rounded-lg">
              <Calendar className="w-4 h-4" />
            </span>
          </div>
          <h3 className="text-2xl font-black text-zinc-900 mt-1">{thisWeekLeaves.length}</h3>
          <p className="text-[10px] text-zinc-500 mt-1">
            {formatDate(dateRanges.thisWeek.start.toISOString().split('T')[0])} - {formatDate(dateRanges.thisWeek.end.toISOString().split('T')[0])}
          </p>
          <span className="text-[9px] font-bold text-brand-600 mt-2 block flex items-center gap-0.5">
            {activeCardFilter === 'THIS_WEEK' ? '● Filtering active' : 'Click to view details →'}
          </span>
        </div>

        {/* 2nd Card: Next Week Leaves */}
        <div
          onClick={() => setActiveCardFilter(activeCardFilter === 'NEXT_WEEK' ? null : 'NEXT_WEEK')}
          className={`card-clean p-4 cursor-pointer transition-all border-l-4 border-l-blue-500 hover:shadow-md ${
            activeCardFilter === 'NEXT_WEEK' ? 'ring-2 ring-blue-500 bg-blue-50/40 shadow-md' : 'hover:border-zinc-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider">Next Week Leaves</span>
            <span className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
              <CalendarDays className="w-4 h-4" />
            </span>
          </div>
          <h3 className="text-2xl font-black text-zinc-900 mt-1">{nextWeekLeaves.length}</h3>
          <p className="text-[10px] text-zinc-500 mt-1">
            {formatDate(dateRanges.nextWeek.start.toISOString().split('T')[0])} - {formatDate(dateRanges.nextWeek.end.toISOString().split('T')[0])}
          </p>
          <span className="text-[9px] font-bold text-blue-600 mt-2 block flex items-center gap-0.5">
            {activeCardFilter === 'NEXT_WEEK' ? '● Filtering active' : 'Click to view details →'}
          </span>
        </div>

        {/* 3rd Card: Current Month Leaves */}
        <div
          onClick={() => setActiveCardFilter(activeCardFilter === 'THIS_MONTH' ? null : 'THIS_MONTH')}
          className={`card-clean p-4 cursor-pointer transition-all border-l-4 border-l-purple-500 hover:shadow-md ${
            activeCardFilter === 'THIS_MONTH' ? 'ring-2 ring-purple-500 bg-purple-50/40 shadow-md' : 'hover:border-zinc-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider">Current Month</span>
            <span className="p-1.5 bg-purple-50 text-purple-600 rounded-lg">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <h3 className="text-2xl font-black text-zinc-900 mt-1">{thisMonthLeaves.length}</h3>
          <p className="text-[10px] text-zinc-500 mt-1">{dateRanges.thisMonth.name}</p>
          <span className="text-[9px] font-bold text-purple-600 mt-2 block flex items-center gap-0.5">
            {activeCardFilter === 'THIS_MONTH' ? '● Filtering active' : 'Click to view details →'}
          </span>
        </div>

        {/* 4th Card: Approval Pending Leave count */}
        <div
          onClick={() => setActiveCardFilter(activeCardFilter === 'PENDING' ? null : 'PENDING')}
          className={`card-clean p-4 cursor-pointer transition-all border-l-4 border-l-amber-500 hover:shadow-md ${
            activeCardFilter === 'PENDING' ? 'ring-2 ring-amber-500 bg-amber-50/50 shadow-md' : 'hover:border-zinc-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold text-amber-700 uppercase tracking-wider">Pending Approvals</span>
            <span className="p-1.5 bg-amber-100 text-amber-700 rounded-lg animate-pulse">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <h3 className="text-2xl font-black text-amber-700 mt-1">{pendingLeavesList.length}</h3>
          <p className="text-[10px] text-zinc-500 mt-1">Awaiting Hierarchy Review</p>
          <span className="text-[9px] font-bold text-amber-800 mt-2 block flex items-center gap-0.5">
            {activeCardFilter === 'PENDING' ? '● Filtering active' : 'Click to Approve/Reject →'}
          </span>
        </div>

        {/* 5th Card: Comp-Off leave request/adjustment */}
        <div
          onClick={() => {
            if (activeCardFilter === 'COMP_OFF') {
              setActiveCardFilter(null);
            } else {
              setActiveCardFilter('COMP_OFF');
              setActiveTab('comp-off');
            }
          }}
          className={`card-clean p-4 cursor-pointer transition-all border-l-4 border-l-emerald-500 hover:shadow-md ${
            activeCardFilter === 'COMP_OFF' ? 'ring-2 ring-emerald-500 bg-emerald-50/40 shadow-md' : 'hover:border-zinc-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold text-emerald-700 uppercase tracking-wider">Comp-Off Claims</span>
            <span className="p-1.5 bg-emerald-100 text-emerald-700 rounded-lg">
              <Award className="w-4 h-4" />
            </span>
          </div>
          <h3 className="text-2xl font-black text-emerald-700 mt-1">{compOffList.length}</h3>
          <p className="text-[10px] text-zinc-500 mt-1">Weekend/Holiday Work Claims</p>
          <span className="text-[9px] font-bold text-emerald-700 mt-2 block flex items-center gap-0.5">
            {activeCardFilter === 'COMP_OFF' ? '● Filtering active' : 'Click to view claims →'}
          </span>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* ACTIVE CARD FILTER DETAILS VIEW (WITH DIRECT APPROVE/REJECT ACTIONS)     */}
      {/* ========================================================================= */}
      {activeCardFilter && activeCardFilter !== 'COMP_OFF' && (
        <div className="card-clean p-5 space-y-4 border-2 border-brand-500/30 bg-gradient-to-br from-white to-brand-50/20 shadow-lg animate-in fade-in">
          <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-brand-500 text-white rounded text-[10px] font-bold uppercase">
                  Filtered View
                </span>
                <h3 className="font-extrabold text-base text-zinc-900">
                  {activeCardFilter === 'TODAY' && `Today's Active / Scheduled Leaves (${cardFilteredLeaves.length})`}
                  {activeCardFilter === 'THIS_WEEK' && `Leaves Applied for This Week (${cardFilteredLeaves.length})`}
                  {activeCardFilter === 'NEXT_WEEK' && `Leaves Applied for Next Week (${cardFilteredLeaves.length})`}
                  {activeCardFilter === 'THIS_MONTH' && `Leaves Applied for Current Month (${cardFilteredLeaves.length})`}
                  {activeCardFilter === 'PENDING' && `Approval Pending Leaves Queue (${cardFilteredLeaves.length})`}
                </h3>
              </div>
              <p className="text-xs text-zinc-500 mt-0.5">
                {activeCardFilter === 'TODAY'
                  ? "Showing all team members whose approved or active leave covers today's date."
                  : activeCardFilter === 'PENDING'
                  ? 'Review and approve/reject pending team member leave applications directly from this list.'
                  : 'Displaying leave applications covering selected period.'}
              </p>
            </div>

            <button
              onClick={() => setActiveCardFilter(null)}
              className="px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              <span>Clear Filter</span>
            </button>
          </div>

          {cardFilteredLeaves.length === 0 ? (
            <div className="p-8 text-center text-zinc-400 space-y-2">
              <Calendar className="w-8 h-8 mx-auto text-zinc-300" />
              <p className="text-xs font-medium">No leave applications found for this filter.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-100/80 border-b border-zinc-200 text-zinc-600 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="p-3">Employee</th>
                    <th className="p-3">Leave Type</th>
                    <th className="p-3">Dates & Days</th>
                    <th className="p-3">Reason & Handover</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Approver</th>
                    <th className="p-3 text-right">Quick Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {cardFilteredLeaves.map((l) => {
                    const isPending = l.status === 'PENDING';
                    const canApprove = isSeniorApprover && isPending;

                    return (
                      <tr key={l.id} className="hover:bg-zinc-50/80 transition-colors">
                        <td className="p-3">
                          <div className="flex items-center space-x-2.5">
                            <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 font-bold flex items-center justify-center text-xs">
                              {l.userName.substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-bold text-zinc-900">{l.userName}</p>
                              <span className="text-[10px] text-zinc-400 font-normal">{l.userRole.replace('_', ' ')}</span>
                            </div>
                          </div>
                        </td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-zinc-200 text-zinc-800">
                            {l.leaveType}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className="font-bold text-zinc-900">{l.days} Day(s)</span>
                          <p className="text-[10px] text-zinc-400 font-mono">{formatDate(l.startDate)} ➔ {formatDate(l.endDate)}</p>
                        </td>
                        <td className="p-3 max-w-xs">
                          <p className="text-zinc-700 font-medium truncate">{l.reason}</p>
                          {l.workInAbsence && (
                            <p className="text-[10px] text-brand-600 font-semibold mt-0.5">
                              Handover: {l.workInAbsence}
                            </p>
                          )}
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            l.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' :
                            l.status === 'REJECTED' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {l.status}
                          </span>
                        </td>
                        <td className="p-3 text-zinc-500 font-medium text-[11px]">
                          {l.approverName || 'Pending Hierarchy Review'}
                        </td>
                        <td className="p-3 text-right">
                          {canApprove ? (
                            <div className="flex items-center justify-end space-x-1.5">
                              <button
                                onClick={() => reviewLeave(l.id, 'APPROVED')}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs cursor-pointer flex items-center gap-1 shadow-2xs transition-all"
                              >
                                <Check className="w-3 h-3" /> Approve
                              </button>
                              <button
                                onClick={() => openRejectionModal(l)}
                                className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg text-xs cursor-pointer flex items-center gap-1 shadow-2xs transition-all"
                              >
                                <X className="w-3 h-3" /> Reject
                              </button>
                            </div>
                          ) : (
                            <span className="text-zinc-400 text-[11px] italic">No pending action</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="border-b border-zinc-200 flex items-center space-x-6 text-xs font-bold">
        <button
          onClick={() => { setActiveTab('applications'); setActiveCardFilter(null); }}
          className={`pb-3 border-b-2 cursor-pointer transition-colors ${
            activeTab === 'applications' ? 'border-brand-500 text-brand-600 font-extrabold' : 'border-transparent text-zinc-500 hover:text-zinc-900'
          }`}
        >
          All Applications ({visibleApplications.length})
        </button>

        {isSeniorApprover && (
          <button
            onClick={() => { setActiveTab('approvals'); setActiveCardFilter(null); }}
            className={`pb-3 border-b-2 cursor-pointer transition-colors flex items-center space-x-1.5 ${
              activeTab === 'approvals' ? 'border-brand-500 text-brand-600 font-extrabold' : 'border-transparent text-zinc-500 hover:text-zinc-900'
            }`}
          >
            <span>Hierarchy Approvals Queue</span>
            {pendingApprovals.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-mono">
                {pendingApprovals.length}
              </span>
            )}
          </button>
        )}

        <button
          onClick={() => { setActiveTab('comp-off'); setActiveCardFilter(null); }}
          className={`pb-3 border-b-2 cursor-pointer transition-colors ${
            activeTab === 'comp-off' ? 'border-brand-500 text-brand-600 font-extrabold' : 'border-transparent text-zinc-500 hover:text-zinc-900'
          }`}
        >
          Comp-Off Claims ({compOffRequests.length})
        </button>

        {isAdminOrHR && (
          <button
            onClick={() => { setActiveTab('credits'); setActiveCardFilter(null); }}
            className={`pb-3 border-b-2 cursor-pointer transition-colors flex items-center space-x-1.5 ${
              activeTab === 'credits' ? 'border-brand-500 text-brand-600 font-extrabold' : 'border-transparent text-zinc-500 hover:text-zinc-900'
            }`}
          >
            <Gift className="w-3.5 h-3.5 text-emerald-600" />
            <span>Credit Paid Leave Log ({paidLeaveCredits.length})</span>
          </button>
        )}

        <button
          onClick={() => { setActiveTab('rules'); setActiveCardFilter(null); }}
          className={`pb-3 border-b-2 cursor-pointer transition-colors ${
            activeTab === 'rules' ? 'border-brand-500 text-brand-600 font-extrabold' : 'border-transparent text-zinc-500 hover:text-zinc-900'
          }`}
        >
          Policy Rules ({leaveRules.length})
        </button>

        {isSuperAdmin && (
          <button
            onClick={() => { setActiveTab('audit'); setActiveCardFilter(null); }}
            className={`pb-3 border-b-2 cursor-pointer transition-colors flex items-center space-x-1 ${
              activeTab === 'audit' ? 'border-brand-500 text-brand-600 font-extrabold' : 'border-transparent text-zinc-500 hover:text-zinc-900'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
            <span>Soft-Deleted Audit ({softDeletedApplications.length})</span>
          </button>
        )}
      </div>

      {/* TAB 1: All Active Applications */}
      {activeTab === 'applications' && (
        <div className="card-clean overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-100 border-b border-zinc-200 text-zinc-500 font-bold uppercase tracking-wider">
              <tr>
                {!isRegularEmployee && <th className="p-3">Applicant Employee</th>}
                <th className="p-3">Leave Type</th>
                <th className="p-3">Duration & Dates</th>
                <th className="p-3">Reason & Handover</th>
                <th className="p-3">Status</th>
                <th className="p-3">Approver / Verified</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {visibleApplications.map((l) => {
                const isOwner = l.userId === currentUser.id;
                const canEdit = isOwner ? l.status === 'PENDING' : isSeniorApprover;
                const canSoftDelete = isSeniorApprover;

                return (
                  <tr key={l.id} className="hover:bg-zinc-50/80 transition-colors">
                    {!isRegularEmployee && (
                      <td className="p-3 font-bold text-zinc-900">
                        <div>
                          <p>{l.userName}</p>
                          <span className="text-[10px] text-zinc-400 font-normal">{l.userRole.replace('_', ' ')}</span>
                        </div>
                      </td>
                    )}
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-zinc-200 text-zinc-800">
                        {l.leaveType}
                      </span>
                    </td>
                    <td className="p-3 font-medium">
                      {l.days} Day(s) <span className="text-zinc-400 font-mono">({formatDate(l.startDate)} - {formatDate(l.endDate)})</span>
                    </td>
                    <td className="p-3 text-zinc-600 max-w-xs">
                      <p className="truncate">{l.reason}</p>
                      {l.workInAbsence && (
                        <p className="text-[10px] text-brand-600 font-semibold mt-0.5">
                          Handover: {l.workInAbsence}
                        </p>
                      )}
                    </td>
                    <td className="p-3">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        l.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' :
                        l.status === 'REJECTED' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {l.status}
                      </span>
                    </td>
                    <td className="p-3 text-zinc-500 font-medium">{l.approverName || 'Awaiting Hierarchy Review'}</td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end space-x-1">
                        {canEdit && (
                          <button
                            onClick={() => {
                              setLeaveType(l.leaveType);
                              setStartDate(l.startDate);
                              setEndDate(l.endDate);
                              setReason(l.reason);
                              setWorkInAbsence(l.workInAbsence || '');
                              setShowEditModal(l);
                            }}
                            className="p-1.5 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg cursor-pointer"
                            title="Edit Application"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {canSoftDelete && (
                          <button
                            onClick={() => softDeleteLeave(l.id)}
                            className="p-1.5 text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg cursor-pointer"
                            title="Soft Delete Application"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 2: Hierarchy Approvals Queue */}
      {activeTab === 'approvals' && (
        <div className="card-clean p-5 space-y-4">
          <div className="border-b border-zinc-100 pb-3">
            <h3 className="font-bold text-sm text-zinc-900 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-brand-500" /> Hierarchy Leave Approval Queue
            </h3>
            <p className="text-xs text-zinc-500">
              Team Leaders approve team members' leaves. Super Admin & HR approve individual staff and finalize queue.
            </p>
          </div>

          <div className="space-y-3">
            {pendingApprovals.length === 0 ? (
              <p className="text-xs text-zinc-400 py-8 text-center">No pending leave applications in your hierarchy queue.</p>
            ) : (
              pendingApprovals.map((l) => (
                <div key={l.id} className="p-4 bg-zinc-50 border border-zinc-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-zinc-900 text-sm">{l.userName}</span>
                      <span className="text-[10px] bg-obsidian-950 text-white px-2 py-0.5 rounded font-bold">{l.userRole}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                        {l.leaveType} LEAVE
                      </span>
                    </div>
                    <p className="text-xs text-zinc-600">
                      <strong>Dates:</strong> {formatDate(l.startDate)} ➔ {formatDate(l.endDate)} ({l.days} Days) • <strong>Applied On:</strong> {formatDate(l.appliedOn)}
                    </p>
                    <p className="text-xs text-zinc-700 bg-white p-2 rounded border border-zinc-200/60 mt-1">
                      <strong>Reason:</strong> {l.reason}
                    </p>
                    {l.workInAbsence && (
                      <p className="text-xs text-brand-700 font-semibold">
                        👤 <strong>Work Handover Person:</strong> {l.workInAbsence}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center space-x-2 flex-shrink-0">
                    <button
                      onClick={() => reviewLeave(l.id, 'APPROVED')}
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs cursor-pointer flex items-center gap-1 shadow-2xs transition-all"
                    >
                      <Check className="w-3.5 h-3.5" /> Approve Leave
                    </button>
                    <button
                      onClick={() => openRejectionModal(l)}
                      className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs cursor-pointer flex items-center gap-1 shadow-2xs transition-all"
                    >
                      <X className="w-3.5 h-3.5" /> Reject
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 3: Comp-Off Claims */}
      {activeTab === 'comp-off' && (
        <div className="card-clean p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
            <div>
              <h3 className="font-bold text-sm text-zinc-900 flex items-center gap-2">
                <Award className="w-4 h-4 text-brand-500" /> Weekend & Holiday Comp-Off Claims
              </h3>
              <p className="text-xs text-zinc-500">Claims submitted for extra work on Sundays or Company Holidays.</p>
            </div>
            <button
              onClick={() => {
                setFormError('');
                setCompEmployeeId(currentUser.id);
                setCompDays(1);
                setHoursWorked(8);
                setCompStatus('PENDING');
                setShowCompOffModal(true);
              }}
              className="px-3.5 py-1.5 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-xs font-bold shadow-glow-orange cursor-pointer flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Claim Comp-Off</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-100 border-b border-zinc-200 text-zinc-500 font-bold uppercase tracking-wider">
                <tr>
                  {!isRegularEmployee && <th className="p-3">Employee</th>}
                  <th className="p-3">Work Date</th>
                  <th className="p-3">Hours Worked</th>
                  <th className="p-3">Comp-Off Days</th>
                  <th className="p-3">Project Worked On</th>
                  <th className="p-3">Reason / Comments</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Review Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {visibleCompOffRequests.map((co) => {
                  const isPending = co.status === 'PENDING';
                  const isTLApproved = co.status === 'APPROVED_BY_TL';
                  const canTLReview = isTeamLead && isPending;
                  const canAdminApprove = isAdminOrHR && (isPending || isTLApproved);

                  return (
                    <tr key={co.id} className="hover:bg-zinc-50/80 transition-colors">
                      {!isRegularEmployee && <td className="p-3 font-bold text-zinc-900">{co.userName}</td>}
                      <td className="p-3 font-semibold text-zinc-700">{formatDate(co.workDate)}</td>
                      <td className="p-3 font-mono">{co.hoursWorked} hrs</td>
                      <td className="p-3 font-bold text-emerald-700">+{co.convertedDays} Day(s)</td>
                      <td className="p-3 font-semibold text-zinc-800">{co.projectWorkedOn}</td>
                      <td className="p-3 text-zinc-600 max-w-xs truncate">{co.reason}</td>
                      <td className="p-3">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          co.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' :
                          co.status === 'APPROVED_BY_TL' ? 'bg-blue-100 text-blue-800' :
                          co.status === 'REJECTED' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {co.status === 'APPROVED_BY_TL' ? 'TL Recommended' : co.status}
                        </span>
                      </td>
                      <td className="p-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end space-x-1.5">
                          {canAdminApprove ? (
                            <>
                              <button
                                onClick={() => reviewCompOff(co.id, 'APPROVED')}
                                className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-[11px] cursor-pointer shadow-2xs"
                                title="Approve Comp-Off"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => reviewCompOff(co.id, 'REJECTED')}
                                className="px-2 py-1 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg text-[11px] cursor-pointer shadow-2xs"
                                title="Reject Comp-Off"
                              >
                                Reject
                              </button>
                            </>
                          ) : canTLReview ? (
                            <>
                              <button
                                onClick={() => reviewCompOff(co.id, 'APPROVED_BY_TL')}
                                className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-[11px] cursor-pointer shadow-2xs"
                                title="Recommend Comp-Off"
                              >
                                Recommend
                              </button>
                              <button
                                onClick={() => reviewCompOff(co.id, 'REJECTED')}
                                className="px-2 py-1 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg text-[11px] cursor-pointer shadow-2xs"
                                title="Reject Comp-Off"
                              >
                                Reject
                              </button>
                            </>
                          ) : null}

                          {/* Edit & Delete Actions for Super Admin / Admin / Owner */}
                          {(isSuperAdmin || isAdminOrHR || (co.userId === currentUser.id && isPending)) && (
                            <>
                              <button
                                onClick={() => {
                                  setEditCompWorkDate(co.workDate);
                                  setEditCompHours(co.hoursWorked);
                                  setEditCompDays(co.convertedDays);
                                  setEditCompReason(co.reason);
                                  setEditCompProject(co.projectWorkedOn);
                                  setEditCompStatus(co.status);
                                  setShowEditCompOffModal(co);
                                }}
                                className="p-1 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg cursor-pointer transition-colors"
                                title="Edit Comp-Off Request"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={() => {
                                  if (confirm(`Are you sure you want to delete the Comp-Off claim for ${co.userName} (${formatDate(co.workDate)})?`)) {
                                    deleteCompOff(co.id);
                                  }
                                }}
                                className="p-1 text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg cursor-pointer transition-colors"
                                title="Delete Comp-Off Request"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: Paid Leave Credits History & Audit Log */}
      {activeTab === 'credits' && isAdminOrHR && (
        <div className="card-clean p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
            <div>
              <h3 className="font-bold text-sm text-zinc-900 flex items-center gap-2">
                <Gift className="w-4 h-4 text-emerald-600" /> Credit Paid Leave Log & History
              </h3>
              <p className="text-xs text-zinc-500">
                Audit trail of all individual and group paid leave balance credits with edit and deletion controls.
              </p>
            </div>
            <button
              onClick={() => setShowCreditModal(true)}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm cursor-pointer flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Credit Paid Leave</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-100 border-b border-zinc-200 text-zinc-500 font-bold uppercase tracking-wider">
                <tr>
                  <th className="p-3">Credited Date</th>
                  <th className="p-3">Employee</th>
                  <th className="p-3">Days Credited</th>
                  <th className="p-3">Reason / Incentive Details</th>
                  <th className="p-3">Validity Window</th>
                  <th className="p-3">Credited By</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {paidLeaveCredits.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-zinc-400">
                      No paid leave credits recorded yet.
                    </td>
                  </tr>
                ) : (
                  paidLeaveCredits.map((credit) => (
                    <tr key={credit.id} className="hover:bg-zinc-50/80 transition-colors">
                      <td className="p-3 font-semibold text-zinc-700 whitespace-nowrap">
                        {formatDate(credit.creditedAt.split('T')[0])}
                      </td>
                      <td className="p-3 font-bold text-zinc-900 whitespace-nowrap">
                        {credit.userName}
                      </td>
                      <td className="p-3 font-black text-emerald-700 whitespace-nowrap">
                        +{credit.days} Day(s)
                      </td>
                      <td className="p-3 text-zinc-700 max-w-xs truncate" title={credit.reason}>
                        {credit.reason}
                      </td>
                      <td className="p-3 text-zinc-500 font-mono text-[11px] whitespace-nowrap">
                        {credit.validFrom && credit.validTo
                          ? `${formatDate(credit.validFrom)} ➔ ${formatDate(credit.validTo)}`
                          : 'Permanent Credit'}
                      </td>
                      <td className="p-3 text-zinc-600 text-[11px] whitespace-nowrap">
                        {credit.creditedBy}
                      </td>
                      <td className="p-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end space-x-1.5">
                          <button
                            onClick={() => {
                              setEditCreditDays(credit.days);
                              setEditCreditReason(credit.reason);
                              setEditCreditValidFrom(credit.validFrom || '');
                              setEditCreditValidTo(credit.validTo || '');
                              setShowEditCreditModal(credit);
                            }}
                            className="p-1.5 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg cursor-pointer transition-colors"
                            title="Edit Credit Details"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Are you sure you want to delete this credit of ${credit.days} day(s) for ${credit.userName}? This will reverse the user's paid leave balance.`)) {
                                deletePaidLeaveCredit(credit.id);
                              }
                            }}
                            className="p-1.5 text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg cursor-pointer transition-colors"
                            title="Delete Credit & Reverse Balance"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: Policy Rules */}
      {activeTab === 'rules' && (
        <div className="card-clean p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
            <div>
              <h3 className="font-bold text-sm text-zinc-900 flex items-center gap-2">
                <Settings className="w-4 h-4 text-brand-500" /> Company Leave Policy Master Rules
              </h3>
              <p className="text-xs text-zinc-500">Configured annual quotas and consecutive day ceilings.</p>
            </div>
            {isSuperAdmin && (
              <button
                onClick={() => setShowRuleModal(true)}
                className="px-3.5 py-1.5 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-xs font-bold shadow-glow-orange cursor-pointer flex items-center space-x-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Policy Rule</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {leaveRules
              .filter((rule) => rule.leaveType !== 'SICK' && rule.id !== 'rule-2')
              .map((rule) => {
                const isPaid = rule.leaveType === 'PAID';
                const daysPerYear = isPaid
                  ? (systemSettings.totalPaidLeavePerYear || rule.maxDaysPerYear)
                  : rule.maxDaysPerYear;

                const description = isPaid
                  ? 'Requires advance application minimum 3 days prior. This will combine SICK & CASUAL Leaves. Senior Team Leader or HR approval mandated.'
                  : rule.description;

                return (
                  <div key={rule.id} className="p-4 bg-zinc-50 border border-zinc-200 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 bg-brand-50 text-brand-700 border border-brand-200 rounded text-[10px] font-bold uppercase">
                        {rule.leaveType}
                      </span>
                      <span className="text-xs font-black text-zinc-800">{daysPerYear} Days/Year</span>
                    </div>
                    <h4 className="font-bold text-zinc-900 text-sm">{rule.title}</h4>
                    <p className="text-xs text-zinc-600">{description}</p>
                    <div className="pt-2 border-t border-zinc-200 text-[10px] text-zinc-500 space-y-0.5">
                      <p>• Max Consecutive Limit: <strong>3 Days</strong></p>
                      <p>• Advance Notice: <strong>5 Days</strong></p>
                      <p>• Carry Forward: <strong>Not Allowed</strong></p>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* TAB 5: Soft-Deleted Audit */}
      {activeTab === 'audit' && isSuperAdmin && (
        <div className="card-clean p-5 space-y-4 border-2 border-rose-500/20">
          <div className="border-b border-zinc-100 pb-3">
            <h3 className="font-bold text-sm text-zinc-900 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-500" /> Super Admin Soft-Deleted Audit Trail
            </h3>
            <p className="text-xs text-zinc-500">
              Soft-deleted records hidden from standard employee dashboards. Super Admin can restore or permanently delete.
            </p>
          </div>

          {softDeletedApplications.length === 0 ? (
            <p className="text-xs text-zinc-400 py-8 text-center">No soft-deleted records present.</p>
          ) : (
            <div className="space-y-3">
              {softDeletedApplications.map((l) => (
                <div key={l.id} className="p-3.5 bg-rose-50/50 border border-rose-200 rounded-xl flex items-center justify-between">
                  <div>
                    <p className="font-bold text-zinc-900 text-xs">
                      {l.userName} • <span className="text-rose-700">{l.leaveType} ({l.days} Days)</span>
                    </p>
                    <p className="text-[11px] text-zinc-500">Reason: {l.reason} • Soft-deleted by: {l.softDeletedBy}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => editLeave(l.id, { isSoftDeleted: false, softDeletedBy: undefined })}
                      className="px-3 py-1 bg-zinc-900 hover:bg-black text-white text-xs font-bold rounded-lg cursor-pointer"
                    >
                      Restore
                    </button>
                    <button
                      onClick={() => hardDeleteLeave(l.id)}
                      className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg cursor-pointer"
                    >
                      Hard Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODALS                                                                    */}
      {/* ========================================================================= */}

      {/* 1. Apply For Leave Modal (with "Who work in Absence" & Approval Routing) */}
      {showApplyModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <h3 className="font-bold text-base text-zinc-900 flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-brand-500" /> Apply For Leave
              </h3>
              <button onClick={() => setShowApplyModal(false)} className="text-zinc-400 hover:text-zinc-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Approval Routing Notice */}
            <div className="p-3 bg-brand-50 border border-brand-200/70 rounded-xl text-xs space-y-1">
              <p className="font-bold text-brand-900 flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-brand-600" /> Approval Routing:
              </p>
              {userTeam && teamLeader && teamLeader.id !== currentUser.id ? (
                <p className="text-brand-800 text-[11px]">
                  You belong to <strong>{userTeam.name}</strong>. Your leave application will be routed to Team Leader <strong>{teamLeader.name}</strong> for approval.
                </p>
              ) : (
                <p className="text-brand-800 text-[11px]">
                  Your leave application will be routed directly to <strong>Super Admin / HR</strong> for approval.
                </p>
              )}
            </div>

            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleApplyLeave} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-zinc-700 block mb-1">Leave Category / Type *</label>
                <select
                  value={leaveType}
                  onChange={(e) => setLeaveType(e.target.value as LeaveType)}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-xl focus:border-brand-500 bg-white font-medium"
                >
                  <option value="PAID">Paid Leave ({currentUser.leaveBalance?.paid ?? 0} Available)</option>
                  <option value="COMP_OFF">Comp-Off ({currentUser.leaveBalance?.compOff ?? 0} Available)</option>
                  <option value="UNPAID">Unpaid Leave</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-zinc-700 block mb-1">Start Date *</label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 border border-zinc-200 rounded-xl focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-zinc-700 block mb-1">End Date *</label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 border border-zinc-200 rounded-xl focus:border-brand-500"
                  />
                </div>
              </div>

              {/* NEW FIELD: Who work in Absence */}
              <div>
                <label className="font-bold text-zinc-700 block mb-1 flex items-center justify-between">
                  <span>Who work in Absence (Handover Person) *</span>
                  <span className="text-[10px] text-zinc-400 font-normal">Colleague managing duties</span>
                </label>
                <div className="space-y-1.5">
                  <select
                    value={workInAbsence}
                    onChange={(e) => setWorkInAbsence(e.target.value)}
                    className="w-full px-3 py-2 border border-zinc-200 rounded-xl focus:border-brand-500 bg-white font-medium text-xs"
                  >
                    <option value="">-- Select Colleague from Staff List --</option>
                    {users.filter(u => u.id !== currentUser.id).map(u => (
                      <option key={u.id} value={`${u.name} (${u.title})`}>
                        {u.name} • {u.title} ({u.role.replace('_', ' ')})
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    placeholder="Or type custom colleague name / handover details"
                    value={workInAbsence}
                    onChange={(e) => setWorkInAbsence(e.target.value)}
                    className="w-full px-3 py-2 border border-zinc-200 rounded-xl focus:border-brand-500 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-zinc-700 block mb-1">Reason for Leave *</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Provide rationale for leave request..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-xl focus:border-brand-500"
                />
              </div>

              <div className="pt-3 border-t border-zinc-100 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowApplyModal(false)}
                  className="px-4 py-2 text-zinc-600 hover:bg-zinc-100 rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-xl shadow-glow-orange cursor-pointer flex items-center gap-1.5"
                >
                  <CalendarDays className="w-4 h-4" />
                  <span>Submit Application</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Edit Leave Application Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <h3 className="font-bold text-base text-zinc-900 flex items-center gap-2">
                <Edit className="w-5 h-5 text-brand-500" /> Edit Leave Application
              </h3>
              <button onClick={() => setShowEditModal(null)} className="text-zinc-400 hover:text-zinc-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditLeaveSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-zinc-700 block mb-1">Leave Category / Type</label>
                <select
                  value={leaveType}
                  onChange={(e) => setLeaveType(e.target.value as LeaveType)}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-xl focus:border-brand-500 bg-white"
                >
                  <option value="PAID">Paid Leave ({currentUser.leaveBalance?.paid ?? 0} Available)</option>
                  <option value="COMP_OFF">Comp-Off ({currentUser.leaveBalance?.compOff ?? 0} Available)</option>
                  <option value="UNPAID">Unpaid Leave</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-zinc-700 block mb-1">Start Date</label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 border border-zinc-200 rounded-xl focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-zinc-700 block mb-1">End Date</label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 border border-zinc-200 rounded-xl focus:border-brand-500"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-zinc-700 block mb-1">Handover Person (Who work in Absence)</label>
                <input
                  type="text"
                  value={workInAbsence}
                  onChange={(e) => setWorkInAbsence(e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-xl focus:border-brand-500"
                />
              </div>

              <div>
                <label className="font-bold text-zinc-700 block mb-1">Reason</label>
                <textarea
                  rows={2}
                  required
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-xl focus:border-brand-500"
                />
              </div>

              <div className="pt-3 border-t border-zinc-100 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowEditModal(null)}
                  className="px-4 py-2 text-zinc-600 hover:bg-zinc-100 rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-xl shadow-glow-orange cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Credit Paid Leave Modal (with Duration From/To & Probation Filter) */}
      {showCreditModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <h3 className="font-bold text-base text-zinc-900 flex items-center gap-2">
                <Gift className="w-5 h-5 text-emerald-600" /> Credit Paid Leave (Individual / Group)
              </h3>
              <button onClick={() => setShowCreditModal(false)} className="text-zinc-400 hover:text-zinc-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreditLeave} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-zinc-700 block mb-1">Target Beneficiary *</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setCreditTarget('individual')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold cursor-pointer transition-all ${
                      creditTarget === 'individual'
                        ? 'bg-brand-50 border-brand-500 text-brand-700 ring-1 ring-brand-500'
                        : 'bg-zinc-50 border-zinc-200 text-zinc-600 hover:bg-zinc-100'
                    }`}
                  >
                    Select Individual(s)
                  </button>
                  <button
                    type="button"
                    onClick={() => setCreditTarget('group')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold cursor-pointer transition-all ${
                      creditTarget === 'group'
                        ? 'bg-brand-50 border-brand-500 text-brand-700 ring-1 ring-brand-500'
                        : 'bg-zinc-50 border-zinc-200 text-zinc-600 hover:bg-zinc-100'
                    }`}
                  >
                    All Staff (Group with Filters)
                  </button>
                </div>
              </div>

              {creditTarget === 'individual' ? (
                <div>
                  <label className="font-bold text-zinc-700 block mb-1">Select Employee(s)</label>
                  <select
                    multiple
                    value={selectedUserIds}
                    onChange={(e) => setSelectedUserIds(Array.from(e.target.selectedOptions, option => option.value))}
                    className="w-full px-3 py-2 border border-zinc-200 rounded-xl focus:border-brand-500 bg-white h-28"
                  >
                    {users.map(u => (
                      <option key={u.id} value={u.id}>{u.name} ({u.title})</option>
                    ))}
                  </select>
                  <p className="text-[10px] text-zinc-400 mt-1">Hold Ctrl / Cmd to select multiple employees</p>
                </div>
              ) : (
                /* ALL STAFF GROUP PROBATION FILTER */
                <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl space-y-2">
                  <span className="font-bold text-zinc-800 text-[11px] block">
                    Probation Completion Filter Criteria
                  </span>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-bold text-zinc-600 block mb-1">Condition Operator</label>
                      <select
                        value={probationCondition}
                        onChange={(e) => setProbationCondition(e.target.value as any)}
                        className="w-full px-2.5 py-1.5 border border-zinc-200 rounded-lg text-xs font-semibold bg-white"
                      >
                        <option value="ALL">ALL (Ignore Probation)</option>
                        <option value="LESS_THAN">&lt; Completed Before Cutoff</option>
                        <option value="GREATER_THAN">&gt; Completing After Cutoff</option>
                        <option value="GREATER_EQUAL">&gt;= Completed on/after Cutoff</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-zinc-600 block mb-1">Probation Cutoff Date</label>
                      <input
                        type="date"
                        value={probationCutoffDate}
                        onChange={(e) => setProbationCutoffDate(e.target.value)}
                        className="w-full px-2.5 py-1.5 border border-zinc-200 rounded-lg text-xs bg-white"
                      />
                    </div>
                  </div>

                  <div className="p-2 bg-emerald-50 text-emerald-800 rounded-lg font-semibold text-[11px] flex items-center justify-between">
                    <span>Eligible Employees:</span>
                    <span className="font-bold font-mono text-xs">{eligibleProbationStaff.length} / {users.length} Staff</span>
                  </div>
                </div>
              )}

              {/* DURATION FROM / TO */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-zinc-700 block mb-1">Duration From (Validity Start) *</label>
                  <input
                    type="date"
                    required
                    value={creditValidFrom}
                    onChange={(e) => setCreditValidFrom(e.target.value)}
                    className="w-full px-3 py-2 border border-zinc-200 rounded-xl focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-zinc-700 block mb-1">Duration To (Validity End) *</label>
                  <input
                    type="date"
                    required
                    value={creditValidTo}
                    onChange={(e) => setCreditValidTo(e.target.value)}
                    className="w-full px-3 py-2 border border-zinc-200 rounded-xl focus:border-brand-500"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-zinc-700 block mb-1">Number of Days to Credit *</label>
                <input
                  type="number"
                  min={1}
                  max={30}
                  required
                  value={creditDays}
                  onChange={(e) => setCreditDays(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-xl focus:border-brand-500 font-bold"
                />
              </div>

              <div>
                <label className="font-bold text-zinc-700 block mb-1">Credit Reason / Rationale</label>
                <input
                  type="text"
                  required
                  value={creditReason}
                  onChange={(e) => setCreditReason(e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-xl focus:border-brand-500"
                />
              </div>

              <div className="pt-3 border-t border-zinc-100 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowCreditModal(false)}
                  className="px-4 py-2 text-zinc-600 hover:bg-zinc-100 rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-sm cursor-pointer flex items-center gap-1.5"
                >
                  <Gift className="w-4 h-4" />
                  <span>Credit Paid Leaves</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Weekend / Holiday Comp-Off Claim Modal (Exact Requested Fields) */}
      {showCompOffModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <h3 className="font-bold text-base text-zinc-900 flex items-center gap-2">
                <Award className="w-5 h-5 text-brand-500" /> Weekend / Holiday Comp-Off Claim
              </h3>
              <button onClick={() => setShowCompOffModal(false)} className="text-zinc-400 hover:text-zinc-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Approval Hierarchy notice */}
            <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl text-[11px] text-zinc-600 space-y-1">
              <p className="font-bold text-zinc-800">Comp-Off Approval Workflow:</p>
              <p>• If applicant is in a team, Team Leader can recommend/review and Super Admin / HR gives final approval.</p>
              <p>• If applicant is individual (not in a team), Super Admin will approve/reject directly.</p>
            </div>

            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCompOffSubmit} className="space-y-3 text-xs">
              
              {/* Field 1: Select Employee (list of employees) */}
              <div>
                <label className="font-bold text-zinc-700 block mb-1">Select Employee *</label>
                <select
                  disabled={!isSeniorApprover}
                  value={compEmployeeId}
                  onChange={(e) => setCompEmployeeId(e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-xl focus:border-brand-500 bg-white font-medium disabled:bg-zinc-100"
                >
                  {users.map(u => (
                    <option key={u.id} value={u.id}>{u.name} ({u.title})</option>
                  ))}
                </select>
              </div>

              {/* Field 2: Work Date (calendar) */}
              <div>
                <label className="font-bold text-zinc-700 block mb-1">Work Date * (Sunday / Holiday)</label>
                <input
                  type="date"
                  required
                  value={workDate}
                  onChange={(e) => setWorkDate(e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-xl focus:border-brand-500"
                />
              </div>

              {/* Field 3: Worked Hrs (list box with 1 to 12 hrs) */}
              <div>
                <label className="font-bold text-zinc-700 block mb-1">Worked Hrs * (1 to 12 hrs)</label>
                <select
                  value={hoursWorked}
                  onChange={(e) => {
                    const hrs = Number(e.target.value);
                    setHoursWorked(hrs);
                    setCompDays(hrs >= 8 ? 1 : 0.5);
                  }}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-xl focus:border-brand-500 bg-white font-medium"
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map(h => (
                    <option key={h} value={h}>{h} {h === 1 ? 'Hour' : 'Hours'} ({h >= 8 ? 'Full Day Credit' : 'Half Day Credit'})</option>
                  ))}
                </select>
              </div>

              {/* Field 4: Compo Leave (input in days) */}
              <div>
                <label className="font-bold text-zinc-700 block mb-1">Compo Leave (in Days) *</label>
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  max="5"
                  required
                  value={compDays}
                  onChange={(e) => setCompDays(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-xl focus:border-brand-500 font-bold"
                />
              </div>

              {/* Field 5: Work for project (list of projects) */}
              <div>
                <label className="font-bold text-zinc-700 block mb-1">Work for Project *</label>
                <select
                  value={projectWorkedOn}
                  onChange={(e) => setProjectWorkedOn(e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-xl focus:border-brand-500 bg-white font-medium"
                >
                  {projects.map(p => (
                    <option key={p.id} value={p.name}>{p.name} ({p.clientName})</option>
                  ))}
                </select>
              </div>

              {/* Field 6: Comments (Textarea box) */}
              <div>
                <label className="font-bold text-zinc-700 block mb-1">Comments / Work Details *</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Describe extra weekend or holiday tasks completed..."
                  value={compReason}
                  onChange={(e) => setCompReason(e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-xl focus:border-brand-500"
                />
              </div>

              {/* Field 7: Status (List box: Approve / Disapprove / Reject) */}
              <div>
                <label className="font-bold text-zinc-700 block mb-1">Claim Status</label>
                <select
                  disabled={!isSeniorApprover}
                  value={compStatus}
                  onChange={(e) => setCompStatus(e.target.value as any)}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-xl focus:border-brand-500 bg-white font-bold disabled:bg-zinc-100"
                >
                  <option value="PENDING">PENDING (Awaiting Review)</option>
                  <option value="APPROVED_BY_TL">APPROVED_BY_TL (TL Recommended)</option>
                  <option value="APPROVED">APPROVED (Final Approved)</option>
                  <option value="REJECTED">REJECTED (Disapproved)</option>
                </select>
              </div>

              <div className="pt-3 border-t border-zinc-100 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowCompOffModal(false)}
                  className="px-4 py-2 text-zinc-600 hover:bg-zinc-100 rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-xl shadow-glow-orange cursor-pointer flex items-center gap-1.5"
                >
                  <Award className="w-4 h-4" />
                  <span>Submit Comp-Off Claim</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Policy Rule Modal */}
      {showRuleModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <h3 className="font-bold text-base text-zinc-900">Add Policy Rule</h3>
              <button onClick={() => setShowRuleModal(false)} className="text-zinc-400 hover:text-zinc-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRule} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-zinc-700 block mb-1">Rule Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Annual Privilege Leave Policy"
                  value={ruleTitle}
                  onChange={(e) => setRuleTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-xl focus:border-brand-500"
                />
              </div>

              <div>
                <label className="font-bold text-zinc-700 block mb-1">Leave Type</label>
                <select
                  value={ruleType}
                  onChange={(e) => setRuleType(e.target.value as LeaveType)}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-xl focus:border-brand-500 bg-white"
                >
                  <option value="PAID">Paid Leave</option>
                  <option value="COMP_OFF">Comp-Off</option>
                  <option value="UNPAID">Unpaid Leave</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-zinc-700 block mb-1">Max Days / Year</label>
                  <input
                    type="number"
                    value={ruleMaxDays}
                    onChange={(e) => setRuleMaxDays(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-zinc-200 rounded-xl focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-zinc-700 block mb-1">Notice Days</label>
                  <input
                    type="number"
                    value={ruleNoticeDays}
                    onChange={(e) => setRuleNoticeDays(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-zinc-200 rounded-xl focus:border-brand-500"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-zinc-700 block mb-1">Description</label>
                <textarea
                  rows={2}
                  value={ruleDesc}
                  onChange={(e) => setRuleDesc(e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-xl focus:border-brand-500"
                />
              </div>

              <div className="pt-3 border-t border-zinc-100 flex justify-end space-x-2">
                <button type="button" onClick={() => setShowRuleModal(false)} className="px-4 py-2 text-zinc-600 hover:bg-zinc-100 rounded-xl font-bold cursor-pointer">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-brand-500 text-white font-bold rounded-xl cursor-pointer">
                  Save Rule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Leave Rejection Reason Modal */}
      {rejectionModalLeave && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <h3 className="font-bold text-base text-rose-700 flex items-center gap-2">
                <XCircle className="w-5 h-5 text-rose-600" /> Reject Leave Application
              </h3>
              <button onClick={() => setRejectionModalLeave(null)} className="text-zinc-400 hover:text-zinc-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-zinc-600">
                Rejecting application for <strong>{rejectionModalLeave.userName}</strong> ({formatDate(rejectionModalLeave.startDate)} to {formatDate(rejectionModalLeave.endDate)}).
              </p>

              <div>
                <label className="font-bold text-zinc-700 block mb-1">Reason for Rejection *</label>
                <textarea
                  rows={3}
                  required
                  value={rejectionReasonInput}
                  onChange={(e) => setRejectionReasonInput(e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-xl focus:border-rose-500"
                />
              </div>

              <div className="pt-3 border-t border-zinc-100 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setRejectionModalLeave(null)}
                  className="px-4 py-2 text-zinc-600 hover:bg-zinc-100 rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmRejection}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl cursor-pointer"
                >
                  Confirm Rejection
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 7. Edit Comp-Off Request Modal */}
      {showEditCompOffModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <h3 className="font-bold text-base text-zinc-900 flex items-center gap-2">
                <Edit className="w-5 h-5 text-brand-500" /> Edit Comp-Off Request
              </h3>
              <button onClick={() => setShowEditCompOffModal(null)} className="text-zinc-400 hover:text-zinc-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditCompOff} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-zinc-700 block mb-1">Employee</label>
                <input
                  type="text"
                  disabled
                  value={showEditCompOffModal.userName}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-xl bg-zinc-100 font-bold text-zinc-700 cursor-not-allowed"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-zinc-700 block mb-1">Work Date *</label>
                  <input
                    type="date"
                    required
                    value={editCompWorkDate}
                    onChange={(e) => setEditCompWorkDate(e.target.value)}
                    className="w-full px-3 py-2 border border-zinc-200 rounded-xl focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-zinc-700 block mb-1">Hours Worked *</label>
                  <input
                    type="number"
                    min={1}
                    max={24}
                    required
                    value={editCompHours}
                    onChange={(e) => {
                      const h = Number(e.target.value);
                      setEditCompHours(h);
                      setEditCompDays(Math.max(1, Math.floor(h / 8)));
                    }}
                    className="w-full px-3 py-2 border border-zinc-200 rounded-xl focus:border-brand-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-zinc-700 block mb-1">Converted Days *</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    required
                    value={editCompDays}
                    onChange={(e) => setEditCompDays(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-zinc-200 rounded-xl focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-zinc-700 block mb-1">Status *</label>
                  <select
                    value={editCompStatus}
                    onChange={(e) => setEditCompStatus(e.target.value as CompOffRequest['status'])}
                    className="w-full px-3 py-2 border border-zinc-200 rounded-xl focus:border-brand-500 bg-white font-bold"
                  >
                    <option value="PENDING">PENDING</option>
                    <option value="APPROVED_BY_TL">APPROVED_BY_TL</option>
                    <option value="APPROVED">APPROVED</option>
                    <option value="REJECTED">REJECTED</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-zinc-700 block mb-1">Project Worked On *</label>
                <input
                  type="text"
                  required
                  value={editCompProject}
                  onChange={(e) => setEditCompProject(e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-xl focus:border-brand-500"
                />
              </div>

              <div>
                <label className="font-bold text-zinc-700 block mb-1">Reason / Comments *</label>
                <textarea
                  rows={2}
                  required
                  value={editCompReason}
                  onChange={(e) => setEditCompReason(e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-xl focus:border-brand-500"
                />
              </div>

              <div className="pt-3 border-t border-zinc-100 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowEditCompOffModal(null)}
                  className="px-4 py-2 text-zinc-600 hover:bg-zinc-100 rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-xl shadow-glow-orange cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 8. Edit Paid Leave Credit Modal */}
      {showEditCreditModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <h3 className="font-bold text-base text-zinc-900 flex items-center gap-2">
                <Edit className="w-5 h-5 text-emerald-600" /> Edit Paid Leave Credit
              </h3>
              <button onClick={() => setShowEditCreditModal(null)} className="text-zinc-400 hover:text-zinc-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditCredit} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-zinc-700 block mb-1">Employee</label>
                <input
                  type="text"
                  disabled
                  value={showEditCreditModal.userName}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-xl bg-zinc-100 font-bold text-zinc-700 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="font-bold text-zinc-700 block mb-1">Days Credited *</label>
                <input
                  type="number"
                  min={1}
                  max={60}
                  required
                  value={editCreditDays}
                  onChange={(e) => setEditCreditDays(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-xl focus:border-emerald-500 font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-zinc-700 block mb-1">Valid From</label>
                  <input
                    type="date"
                    value={editCreditValidFrom}
                    onChange={(e) => setEditCreditValidFrom(e.target.value)}
                    className="w-full px-3 py-2 border border-zinc-200 rounded-xl focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-zinc-700 block mb-1">Valid To</label>
                  <input
                    type="date"
                    value={editCreditValidTo}
                    onChange={(e) => setEditCreditValidTo(e.target.value)}
                    className="w-full px-3 py-2 border border-zinc-200 rounded-xl focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-zinc-700 block mb-1">Reason / Incentive Details *</label>
                <textarea
                  rows={2}
                  required
                  value={editCreditReason}
                  onChange={(e) => setEditCreditReason(e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-xl focus:border-emerald-500"
                />
              </div>

              <div className="pt-3 border-t border-zinc-100 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowEditCreditModal(null)}
                  className="px-4 py-2 text-zinc-600 hover:bg-zinc-100 rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-sm cursor-pointer"
                >
                  Save Credit Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

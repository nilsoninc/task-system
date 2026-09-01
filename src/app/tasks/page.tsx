'use client';

import React, { useState } from 'react';
import { useSystem } from '@/context/SystemContext';
import { Task, TaskPriority, TaskStatus, TaskAttachment } from '@/lib/types';
import { formatHoursDecimal, formatDate, formatDurationHuman, getTaskTotalSeconds } from '@/lib/utils';
import { SearchableSelect } from '@/components/common/SearchableSelect';
import { TaskDetailsModal } from '@/components/modals/TaskDetailsModal';
import { TaskEditModal } from '@/components/modals/TaskEditModal';
import { TaskWorklogModal } from '@/components/modals/TaskWorklogModal';
import {
  CheckSquare,
  Plus,
  Play,
  Square,
  Clock,
  Filter,
  Kanban,
  List,
  Users,
  X,
  UserCheck,
  AlertCircle,
  Paperclip,
  Trash2,
  RotateCcw,
  ShieldAlert,
  Calendar,
  FileText,
  Upload,
  AlertTriangle,
  LogIn,
  FolderKanban
} from 'lucide-react';

export default function TasksPage() {
  const {
    currentUser,
    myTeamMemberIds,
    tasks,
    projects,
    taskTypes,
    users,
    teams,
    addTask,
    assignTaskToTeam,
    assignTaskToAllMembers,
    updateTaskStatus,
    toggleTaskTimer,
    restoreTask,
    hardDeleteTask,
    isCheckedIn,
    toggleCheckIn
  } = useSystem();

  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [activeTab, setActiveTab] = useState<'active' | 'deleted'>('active');

  // Filters State
  const [filterTeam, setFilterTeam] = useState<string>('ALL');
  const [filterProject, setFilterProject] = useState<string>('ALL');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [filterAssignee, setFilterAssignee] = useState<string>('ALL');
  const [filterPriority, setFilterPriority] = useState<string>('ALL');

  // Modals & Selection State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCheckInAlert, setShowCheckInAlert] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [worklogTask, setWorklogTask] = useState<Task | null>(null);

  // Form State for Creating Task
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newProjectId, setNewProjectId] = useState(projects[0]?.id || '');
  const [newTypeId, setNewTypeId] = useState(taskTypes[0]?.id || '');
  const [assignScope, setAssignScope] = useState<'individual' | 'team' | 'all'>('individual');
  const [newAssigneeId, setNewAssigneeId] = useState(currentUser?.id || users[0]?.id || '');
  const [selectedTeamId, setSelectedTeamId] = useState(teams[0]?.id || '');
  const [newPriority, setNewPriority] = useState<TaskPriority>('HIGH');
  const [newEstHours, setNewEstHours] = useState(8);
  const [newStartDate, setNewStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [newDueDate, setNewDueDate] = useState('2026-08-30');
  const [attachments, setAttachments] = useState<TaskAttachment[]>([]);
  const [uploadFileName, setUploadFileName] = useState('');

  if (!currentUser) return null;

  const isSuperAdmin = currentUser.role === 'SUPER_ADMIN';
  const isAdminOrHR = currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'ADMIN_HR';
  const isTeamLead = currentUser.role === 'TEAM_LEADER';
  const isRegularEmployee = currentUser.role === 'EMPLOYEE';

  // Any running timer in system
  const runningTaskId = tasks.find(t => t.isTimerRunning)?.id;

  // Deleted tasks count (for Super Admin / TL tab)
  const deletedTasks = tasks.filter((t) => t.isSoftDeleted);

  // Filter active vs deleted tasks based on role visibility
  const baseTasks = activeTab === 'deleted'
    ? deletedTasks
    : tasks.filter((t) => !t.isSoftDeleted);

  const visibleTasks = baseTasks.filter((t) => {
    if (isAdminOrHR) return true;
    if (isTeamLead) return t.assigneeId === currentUser.id || myTeamMemberIds.includes(t.assigneeId || '');
    return t.assigneeId === currentUser.id;
  });

  const filteredTasks = visibleTasks.filter((t) => {
    if (filterProject !== 'ALL' && t.projectId !== filterProject) return false;
    if (filterType !== 'ALL' && t.typeId !== filterType) return false;
    if (!isRegularEmployee && filterAssignee !== 'ALL' && t.assigneeId !== filterAssignee) return false;
    if (filterPriority !== 'ALL' && t.priority !== filterPriority) return false;
    if (!isRegularEmployee && filterTeam !== 'ALL') {
      const selectedTeam = teams.find((tm) => tm.id === filterTeam);
      if (selectedTeam) {
        const teamUserIds = Array.from(new Set([...(selectedTeam.memberIds || []), selectedTeam.leaderId]));
        if (!teamUserIds.includes(t.assigneeId)) return false;
      }
    }
    return true;
  });

  // Sort tasks: Urgent & High first, then by due date
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    const priorityWeight: Record<string, number> = { URGENT: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
    const weightDiff = (priorityWeight[b.priority] || 0) - (priorityWeight[a.priority] || 0);
    if (weightDiff !== 0) return weightDiff;
    return a.dueDate.localeCompare(b.dueDate);
  });

  const handleStartStopClick = (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isCheckedIn && currentUser.role !== 'SUPER_ADMIN') {
      setShowCheckInAlert(true);
      return;
    }
    toggleTaskTimer(taskId);
  };

  const handleOpenCreateModal = () => {
    if (!isCheckedIn && currentUser.role !== 'SUPER_ADMIN') {
      setShowCheckInAlert(true);
      return;
    }
    setShowCreateModal(true);
  };

  const handleAddAttachment = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const files = Array.from(e.target.files);
    const newAtts: TaskAttachment[] = files.map((f, idx) => ({
      id: `att-${Date.now()}-${idx}`,
      name: f.name,
      size: `${(f.size / (1024 * 1024)).toFixed(2)} MB`,
      type: f.type || 'Document',
      uploadDate: new Date().toISOString().split('T')[0]
    }));
    setAttachments((prev) => [...prev, ...newAtts]);
    e.target.value = '';
  };

  const handleRemoveAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const taskPayload = {
      title: newTitle.trim(),
      description: newDesc.trim(),
      projectId: newProjectId,
      typeId: newTypeId,
      priority: newPriority,
      status: 'TODO' as TaskStatus,
      creatorId: currentUser.id,
      estimatedHours: Number(newEstHours),
      startDate: newStartDate,
      dueDate: newDueDate,
      attachments: attachments
    };

    if (isRegularEmployee) {
      // Regular employee assigns task to self directly without scope/assignee prompt
      addTask({
        ...taskPayload,
        assigneeId: currentUser.id
      });
    } else if (isTeamLead) {
      if (assignScope === 'team' && selectedTeamId) {
        assignTaskToTeam(selectedTeamId, taskPayload);
      } else {
        addTask({
          ...taskPayload,
          assigneeId: newAssigneeId || currentUser.id
        });
      }
    } else {
      // Super Admin / HR
      if (assignScope === 'team' && selectedTeamId) {
        assignTaskToTeam(selectedTeamId, taskPayload);
      } else if (assignScope === 'all') {
        assignTaskToAllMembers(taskPayload);
      } else {
        addTask({
          ...taskPayload,
          assigneeId: newAssigneeId
        });
      }
    }

    // Reset Form
    setNewTitle('');
    setNewDesc('');
    setAttachments([]);
    setShowCreateModal(false);
  };

  const columns: { status: TaskStatus; label: string; bg: string }[] = [
    { status: 'TODO', label: 'To Do', bg: 'border-zinc-300' },
    { status: 'IN_PROGRESS', label: 'In Progress / Live Timer', bg: 'border-brand-500' },
    { status: 'IN_REVIEW', label: 'In Review', bg: 'border-blue-500' },
    { status: 'COMPLETED', label: 'Completed', bg: 'border-emerald-500' }
  ];

  // Scoped project options
  const myRelevantProjects = isRegularEmployee
    ? projects.filter(p => visibleTasks.some(t => t.projectId === p.id) || true)
    : projects;

  const projectOptions = [
    { value: 'ALL', label: 'All Projects' },
    ...myRelevantProjects.map((p) => ({ value: p.id, label: p.name, subLabel: `Status: ${p.status}` }))
  ];

  const taskTypeOptions = [
    { value: 'ALL', label: 'All Task Types' },
    ...taskTypes.map((tt) => ({ value: tt.id, label: tt.name, color: tt.color, subLabel: tt.code }))
  ];

  const assigneeOptions = [
    { value: 'ALL', label: 'All Assignees' },
    ...(isAdminOrHR ? users : users.filter(u => myTeamMemberIds.includes(u.id) || u.id === currentUser.id)).map((u) => ({
      value: u.id,
      label: u.name,
      avatar: u.avatar,
      subLabel: u.role.replace('_', ' ')
    }))
  ];

  const priorityFilterOptions = [
    { value: 'ALL', label: 'All Priorities' },
    { value: 'URGENT', label: 'Urgent', color: '#EF4444' },
    { value: 'HIGH', label: 'High', color: '#F59E0B' },
    { value: 'MEDIUM', label: 'Medium', color: '#3B82F6' },
    { value: 'LOW', label: 'Low', color: '#10B981' }
  ];

  const teamFilterOptions = [
    { value: 'ALL', label: 'All Teams' },
    ...teams.map((t) => ({
      value: t.id,
      label: t.name,
      subLabel: `${t.memberIds.length} Members`
    }))
  ];

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-6">
      
      {/* Check-In Warning Banner if not checked in */}
      {!isCheckedIn && currentUser.role !== 'SUPER_ADMIN' && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between shadow-xs">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <div>
              <h4 className="text-xs font-bold text-amber-900">Check-In Required to Log Task Work Hours</h4>
              <p className="text-[11px] text-amber-800 mt-0.5">
                You must Check In before starting live task timers or creating tasks.
              </p>
            </div>
          </div>
          <button
            onClick={toggleCheckIn}
            className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Check In Now</span>
          </button>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-extrabold text-zinc-900 tracking-tight flex items-center gap-2">
              <CheckSquare className="w-6 h-6 text-brand-500" /> Tasks & Live Worklog Timer
            </h1>
            {deletedTasks.length > 0 && isSuperAdmin && (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-700">
                {deletedTasks.length} in trash
              </span>
            )}
          </div>
          <p className="text-xs text-zinc-500 mt-1">
            {isRegularEmployee
              ? "Access your assigned tasks, start & stop live work session timers, and view comprehensive session logs."
              : "Create multi-scope tasks, manage team member assignments, track live timers, and review task histories."}
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {/* Tabs: Active vs Deleted Queue (Super Admin / TL) */}
          {isSuperAdmin && (
            <div className="flex items-center bg-zinc-200/80 p-1 rounded-xl">
              <button
                onClick={() => setActiveTab('active')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'active' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                Active Tasks
              </button>
              <button
                onClick={() => setActiveTab('deleted')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'deleted' ? 'bg-white text-rose-700 shadow-sm' : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Deleted Queue ({deletedTasks.length})</span>
              </button>
            </div>
          )}

          {/* Kanban / List Toggle */}
          <div className="flex items-center bg-zinc-200/80 p-1 rounded-xl">
            <button
              onClick={() => setViewMode('kanban')}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1 transition-all cursor-pointer ${
                viewMode === 'kanban' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-600 hover:text-zinc-900'
              }`}
              title="Board View"
            >
              <Kanban className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Board</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1 transition-all cursor-pointer ${
                viewMode === 'list' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-600 hover:text-zinc-900'
              }`}
              title="List View"
            >
              <List className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">List</span>
            </button>
          </div>

          <button
            onClick={handleOpenCreateModal}
            className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-xs font-bold shadow-glow-orange cursor-pointer flex items-center space-x-1.5 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>{isRegularEmployee ? 'Create My Task' : 'Create & Assign Task'}</span>
          </button>
        </div>
      </div>

      {/* Filters Toolbar with SearchableSelect Dropdowns */}
      <div className={`card-clean p-4 grid grid-cols-1 sm:grid-cols-2 ${isRegularEmployee ? 'lg:grid-cols-4' : 'lg:grid-cols-6'} gap-2.5 items-center text-xs`}>
        <div className="flex items-center space-x-1.5 text-zinc-500 font-bold uppercase tracking-wider">
          <Filter className="w-4 h-4 text-brand-500" />
          <span>Filter Tasks:</span>
        </div>

        {/* Team Filter (Hidden for regular employee) */}
        {!isRegularEmployee && (
          <SearchableSelect
            options={teamFilterOptions}
            value={filterTeam}
            onChange={setFilterTeam}
            placeholder="Filter by Team"
          />
        )}

        <SearchableSelect
          options={projectOptions}
          value={filterProject}
          onChange={setFilterProject}
          placeholder="Filter by Project"
        />

        <SearchableSelect
          options={taskTypeOptions}
          value={filterType}
          onChange={setFilterType}
          placeholder="Filter by Task Type"
        />

        {/* Assignee Filter (Hidden for regular employee) */}
        {!isRegularEmployee && (
          <SearchableSelect
            options={assigneeOptions}
            value={filterAssignee}
            onChange={setFilterAssignee}
            placeholder="Filter by Assignee"
          />
        )}

        <SearchableSelect
          options={priorityFilterOptions}
          value={filterPriority}
          onChange={setFilterPriority}
          placeholder="Filter by Priority"
        />
      </div>

      {/* Kanban Board View */}
      {viewMode === 'kanban' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {columns.map((col) => {
            const colTasks = sortedTasks.filter((t) => t.status === col.status);
            return (
              <div
                key={col.status}
                className="bg-zinc-100/70 border border-zinc-200/80 rounded-2xl p-3.5 flex flex-col space-y-3 min-h-[500px]"
              >
                <div className={`flex items-center justify-between pb-2 border-b-2 ${col.bg}`}>
                  <span className="font-bold text-xs text-zinc-800 uppercase tracking-wider">{col.label}</span>
                  <span className="w-5 h-5 rounded-full bg-white border border-zinc-300 text-[10px] font-bold flex items-center justify-center text-zinc-700">
                    {colTasks.length}
                  </span>
                </div>

                <div className="flex-1 space-y-3 overflow-y-auto">
                  {colTasks.length === 0 ? (
                    <p className="text-[11px] text-zinc-400 text-center py-8">No tasks in {col.label}</p>
                  ) : (
                    colTasks.map((t) => {
                      const taskType = taskTypes.find((tt) => tt.id === t.typeId);
                      const project = projects.find((p) => p.id === t.projectId);
                      const isOverdue = t.status !== 'COMPLETED' && t.dueDate < todayStr;
                      const isDueToday = t.status !== 'COMPLETED' && t.dueDate === todayStr;
                      const isExceeded = t.loggedHours > t.estimatedHours;
                      const isThisRunning = Boolean(t.isTimerRunning);
                      const isAnotherRunning = Boolean(runningTaskId && runningTaskId !== t.id);
                      const isStartDisabled = Boolean(runningTaskId);
                      const isCompleted = t.status === 'COMPLETED';
                      const totalTaskSecs = getTaskTotalSeconds(t);

                      return (
                        <div
                          key={t.id}
                          onClick={() => setSelectedTask(t)}
                          className={`card-clean p-4 space-y-3 cursor-pointer hover:border-brand-500 transition-all ${
                            isOverdue
                              ? 'border-rose-400 ring-1 ring-rose-400/40 bg-rose-50/20'
                              : isDueToday
                              ? 'border-amber-400 ring-1 ring-amber-400/30'
                              : isThisRunning
                              ? 'ring-2 ring-brand-500 border-brand-500 bg-brand-50/20 shadow-md'
                              : ''
                          }`}
                        >
                          {/* Badges: Type, Priority, Overdue Alert */}
                          <div className="flex items-center justify-between flex-wrap gap-1">
                            <span
                              className="px-2 py-0.5 rounded text-[9px] font-bold uppercase text-white shadow-xs"
                              style={{ backgroundColor: taskType?.color || '#F97316' }}
                            >
                              {taskType?.name || 'Task'}
                            </span>

                            <div className="flex items-center space-x-1">
                              {isOverdue && (
                                <span className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase bg-rose-600 text-white animate-pulse">
                                  Overdue
                                </span>
                              )}
                              <span
                                className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                                  t.priority === 'URGENT'
                                    ? 'bg-rose-100 text-rose-700'
                                    : t.priority === 'HIGH'
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-zinc-100 text-zinc-700'
                                }`}
                              >
                                {t.priority}
                              </span>
                            </div>
                          </div>

                          {/* Title & Project Name */}
                          <div>
                            <h4 className="text-xs font-bold text-zinc-900 leading-snug">{t.title}</h4>
                            <div className="flex items-center space-x-2 text-[10px] text-zinc-500 mt-1">
                              <span className="font-semibold text-brand-700 bg-brand-50 px-2 py-0.5 rounded">
                                📁 {project?.name || 'General Project'}
                              </span>
                            </div>
                            <div className="flex items-center space-x-2 text-[10px] text-zinc-400 mt-1">
                              <span>Created: {formatDate(t.createdAt)}</span>
                              <span>•</span>
                              <span className={isOverdue ? 'text-rose-600 font-bold' : ''}>
                                Due: {formatDate(t.dueDate)}
                              </span>
                            </div>
                          </div>

                          {/* Attachments Icon count */}
                          {t.attachments && t.attachments.length > 0 && (
                            <div className="flex items-center space-x-1 text-[10px] text-zinc-500 font-semibold">
                              <Paperclip className="w-3 h-3 text-brand-500" />
                              <span>{t.attachments.length} attachment(s)</span>
                            </div>
                          )}

                          {/* Footer Info: Total Time Taken & START/STOP Button & View Log */}
                          <div className="pt-2.5 border-t border-zinc-100 flex items-center justify-between text-xs">
                            <div className="text-left">
                              <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block">
                                Total Time Taken
                              </span>
                              <span
                                className={`text-xs font-mono font-black flex items-center gap-1 ${
                                  isExceeded
                                    ? 'text-rose-600'
                                    : isThisRunning
                                    ? 'text-brand-600 animate-pulse'
                                    : 'text-zinc-900'
                                }`}
                              >
                                <Clock className="w-3 h-3 text-brand-500 flex-shrink-0" />
                                {formatDurationHuman(totalTaskSecs)}
                              </span>
                              <span className="text-[10px] font-mono text-zinc-400 block mt-0.5">
                                {formatHoursDecimal(t.loggedHours)} / {t.estimatedHours}h
                              </span>
                            </div>

                            <div className="flex items-center space-x-1.5" onClick={(e) => e.stopPropagation()}>
                              {/* View Log Button */}
                              <button
                                onClick={() => setWorklogTask(t)}
                                className="px-2 py-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-lg text-[10px] font-bold transition-colors cursor-pointer"
                                title="View Session Worklog"
                              >
                                View Log
                              </button>

                              {/* Live Timer START / STOP Button */}
                              {isThisRunning ? (
                                <button
                                  onClick={(e) => handleStartStopClick(t.id, e)}
                                  className="px-2.5 py-1 rounded-lg text-white transition-all cursor-pointer bg-rose-500 hover:bg-rose-600 animate-pulse shadow-glow-orange flex items-center space-x-1 font-bold text-[10px]"
                                  title="Stop Active Timer"
                                >
                                  <Square className="w-3 h-3 fill-current" />
                                  <span>Stop</span>
                                </button>
                              ) : !isCompleted && !isSuperAdmin ? (
                                <button
                                  onClick={(e) => handleStartStopClick(t.id, e)}
                                  disabled={isStartDisabled}
                                  className={`px-2.5 py-1 rounded-lg font-bold text-[10px] flex items-center space-x-1 transition-all ${
                                    isStartDisabled
                                      ? 'bg-zinc-200 text-zinc-400 cursor-not-allowed border border-zinc-200 opacity-60'
                                      : 'bg-brand-500 hover:bg-brand-600 text-white shadow-sm cursor-pointer'
                                  }`}
                                  title={isStartDisabled ? 'Another task timer is already running. Stop it first.' : 'Start Timer'}
                                >
                                  <Play className="w-3 h-3 fill-current" />
                                  <span>Start</span>
                                </button>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* List / Table View */
        <div className="card-clean overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-100 border-b border-zinc-200 text-zinc-500 font-bold uppercase tracking-wider">
              <tr>
                <th className="p-3">Task Title & Details</th>
                <th className="p-3">Project</th>
                <th className="p-3">Task Type</th>
                {!isRegularEmployee && <th className="p-3">Assignee</th>}
                <th className="p-3">Priority</th>
                <th className="p-3">Dates</th>
                <th className="p-3">Status</th>
                <th className="p-3">Total Time Taken</th>
                <th className="p-3 text-right">Actions & Timer</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {sortedTasks.length === 0 ? (
                <tr>
                  <td colSpan={isRegularEmployee ? 8 : 9} className="p-8 text-center text-zinc-400">
                    No tasks match the filter criteria.
                  </td>
                </tr>
              ) : (
                sortedTasks.map((t) => {
                  const assignee = users.find((u) => u.id === t.assigneeId);
                  const project = projects.find((p) => p.id === t.projectId);
                  const taskType = taskTypes.find((tt) => tt.id === t.typeId);
                  const isOverdue = t.status !== 'COMPLETED' && t.dueDate < todayStr;
                  const isExceeded = t.loggedHours > t.estimatedHours;
                  const isThisRunning = Boolean(t.isTimerRunning);
                  const isAnotherRunning = Boolean(runningTaskId && runningTaskId !== t.id);
                  const isStartDisabled = Boolean(runningTaskId);
                  const isCompleted = t.status === 'COMPLETED';
                  const totalTaskSecs = getTaskTotalSeconds(t);

                  return (
                    <tr
                      key={t.id}
                      className="hover:bg-zinc-50/80 cursor-pointer transition-colors"
                      onClick={() => setSelectedTask(t)}
                    >
                      <td className="p-3 max-w-xs">
                        <p className="font-bold text-zinc-900 truncate">{t.title}</p>
                        {t.attachments && t.attachments.length > 0 && (
                          <span className="text-[10px] text-brand-600 font-medium flex items-center gap-1 mt-0.5">
                            <Paperclip className="w-2.5 h-2.5" /> {t.attachments.length} files attached
                          </span>
                        )}
                      </td>

                      {/* Project Column */}
                      <td className="p-3 whitespace-nowrap">
                        <span className="font-semibold text-brand-700 bg-brand-50 px-2 py-0.5 rounded text-[11px]">
                          📁 {project?.name || 'General Project'}
                        </span>
                      </td>

                      <td className="p-3 whitespace-nowrap">
                        <span
                          className="px-2 py-0.5 rounded text-[9px] font-bold uppercase text-white shadow-xs"
                          style={{ backgroundColor: taskType?.color || '#F97316' }}
                        >
                          {taskType?.name || 'Task'}
                        </span>
                      </td>

                      {/* Assignee Column (Only if not employee) */}
                      {!isRegularEmployee && (
                        <td className="p-3 whitespace-nowrap">
                          <div className="flex items-center space-x-1.5">
                            {assignee?.avatar && (
                              <img
                                src={assignee.avatar}
                                alt={assignee.name}
                                className="w-5 h-5 rounded-full object-cover"
                              />
                            )}
                            <span className="text-zinc-700 font-semibold">{assignee?.name || 'Unassigned'}</span>
                          </div>
                        </td>
                      )}

                      <td className="p-3 whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                            t.priority === 'URGENT'
                              ? 'bg-rose-100 text-rose-700'
                              : t.priority === 'HIGH'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-zinc-100 text-zinc-700'
                          }`}
                        >
                          {t.priority}
                        </span>
                      </td>

                      <td className="p-3 whitespace-nowrap text-zinc-500 text-[11px]">
                        <span className={isOverdue ? 'text-rose-600 font-bold' : ''}>
                          Due: {formatDate(t.dueDate)}
                        </span>
                      </td>

                      <td className="p-3 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          isThisRunning ? 'bg-brand-500 text-white animate-pulse' :
                          t.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' :
                          t.status === 'IN_PROGRESS' ? 'bg-amber-100 text-amber-800' : 'bg-zinc-100 text-zinc-700'
                        }`}>
                          {isThisRunning ? '⚡ Running' : t.status.replace('_', ' ')}
                        </span>
                      </td>

                      <td className="p-3 whitespace-nowrap font-mono">
                        <div className="flex items-center space-x-1.5">
                          <Clock className="w-3.5 h-3.5 text-brand-500 flex-shrink-0" />
                          <div>
                            <span className={`font-black text-xs block ${
                              isExceeded ? 'text-rose-600' : isThisRunning ? 'text-brand-600 animate-pulse' : 'text-zinc-900'
                            }`}>
                              {formatDurationHuman(totalTaskSecs)}
                            </span>
                            <span className="text-[10px] text-zinc-400 block mt-0.5">
                              {formatHoursDecimal(t.loggedHours)} / {t.estimatedHours}h
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="p-3 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end space-x-1.5">
                          {/* View Log Button */}
                          <button
                            onClick={() => setWorklogTask(t)}
                            className="px-2.5 py-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                            title="View Session Worklog"
                          >
                            View Log
                          </button>

                          {/* START / STOP Live Timer Button */}
                          {isThisRunning ? (
                            <button
                              onClick={(e) => handleStartStopClick(t.id, e)}
                              className="px-3 py-1 bg-rose-500 hover:bg-rose-600 text-white rounded-lg text-xs font-bold flex items-center space-x-1 shadow-glow-orange animate-pulse cursor-pointer"
                              title="Stop Active Timer"
                            >
                              <Square className="w-3.5 h-3.5 fill-current" />
                              <span>Stop</span>
                            </button>
                          ) : !isCompleted && !isSuperAdmin ? (
                            <button
                              onClick={(e) => handleStartStopClick(t.id, e)}
                              disabled={isStartDisabled}
                              className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center space-x-1 transition-all ${
                                isStartDisabled
                                  ? 'bg-zinc-200 text-zinc-400 cursor-not-allowed border border-zinc-200 opacity-60'
                                  : 'bg-brand-500 hover:bg-brand-600 text-white shadow-sm cursor-pointer'
                              }`}
                              title={isStartDisabled ? 'Another task timer is already running. Stop it first.' : 'Start Timer'}
                            >
                              <Play className="w-3.5 h-3.5 fill-current" />
                              <span>Start</span>
                            </button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Task Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-zinc-200 overflow-hidden animate-in zoom-in-95">
            <div className="p-5 border-b border-zinc-100 flex items-center justify-between bg-zinc-50">
              <div>
                <h3 className="text-base font-black text-zinc-900">
                  {isRegularEmployee ? 'Create My Task' : 'Create & Assign Task'}
                </h3>
                <p className="text-xs text-zinc-500">
                  {isRegularEmployee
                    ? 'New task will be automatically assigned to you.'
                    : isTeamLead
                    ? 'Assign new task to yourself or your team members.'
                    : 'Assign new task to individuals or teams.'}
                </p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
              <div>
                <label className="block text-[11px] font-bold text-zinc-700 uppercase mb-1">
                  Task Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Design responsive dashboard UI"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full p-2.5 border border-zinc-300 rounded-xl focus:outline-none focus:border-brand-500 text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-700 uppercase mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Provide task instructions and context..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full p-2.5 border border-zinc-300 rounded-xl focus:outline-none focus:border-brand-500 text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-zinc-700 uppercase mb-1">
                    Project *
                  </label>
                  <select
                    value={newProjectId}
                    onChange={(e) => setNewProjectId(e.target.value)}
                    className="w-full p-2.5 border border-zinc-300 rounded-xl focus:outline-none focus:border-brand-500 text-xs bg-white"
                  >
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-zinc-700 uppercase mb-1">
                    Task Type *
                  </label>
                  <select
                    value={newTypeId}
                    onChange={(e) => setNewTypeId(e.target.value)}
                    className="w-full p-2.5 border border-zinc-300 rounded-xl focus:outline-none focus:border-brand-500 text-xs bg-white"
                  >
                    {taskTypes.map((tt) => (
                      <option key={tt.id} value={tt.id}>
                        {tt.name} ({tt.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Assignee Scope selection (HIDDEN for regular Employee) */}
              {!isRegularEmployee && (
                <div>
                  <label className="block text-[11px] font-bold text-zinc-700 uppercase mb-1">
                    Assignee Scope *
                  </label>
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <button
                      type="button"
                      onClick={() => setAssignScope('individual')}
                      className={`p-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                        assignScope === 'individual'
                          ? 'bg-brand-50 border-brand-500 text-brand-700'
                          : 'border-zinc-200 text-zinc-600'
                      }`}
                    >
                      Individual Member
                    </button>
                    <button
                      type="button"
                      onClick={() => setAssignScope('team')}
                      className={`p-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                        assignScope === 'team'
                          ? 'bg-brand-50 border-brand-500 text-brand-700'
                          : 'border-zinc-200 text-zinc-600'
                      }`}
                    >
                      Team Assignment
                    </button>
                  </div>

                  {assignScope === 'individual' ? (
                    <select
                      value={newAssigneeId}
                      onChange={(e) => setNewAssigneeId(e.target.value)}
                      className="w-full p-2.5 border border-zinc-300 rounded-xl focus:outline-none focus:border-brand-500 text-xs bg-white"
                    >
                      {(isAdminOrHR ? users : users.filter(u => myTeamMemberIds.includes(u.id) || u.id === currentUser.id)).map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name} ({u.role.replace('_', ' ')})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <select
                      value={selectedTeamId}
                      onChange={(e) => setSelectedTeamId(e.target.value)}
                      className="w-full p-2.5 border border-zinc-300 rounded-xl focus:outline-none focus:border-brand-500 text-xs bg-white"
                    >
                      {(isTeamLead ? teams.filter(t => t.leaderId === currentUser.id) : teams).map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name} ({t.memberIds.length} members)
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-zinc-700 uppercase mb-1">
                    Priority
                  </label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as TaskPriority)}
                    className="w-full p-2.5 border border-zinc-300 rounded-xl focus:outline-none focus:border-brand-500 text-xs bg-white"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-zinc-700 uppercase mb-1">
                    Estimated Hours
                  </label>
                  <input
                    type="number"
                    min="0.5"
                    step="0.5"
                    value={newEstHours}
                    onChange={(e) => setNewEstHours(Number(e.target.value))}
                    className="w-full p-2.5 border border-zinc-300 rounded-xl focus:outline-none focus:border-brand-500 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-zinc-700 uppercase mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={newStartDate}
                    onChange={(e) => setNewStartDate(e.target.value)}
                    className="w-full p-2.5 border border-zinc-300 rounded-xl focus:outline-none focus:border-brand-500 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-zinc-700 uppercase mb-1">
                    Due Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                    className="w-full p-2.5 border border-zinc-300 rounded-xl focus:outline-none focus:border-brand-500 text-xs"
                  />
                </div>
              </div>

              {/* Attachments */}
              <div>
                <label className="block text-[11px] font-bold text-zinc-700 uppercase mb-1">
                  Attachments & Documents
                </label>
                <input
                  type="file"
                  multiple
                  onChange={handleAddAttachment}
                  className="w-full text-xs text-zinc-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100 cursor-pointer"
                />
                {attachments.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {attachments.map((att) => (
                      <div key={att.id} className="flex items-center justify-between p-2 bg-zinc-50 rounded-lg text-xs">
                        <span className="truncate max-w-[200px] font-medium">{att.name}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveAttachment(att.id)}
                          className="text-rose-500 font-bold hover:underline"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-zinc-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold rounded-xl text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-xl text-xs shadow-glow-orange cursor-pointer"
                >
                  Save & Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Check-In Alert Modal */}
      {showCheckInAlert && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl border border-zinc-200 space-y-4 animate-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-extrabold text-zinc-900">Attendance Check-In Required</h3>
              <p className="text-xs text-zinc-600 leading-relaxed">
                You must Check In before starting a task timer or creating tasks. Would you like to check in now?
              </p>
            </div>

            <div className="pt-2 flex items-center justify-end space-x-2 text-xs font-bold">
              <button
                onClick={() => setShowCheckInAlert(false)}
                className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  toggleCheckIn();
                  setShowCheckInAlert(false);
                }}
                className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-xl shadow-glow-orange cursor-pointer flex items-center space-x-1.5"
              >
                <LogIn className="w-4 h-4" />
                <span>Check In Now</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Task Details Modal */}
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

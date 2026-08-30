'use client';

import React, { useState } from 'react';
import { useSystem } from '@/context/SystemContext';
import { Task, TaskPriority, TaskStatus, TaskAttachment } from '@/lib/types';
import { formatHoursDecimal, formatDate } from '@/lib/utils';
import { SearchableSelect } from '@/components/common/SearchableSelect';
import { TaskDetailsModal } from '@/components/modals/TaskDetailsModal';
import { TaskEditModal } from '@/components/modals/TaskEditModal';
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
  AlertTriangle
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
    hardDeleteTask
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
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

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
    if (filterAssignee !== 'ALL' && t.assigneeId !== filterAssignee) return false;
    if (filterPriority !== 'ALL' && t.priority !== filterPriority) return false;
    if (filterTeam !== 'ALL') {
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

  const handleAddMockAttachment = () => {
    if (!uploadFileName.trim()) return;
    const newAtt: TaskAttachment = {
      id: `att-${Date.now()}`,
      name: uploadFileName.trim().endsWith('.pdf') || uploadFileName.trim().endsWith('.png') ? uploadFileName.trim() : `${uploadFileName.trim()}.pdf`,
      size: '1.4 MB',
      type: 'Specification Document',
      uploadDate: new Date().toISOString().split('T')[0]
    };
    setAttachments((prev) => [...prev, newAtt]);
    setUploadFileName('');
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

  // Options for Searchable Selects
  const projectOptions = [
    { value: 'ALL', label: 'All Projects' },
    ...projects.map((p) => ({ value: p.id, label: p.name, subLabel: `Status: ${p.status}` }))
  ];

  const taskTypeOptions = [
    { value: 'ALL', label: 'All Task Types' },
    ...taskTypes.map((tt) => ({ value: tt.id, label: tt.name, color: tt.color, subLabel: tt.code }))
  ];

  const assigneeOptions = [
    { value: 'ALL', label: 'All Assignees' },
    ...users.map((u) => ({ value: u.id, label: u.name, avatar: u.avatar, subLabel: u.role.replace('_', ' ') }))
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

  const teamOptions = teams.map((t) => ({
    value: t.id,
    label: t.name,
    subLabel: `${t.memberIds.length} Members`
  }));

  const availableAssigneeOptions = (isAdminOrHR ? users : isTeamLead ? users.filter((u) => myTeamMemberIds.includes(u.id) || u.id === currentUser.id) : [currentUser]).map((u) => ({
    value: u.id,
    label: u.name,
    avatar: u.avatar,
    subLabel: u.role.replace('_', ' ')
  }));

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-6">
      
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
            Create multi-scope tasks, upload attachments, track start/creation dates, and log live work sessions.
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
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-xs font-bold shadow-glow-orange cursor-pointer flex items-center space-x-1.5 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Create & Assign Task</span>
          </button>
        </div>
      </div>

      {/* Deleted Tasks Notice Banner if viewing trash */}
      {activeTab === 'deleted' && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center justify-between shadow-xs">
          <div className="flex items-center space-x-3">
            <ShieldAlert className="w-5 h-5 text-rose-600 flex-shrink-0" />
            <div>
              <h4 className="text-xs font-bold text-rose-900">
                Deleted Tasks Review Queue (Super Admin Access)
              </h4>
              <p className="text-[11px] text-rose-800 mt-0.5">
                These tasks were deleted by Team Leaders or members. You can review full logs, restore them back to active state, or permanently purge them.
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('active')}
            className="px-3 py-1.5 bg-white border border-rose-300 text-rose-800 rounded-xl text-xs font-bold hover:bg-rose-100/60 transition-colors"
          >
            Return to Active
          </button>
        </div>
      )}

      {/* Filters Toolbar with SearchableSelect Dropdowns */}
      <div className="card-clean p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2.5 items-center text-xs">
        <div className="flex items-center space-x-1.5 text-zinc-500 font-bold uppercase tracking-wider">
          <Filter className="w-4 h-4 text-brand-500" />
          <span>Filter Tasks:</span>
        </div>

        <SearchableSelect
          options={teamFilterOptions}
          value={filterTeam}
          onChange={setFilterTeam}
          placeholder="Filter by Team"
        />

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

        <SearchableSelect
          options={assigneeOptions}
          value={filterAssignee}
          onChange={setFilterAssignee}
          placeholder="Filter by Assignee"
        />

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
                      const assignee = users.find((u) => u.id === t.assigneeId);
                      const taskType = taskTypes.find((tt) => tt.id === t.typeId);
                      const isOverdue = t.status !== 'COMPLETED' && t.dueDate < todayStr;
                      const isDueToday = t.status !== 'COMPLETED' && t.dueDate === todayStr;
                      const isExceeded = t.loggedHours > t.estimatedHours;

                      return (
                        <div
                          key={t.id}
                          onClick={() => setSelectedTask(t)}
                          className={`card-clean p-4 space-y-3 cursor-pointer hover:border-brand-500 transition-all ${
                            isOverdue
                              ? 'border-rose-400 ring-1 ring-rose-400/40 bg-rose-50/20'
                              : isDueToday
                              ? 'border-amber-400 ring-1 ring-amber-400/30'
                              : t.isTimerRunning
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

                          {/* Title & Dates */}
                          <div>
                            <h4 className="text-xs font-bold text-zinc-900 leading-snug">{t.title}</h4>
                            <div className="flex items-center space-x-2 text-[10px] text-zinc-400 mt-1">
                              <span>Created: {formatDate(t.createdAt)}</span>
                              <span>•</span>
                              <span className={isOverdue ? 'text-rose-600 font-bold' : ''}>
                                Due: {formatDate(t.dueDate)}
                              </span>
                            </div>
                          </div>

                          {/* Soft Delete info if in deleted queue */}
                          {t.isSoftDeleted && (
                            <div className="p-2 bg-rose-50 border border-rose-200 rounded-lg text-[10px] text-rose-800">
                              Deleted by: <strong>{t.softDeletedBy || 'Team Leader'}</strong>
                            </div>
                          )}

                          {/* Attachments Icon count */}
                          {t.attachments && t.attachments.length > 0 && (
                            <div className="flex items-center space-x-1 text-[10px] text-zinc-500 font-semibold">
                              <Paperclip className="w-3 h-3 text-brand-500" />
                              <span>{t.attachments.length} attachment(s)</span>
                            </div>
                          )}

                          {/* Footer Info: Assignee & Timer Control */}
                          <div className="pt-2 border-t border-zinc-100 flex items-center justify-between text-xs">
                            <div className="flex items-center space-x-1.5 truncate max-w-[120px]">
                              {assignee?.avatar && (
                                <img
                                  src={assignee.avatar}
                                  alt={assignee.name}
                                  className="w-5 h-5 rounded-full object-cover flex-shrink-0"
                                />
                              )}
                              <span className="text-[10px] font-semibold text-zinc-700 truncate">
                                {assignee?.name || 'Unassigned'}
                              </span>
                            </div>

                            <div className="flex items-center space-x-2">
                              <span
                                className={`text-[10px] font-mono font-bold ${
                                  isExceeded ? 'text-rose-600' : 'text-zinc-700'
                                }`}
                              >
                                {formatHoursDecimal(t.loggedHours)} / {t.estimatedHours}h
                              </span>

                              {/* Restore/Permanent Delete if deleted, else Timer Action */}
                              {t.isSoftDeleted ? (
                                <div className="flex items-center space-x-1" onClick={(e) => e.stopPropagation()}>
                                  <button
                                    onClick={() => restoreTask(t.id)}
                                    className="p-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded-lg"
                                    title="Restore Task"
                                  >
                                    <RotateCcw className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => hardDeleteTask(t.id)}
                                    className="p-1 bg-rose-100 hover:bg-rose-200 text-rose-800 rounded-lg"
                                    title="Permanently Delete"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ) : t.isTimerRunning ? (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleTaskTimer(t.id);
                                  }}
                                  className="px-2.5 py-1 rounded-lg text-white transition-all cursor-pointer bg-rose-500 hover:bg-rose-600 animate-pulse shadow-glow-orange flex items-center space-x-1 font-bold text-[10px]"
                                  title="Stop Active Timer"
                                >
                                  <Square className="w-3 h-3 fill-current" />
                                  <span>Stop</span>
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
        /* List View */
        <div className="card-clean overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-100 border-b border-zinc-200 text-zinc-500 font-bold uppercase tracking-wider">
              <tr>
                <th className="p-3">Task Title & Details</th>
                <th className="p-3">Task Type</th>
                <th className="p-3">Assignee</th>
                <th className="p-3">Priority</th>
                <th className="p-3">Dates</th>
                <th className="p-3">Status</th>
                <th className="p-3">Logged / Est</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {sortedTasks.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-zinc-400">
                    No tasks match the filter criteria.
                  </td>
                </tr>
              ) : (
                sortedTasks.map((t) => {
                  const assignee = users.find((u) => u.id === t.assigneeId);
                  const taskType = taskTypes.find((tt) => tt.id === t.typeId);
                  const isOverdue = t.status !== 'COMPLETED' && t.dueDate < todayStr;
                  const isExceeded = t.loggedHours > t.estimatedHours;

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
                      <td className="p-3">
                        <span
                          className="px-2 py-0.5 rounded text-[10px] font-bold text-white shadow-xs"
                          style={{ backgroundColor: taskType?.color }}
                        >
                          {taskType?.name}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center space-x-2">
                          {assignee?.avatar && (
                            <img
                              src={assignee.avatar}
                              alt={assignee.name}
                              className="w-5 h-5 rounded-full object-cover"
                            />
                          )}
                          <span className="font-semibold text-zinc-800">{assignee?.name}</span>
                        </div>
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            t.priority === 'URGENT'
                              ? 'bg-rose-100 text-rose-700'
                              : t.priority === 'HIGH'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-zinc-200 text-zinc-700'
                          }`}
                        >
                          {t.priority}
                        </span>
                      </td>
                      <td className="p-3 text-[11px] space-y-0.5">
                        <p className="text-zinc-500">Created: {formatDate(t.createdAt)}</p>
                        <p className={`font-semibold ${isOverdue ? 'text-rose-600 font-bold' : 'text-zinc-700'}`}>
                          Due: {formatDate(t.dueDate)} {isOverdue && '⚠️'}
                        </p>
                      </td>
                      <td className="p-3 font-semibold text-zinc-700">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            t.status === 'COMPLETED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : t.status === 'IN_PROGRESS'
                              ? 'bg-brand-100 text-brand-800'
                              : 'bg-zinc-100 text-zinc-700'
                          }`}
                        >
                          {t.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="p-3 font-mono font-bold">
                        <span className={isExceeded ? 'text-rose-600' : 'text-zinc-800'}>
                          {formatHoursDecimal(t.loggedHours)} / {t.estimatedHours}h
                        </span>
                      </td>
                      <td className="p-3 text-right" onClick={(e) => e.stopPropagation()}>
                        {t.isSoftDeleted ? (
                          <div className="flex items-center justify-end space-x-1.5">
                            <button
                              onClick={() => restoreTask(t.id)}
                              className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg font-bold text-[10px]"
                            >
                              Restore
                            </button>
                            <button
                              onClick={() => hardDeleteTask(t.id)}
                              className="px-2.5 py-1 bg-rose-600 text-white rounded-lg font-bold text-[10px]"
                            >
                              Purge
                            </button>
                          </div>
                        ) : t.isTimerRunning ? (
                          <button
                            onClick={() => toggleTaskTimer(t.id)}
                            className="px-3 py-1 rounded-lg text-white font-bold text-[11px] flex items-center space-x-1 ml-auto cursor-pointer bg-rose-500 hover:bg-rose-600 animate-pulse shadow-glow-orange"
                            title="Stop Active Timer"
                          >
                            <Square className="w-3 h-3 fill-current" />
                            <span>Stop</span>
                          </button>
                        ) : null}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Create & Assign Task Modal with Multi-Scope & Attachments */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <h3 className="font-bold text-base text-zinc-900 flex items-center gap-2">
                <Plus className="w-5 h-5 text-brand-500" /> Create & Assign Task
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-zinc-400 hover:text-zinc-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-zinc-700 block mb-1">Task Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Develop Stripe Payment Webhook & Email Handler"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-xl focus:border-brand-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-zinc-700 block mb-1">Description & Specifications</label>
                <textarea
                  rows={2}
                  placeholder="Provide technical requirements, criteria, and handover notes..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-xl focus:border-brand-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <SearchableSelect
                  label="Project"
                  required
                  options={projects.map((p) => ({ value: p.id, label: p.name, subLabel: `Status: ${p.status}` }))}
                  value={newProjectId}
                  onChange={setNewProjectId}
                />

                <SearchableSelect
                  label="Task Type Master"
                  required
                  options={taskTypes.map((tt) => ({ value: tt.id, label: tt.name, color: tt.color, subLabel: tt.code }))}
                  value={newTypeId}
                  onChange={setNewTypeId}
                />
              </div>

              {/* Assignment Target Scope (Individual vs Selected Team vs All Members) */}
              <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl space-y-2">
                <span className="font-bold text-zinc-900 block">Assignment Target Scope *</span>
                <div className="flex flex-wrap items-center gap-4">
                  <label className="flex items-center space-x-1.5 cursor-pointer font-semibold text-zinc-800">
                    <input
                      type="radio"
                      name="assignScope"
                      checked={assignScope === 'individual'}
                      onChange={() => setAssignScope('individual')}
                      className="accent-brand-500"
                    />
                    <span>Individual Team Member</span>
                  </label>

                  <label className="flex items-center space-x-1.5 cursor-pointer font-semibold text-zinc-800">
                    <input
                      type="radio"
                      name="assignScope"
                      checked={assignScope === 'team'}
                      onChange={() => setAssignScope('team')}
                      className="accent-brand-500"
                    />
                    <span>Selected Team</span>
                  </label>

                  {isAdminOrHR && (
                    <label className="flex items-center space-x-1.5 cursor-pointer font-semibold text-zinc-800">
                      <input
                        type="radio"
                        name="assignScope"
                        checked={assignScope === 'all'}
                        onChange={() => setAssignScope('all')}
                        className="accent-brand-500"
                      />
                      <span>All Organization Members</span>
                    </label>
                  )}
                </div>
              </div>

              {/* Scope Target Selectors */}
              {assignScope === 'team' ? (
                <SearchableSelect
                  label="Select Target Team"
                  required
                  options={teamOptions}
                  value={selectedTeamId}
                  onChange={setSelectedTeamId}
                  placeholder="Search and select team..."
                />
              ) : assignScope === 'individual' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <SearchableSelect
                    label="Assignee (Team Member)"
                    required
                    options={availableAssigneeOptions}
                    value={newAssigneeId}
                    onChange={setNewAssigneeId}
                    placeholder="Search member by name..."
                  />

                  <SearchableSelect
                    label="Priority"
                    required
                    options={[
                      { value: 'LOW', label: 'Low Priority', color: '#10B981' },
                      { value: 'MEDIUM', label: 'Medium Priority', color: '#3B82F6' },
                      { value: 'HIGH', label: 'High Priority', color: '#F59E0B' },
                      { value: 'URGENT', label: 'Urgent Priority', color: '#EF4444' }
                    ]}
                    value={newPriority}
                    onChange={(val) => setNewPriority(val as TaskPriority)}
                  />
                </div>
              ) : (
                <div className="p-3 bg-brand-50 border border-brand-100 rounded-xl text-brand-900 font-medium">
                  🌟 This task will be duplicated and assigned to all active employees and team leaders across the company.
                </div>
              )}

              {/* Multiple Document Upload Field */}
              <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-zinc-900 flex items-center gap-1.5">
                    <Paperclip className="w-3.5 h-3.5 text-brand-500" /> Multiple Document Attachments
                  </span>
                  <label className="px-3 py-1 bg-white border border-zinc-300 text-zinc-700 rounded-lg text-[11px] font-bold hover:bg-zinc-100 transition-colors cursor-pointer flex items-center gap-1 shadow-xs">
                    <Upload className="w-3 h-3" />
                    <span>Upload File</span>
                    <input
                      type="file"
                      multiple
                      onChange={handleAddAttachment}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Quick Add filename input */}
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    placeholder="Or type doc name: e.g. Functional_Specs_v2.pdf"
                    value={uploadFileName}
                    onChange={(e) => setUploadFileName(e.target.value)}
                    className="flex-1 px-3 py-1.5 bg-white border border-zinc-200 rounded-lg text-xs focus:border-brand-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddMockAttachment}
                    className="px-3 py-1.5 bg-zinc-800 hover:bg-black text-white rounded-lg text-xs font-bold cursor-pointer"
                  >
                    Attach
                  </button>
                </div>

                {/* Attached Files List */}
                {attachments.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    {attachments.map((att) => (
                      <div
                        key={att.id}
                        className="p-2 bg-white border border-zinc-200 rounded-lg flex items-center justify-between text-xs shadow-xs"
                      >
                        <div className="flex items-center space-x-2 truncate">
                          <FileText className="w-3.5 h-3.5 text-brand-500 flex-shrink-0" />
                          <span className="font-medium text-zinc-900 truncate">{att.name}</span>
                          <span className="text-[10px] text-zinc-400">({att.size})</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveAttachment(att.id)}
                          className="text-zinc-400 hover:text-rose-600 ml-2"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Estimated Hours, Start Date, Due Date */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-zinc-700 block mb-1">Est. Hours *</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    required
                    value={newEstHours}
                    onChange={(e) => setNewEstHours(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-zinc-200 rounded-xl focus:border-brand-500"
                  />
                </div>

                <div>
                  <label className="font-bold text-zinc-700 block mb-1">Start Date</label>
                  <input
                    type="date"
                    value={newStartDate}
                    onChange={(e) => setNewStartDate(e.target.value)}
                    className="w-full px-3 py-2 border border-zinc-200 rounded-xl focus:border-brand-500"
                  />
                </div>

                <div>
                  <label className="font-bold text-zinc-700 block mb-1">Due Date *</label>
                  <input
                    type="date"
                    required
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                    className="w-full px-3 py-2 border border-zinc-200 rounded-xl focus:border-brand-500"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-zinc-100 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-zinc-600 hover:bg-zinc-100 rounded-xl cursor-pointer font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-xl font-bold cursor-pointer shadow-glow-orange"
                >
                  Create & Assign Task
                </button>
              </div>
            </form>
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

    </div>
  );
}

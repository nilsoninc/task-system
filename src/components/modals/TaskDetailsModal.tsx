'use client';

import React, { useState } from 'react';
import { useSystem } from '@/context/SystemContext';
import { Task, TaskStatus } from '@/lib/types';
import { formatHoursDecimal, formatDate, formatDurationHuman, getTaskTotalSeconds } from '@/lib/utils';
import {
  X,
  Clock,
  Calendar,
  User,
  AlertTriangle,
  CheckCircle2,
  Square,
  Play,
  Bell,
  Edit,
  Trash2,
  Paperclip,
  ShieldAlert,
  FileText,
  TrendingUp,
  TrendingDown,
  Info
} from 'lucide-react';

interface TaskDetailsModalProps {
  task: Task | null;
  onClose: () => void;
  onEdit?: (task: Task) => void;
}

export const TaskDetailsModal: React.FC<TaskDetailsModalProps> = ({
  task,
  onClose,
  onEdit
}) => {
  const {
    currentUser,
    users,
    tasks,
    projects,
    taskTypes,
    toggleTaskTimer,
    updateTaskStatus,
    deleteTask,
    sendTaskReminder
  } = useSystem();

  const [reminderSent, setReminderSent] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  if (!task || !currentUser) return null;

  const assignee = users.find((u) => u.id === task.assigneeId);
  const creator = users.find((u) => u.id === task.creatorId);
  const project = projects.find((p) => p.id === task.projectId);
  const taskType = taskTypes.find((tt => tt.id === task.typeId));

  const isSuperAdmin = currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'ADMIN_HR';
  const isTeamLead = currentUser.role === 'TEAM_LEADER';
  const isAssignee = task.assigneeId === currentUser.id;

  // Total task time calculations
  const totalLoggedHours = task.loggedHours;
  const estimatedHours = task.estimatedHours || 1;
  const isExceeded = totalLoggedHours > estimatedHours;
  const isCompleted = task.status === 'COMPLETED';

  // Overdue calculation
  const todayStr = new Date().toISOString().split('T')[0];
  const isOverdue = !isCompleted && task.dueDate < todayStr;
  const isDueToday = !isCompleted && task.dueDate === todayStr;

  // Permissions
  const canEdit = isSuperAdmin || isTeamLead || isAssignee;
  const hasStarted = task.loggedHours > 0 || task.worklogs.length > 0 || Boolean(task.isTimerRunning);
  const canDelete = isSuperAdmin || isTeamLead || (isAssignee && !hasStarted);

  const handleDelete = () => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    const res = deleteTask(task.id);
    if (res.success) {
      onClose();
    } else {
      setDeleteError(res.message || 'Cannot delete task');
    }
  };

  const handleReminder = () => {
    sendTaskReminder(task.id);
    setReminderSent(true);
    setTimeout(() => setReminderSent(false), 3000);
  };

  const runningTaskId = tasks.find(t => t.isTimerRunning)?.id;
  const isAnotherRunning = Boolean(runningTaskId && runningTaskId !== task.id);
  const isStartDisabled = Boolean(runningTaskId);
  const totalTaskSecs = getTaskTotalSeconds(task);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-end animate-in fade-in">
      <div className="bg-white w-full max-w-xl h-full p-6 shadow-2xl overflow-y-auto space-y-5 animate-in slide-in-from-right flex flex-col justify-between">
        
        <div className="space-y-5">
          {/* Header */}
          <div className="flex items-start justify-between border-b border-zinc-100 pb-4">
            <div className="space-y-1">
              <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                <span
                  className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase text-white shadow-xs"
                  style={{ backgroundColor: taskType?.color || '#F97316' }}
                >
                  {taskType?.name || 'Task'}
                </span>

                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    task.priority === 'URGENT'
                      ? 'bg-rose-100 text-rose-700 border border-rose-200'
                      : task.priority === 'HIGH'
                      ? 'bg-amber-100 text-amber-800 border border-amber-200'
                      : 'bg-zinc-100 text-zinc-700'
                  }`}
                >
                  {task.priority} Priority
                </span>

                {isOverdue && (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-rose-600 text-white animate-pulse">
                    ⚠️ Overdue Alert
                  </span>
                )}
                {isDueToday && (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-500 text-white">
                    ⏰ Due Today
                  </span>
                )}
              </div>
              <h2 className="text-lg font-black text-zinc-900 leading-snug">{task.title}</h2>
              <p className="text-xs text-zinc-500 font-medium">Project: {project?.name || 'General Project'}</p>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Delete Error Message */}
          {deleteError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center justify-between">
              <span>{deleteError}</span>
              <button onClick={() => setDeleteError(null)} className="text-rose-500 font-bold ml-2">✕</button>
            </div>
          )}

          {/* Timer Exceeded / Healthy Banner & Metric Comparison */}
          <div
            className={`p-4 rounded-2xl border transition-all ${
              isExceeded
                ? 'bg-rose-50/80 border-rose-200 text-rose-900 shadow-sm'
                : 'bg-emerald-50/80 border-emerald-200 text-emerald-900 shadow-sm'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {isExceeded ? (
                  <TrendingUp className="w-5 h-5 text-rose-600 flex-shrink-0" />
                ) : (
                  <TrendingDown className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                )}
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider">
                    {isExceeded ? 'Logged Time Exceeded Estimate (Attention Needed)' : 'Logged Time Within Budget (Optimal)'}
                  </h4>
                  <p className="text-[11px] opacity-80 mt-0.5">
                    {isExceeded
                      ? `Exceeded estimated time by ${(totalLoggedHours - estimatedHours).toFixed(1)}h`
                      : `Remaining budget: ${(estimatedHours - totalLoggedHours).toFixed(1)}h`}
                  </p>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] uppercase font-bold tracking-wider opacity-70 block">Total Time Taken</span>
                <span className={`text-base font-black font-mono block ${isExceeded ? 'text-rose-700' : 'text-emerald-700'}`}>
                  {formatDurationHuman(totalTaskSecs)}
                </span>
                <span className="text-[10px] font-mono opacity-80 block mt-0.5">
                  {formatHoursDecimal(totalLoggedHours)} / {estimatedHours}h
                </span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-white/70 rounded-full h-2 mt-3 overflow-hidden border border-black/5">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  isExceeded ? 'bg-rose-600' : 'bg-emerald-500'
                }`}
                style={{ width: `${Math.min(100, (totalLoggedHours / estimatedHours) * 100)}%` }}
              />
            </div>
          </div>

          {/* Active Live Timer Controller / Start Timer */}
          {task.isTimerRunning ? (
            <div className="p-3.5 bg-gradient-to-r from-brand-500 to-brand-600 text-white rounded-2xl shadow-glow-orange flex items-center justify-between animate-pulse">
              <div className="flex items-center space-x-2.5">
                <Clock className="w-5 h-5 animate-spin" />
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-white/80">Live Timer Running</span>
                  <p className="text-xs font-bold text-white">
                    Active on: {assignee?.name} (Started {task.activeTimerStart ? new Date(task.activeTimerStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'recently'})
                  </p>
                </div>
              </div>
              <button
                onClick={() => toggleTaskTimer(task.id)}
                className="px-3.5 py-1.5 bg-obsidian-950 hover:bg-black text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-md cursor-pointer"
              >
                <Square className="w-3.5 h-3.5 text-rose-500 fill-current" />
                <span>Stop Timer</span>
              </button>
            </div>
          ) : !isCompleted && !isSuperAdmin ? (
            <div className="p-3.5 bg-zinc-50 border border-zinc-200 rounded-2xl flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <Clock className="w-5 h-5 text-brand-500" />
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Live Worklog Timer</span>
                  <p className="text-xs font-bold text-zinc-800">
                    {isStartDisabled ? 'Another task timer is already active. Stop it first to start this task.' : 'Ready to start live work session'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => toggleTaskTimer(task.id)}
                disabled={isStartDisabled}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all ${
                  isStartDisabled
                    ? 'bg-zinc-200 text-zinc-400 cursor-not-allowed border border-zinc-200 opacity-60'
                    : 'bg-brand-500 hover:bg-brand-600 text-white shadow-sm cursor-pointer'
                }`}
                title={isStartDisabled ? 'Another task timer is already running. Stop it first.' : 'Start Timer'}
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Start Timer</span>
              </button>
            </div>
          ) : null}

          {/* Priority & Deadline Notification */}
          {(task.priority === 'URGENT' || task.priority === 'HIGH' || isOverdue) && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2">
                <ShieldAlert className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <span className="text-amber-900 font-medium">
                  {isOverdue
                    ? 'This task passed its deadline. Prioritize immediate completion.'
                    : 'High priority task requiring immediate user focus.'}
                </span>
              </div>
              <button
                onClick={handleReminder}
                disabled={reminderSent}
                className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[11px] font-bold flex items-center space-x-1 flex-shrink-0 shadow-xs cursor-pointer disabled:opacity-50"
              >
                <Bell className="w-3 h-3" />
                <span>{reminderSent ? 'Reminder Sent!' : 'Remind Assignee'}</span>
              </button>
            </div>
          )}

          {/* Meta Info Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl">
              <span className="text-[10px] font-bold uppercase text-zinc-400 block">Assignee</span>
              <div className="flex items-center space-x-1.5 mt-1">
                {assignee?.avatar && (
                  <img src={assignee.avatar} alt={assignee.name} className="w-5 h-5 rounded-full object-cover" />
                )}
                <span className="font-bold text-zinc-900 truncate">{assignee?.name || 'Unassigned'}</span>
              </div>
            </div>

            <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl">
              <span className="text-[10px] font-bold uppercase text-zinc-400 block">Created On</span>
              <span className="font-bold text-zinc-900 mt-1 block">{formatDate(task.createdAt)}</span>
            </div>

            <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl">
              <span className="text-[10px] font-bold uppercase text-zinc-400 block">Start Date</span>
              <span className="font-bold text-zinc-900 mt-1 block">
                {task.startDate ? formatDate(task.startDate) : 'Not specified'}
              </span>
            </div>

            <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl">
              <span className="text-[10px] font-bold uppercase text-zinc-400 block">Due Date</span>
              <span className={`font-bold mt-1 block ${isOverdue ? 'text-rose-600' : 'text-zinc-900'}`}>
                {formatDate(task.dueDate)}
              </span>
            </div>
          </div>

          {/* Description */}
          {task.description && (
            <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl text-xs space-y-1">
              <span className="text-[10px] font-bold uppercase text-zinc-400 block">Description & Specs</span>
              <p className="text-zinc-700 leading-relaxed whitespace-pre-line">{task.description}</p>
            </div>
          )}

          {/* Attachments Section */}
          {task.attachments && task.attachments.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-bold text-xs text-zinc-900 flex items-center gap-1.5">
                <Paperclip className="w-3.5 h-3.5 text-brand-500" /> Attached Documents ({task.attachments.length})
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {task.attachments.map((att) => (
                  <div
                    key={att.id}
                    className="p-2.5 bg-zinc-50 border border-zinc-200 rounded-xl flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center space-x-2 truncate">
                      <FileText className="w-4 h-4 text-brand-500 flex-shrink-0" />
                      <div className="truncate">
                        <p className="font-bold text-zinc-900 truncate">{att.name}</p>
                        <p className="text-[10px] text-zinc-400">{att.size} • {att.type}</p>
                      </div>
                    </div>
                    <span className="text-[10px] bg-zinc-200 text-zinc-700 px-2 py-0.5 rounded font-bold">
                      Attached
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Start-Stop Worklog History Sessions */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-xs text-zinc-900 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-brand-500" /> Live Worklog Sessions ({task.worklogs.length} recorded)
              </h4>
              <span className="text-[10px] font-mono font-bold text-zinc-500">
                Sum: {formatHoursDecimal(totalLoggedHours)}
              </span>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto">
              {task.worklogs.length === 0 ? (
                <div className="p-4 bg-zinc-50 border border-dashed border-zinc-200 rounded-xl text-center text-xs text-zinc-400">
                  No timer sessions recorded yet. Start the live timer to log session work.
                </div>
              ) : (
                task.worklogs.map((wl, index) => (
                  <div
                    key={wl.id || index}
                    className="p-2.5 bg-zinc-50 hover:bg-zinc-100/70 border border-zinc-200 rounded-xl flex items-center justify-between text-xs transition-colors"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-zinc-900">{wl.userName}</span>
                        <span className="text-zinc-400">•</span>
                        <span className="text-[10px] text-zinc-500">{wl.startTime} - {wl.endTime || 'Ongoing'}</span>
                      </div>
                      {wl.notes && <p className="text-[10px] text-zinc-400">{wl.notes}</p>}
                    </div>

                    <span className="font-mono text-xs font-black bg-white border border-zinc-200 px-2 py-1 rounded-lg text-zinc-800">
                      {formatHoursDecimal(wl.durationSeconds / 3600)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions: Status, Edit, Delete */}
        <div className="pt-4 border-t border-zinc-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-zinc-600">Status:</span>
            <select
              value={task.status}
              onChange={(e) => {
                const nextStatus = e.target.value as TaskStatus;
                updateTaskStatus(task.id, nextStatus);
              }}
              className="px-3 py-1.5 bg-zinc-100 border border-zinc-300 rounded-xl font-bold text-zinc-800 focus:outline-none focus:border-brand-500"
            >
              <option value="TODO">To Do</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="IN_REVIEW">In Review</option>
              <option value="COMPLETED">Completed</option>
            </select>
          </div>

          <div className="flex items-center space-x-2">
            {canEdit && onEdit && (
              <button
                onClick={() => onEdit(task)}
                className="px-3.5 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded-xl font-bold flex items-center space-x-1.5 transition-colors cursor-pointer"
              >
                <Edit className="w-3.5 h-3.5 text-zinc-600" />
                <span>Edit</span>
              </button>
            )}

            {canDelete && (
              <button
                onClick={handleDelete}
                className="px-3.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl font-bold flex items-center space-x-1.5 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                <span>{isSuperAdmin ? 'Delete' : isTeamLead ? 'Delete (Queue)' : 'Delete'}</span>
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

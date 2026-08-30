'use client';

import React, { useState } from 'react';
import { useSystem } from '@/context/SystemContext';
import { Task, TaskPriority } from '@/lib/types';
import { SearchableSelect } from '@/components/common/SearchableSelect';
import { X, Edit3, Save } from 'lucide-react';

interface TaskEditModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
}

export const TaskEditModal: React.FC<TaskEditModalProps> = ({
  task,
  isOpen,
  onClose
}) => {
  const {
    currentUser,
    users,
    projects,
    taskTypes,
    myTeamMemberIds,
    editTask
  } = useSystem();

  const [title, setTitle] = useState(task?.title || '');
  const [description, setDescription] = useState(task?.description || '');
  const [projectId, setProjectId] = useState(task?.projectId || projects[0]?.id || '');
  const [typeId, setTypeId] = useState(task?.typeId || taskTypes[0]?.id || '');
  const [assigneeId, setAssigneeId] = useState(task?.assigneeId || '');
  const [priority, setPriority] = useState<TaskPriority>(task?.priority || 'MEDIUM');
  const [estimatedHours, setEstimatedHours] = useState(task?.estimatedHours || 8);
  const [startDate, setStartDate] = useState(task?.startDate || '');
  const [dueDate, setDueDate] = useState(task?.dueDate || '');

  // Sync state if task changes
  React.useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || '');
      setProjectId(task.projectId);
      setTypeId(task.typeId);
      setAssigneeId(task.assigneeId);
      setPriority(task.priority);
      setEstimatedHours(task.estimatedHours);
      setStartDate(task.startDate || '');
      setDueDate(task.dueDate);
    }
  }, [task]);

  if (!isOpen || !task || !currentUser) return null;

  const isSuperAdmin = currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'ADMIN_HR';
  const isTeamLead = currentUser.role === 'TEAM_LEADER';

  // Allowed assignees
  const availableAssignees = isSuperAdmin
    ? users
    : isTeamLead
    ? users.filter(u => myTeamMemberIds.includes(u.id) || u.id === currentUser.id)
    : [currentUser];

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    editTask(task.id, {
      title,
      description,
      projectId,
      typeId,
      assigneeId,
      priority,
      estimatedHours: Number(estimatedHours),
      startDate: startDate || undefined,
      dueDate
    });

    onClose();
  };

  const projectOptions = projects.map(p => ({
    value: p.id,
    label: p.name,
    subLabel: `Status: ${p.status}`
  }));

  const taskTypeOptions = taskTypes.map(tt => ({
    value: tt.id,
    label: tt.name,
    color: tt.color,
    subLabel: tt.code
  }));

  const userOptions = availableAssignees.map(u => ({
    value: u.id,
    label: u.name,
    avatar: u.avatar,
    subLabel: u.role.replace('_', ' ')
  }));

  const priorityOptions = [
    { value: 'LOW', label: 'Low Priority', color: '#10B981' },
    { value: 'MEDIUM', label: 'Medium Priority', color: '#3B82F6' },
    { value: 'HIGH', label: 'High Priority', color: '#F59E0B' },
    { value: 'URGENT', label: 'Urgent Priority', color: '#EF4444' }
  ];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95">
        <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
          <h3 className="font-bold text-base text-zinc-900 flex items-center gap-2">
            <Edit3 className="w-5 h-5 text-brand-500" /> Edit Task Details
          </h3>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-3.5 text-xs">
          <div>
            <label className="font-bold text-zinc-700 block mb-1">Task Title *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-zinc-200 rounded-xl focus:border-brand-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="font-bold text-zinc-700 block mb-1">Description</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-zinc-200 rounded-xl focus:border-brand-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <SearchableSelect
              label="Project"
              options={projectOptions}
              value={projectId}
              onChange={setProjectId}
            />
            <SearchableSelect
              label="Task Type"
              options={taskTypeOptions}
              value={typeId}
              onChange={setTypeId}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <SearchableSelect
              label="Assignee"
              options={userOptions}
              value={assigneeId}
              onChange={setAssigneeId}
              disabled={!isSuperAdmin && !isTeamLead}
            />
            <SearchableSelect
              label="Priority"
              options={priorityOptions}
              value={priority}
              onChange={(val) => setPriority(val as TaskPriority)}
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="font-bold text-zinc-700 block mb-1">Est. Hours</label>
              <input
                type="number"
                step="0.5"
                min="0.5"
                required
                value={estimatedHours}
                onChange={(e) => setEstimatedHours(Number(e.target.value))}
                className="w-full px-3 py-2 border border-zinc-200 rounded-xl focus:border-brand-500"
              />
            </div>
            <div>
              <label className="font-bold text-zinc-700 block mb-1">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-zinc-200 rounded-xl focus:border-brand-500"
              />
            </div>
            <div>
              <label className="font-bold text-zinc-700 block mb-1">Due Date *</label>
              <input
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 border border-zinc-200 rounded-xl focus:border-brand-500"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-zinc-100 flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-zinc-600 hover:bg-zinc-100 rounded-xl cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-xl font-bold flex items-center space-x-1.5 shadow-glow-orange cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

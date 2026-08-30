'use client';

import React, { useState, useMemo } from 'react';
import { useSystem } from '@/context/SystemContext';
import { Project, ProjectStatus, ProjectTypeMaster, TaskTypeMaster, ProjectDocument } from '@/lib/types';
import { formatDate } from '@/lib/utils';
import {
  FolderKanban,
  Plus,
  Layers,
  CheckSquare,
  Building,
  Calendar,
  Clock,
  X,
  Search,
  Filter,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Edit,
  Trash2,
  Eye,
  FileText,
  Paperclip,
  Users,
  User,
  CheckCircle2,
  AlertCircle,
  Clock3,
  PauseCircle,
  AlertTriangle,
  Download,
  Upload,
  ChevronRight
} from 'lucide-react';

const STATUS_CONFIG: Record<ProjectStatus, { label: string; bg: string; text: string; border: string; icon: any }> = {
  NOT_STARTED: {
    label: 'Not Started',
    bg: 'bg-zinc-100',
    text: 'text-zinc-700',
    border: 'border-zinc-300',
    icon: Clock3
  },
  PENDING: {
    label: 'Pending',
    bg: 'bg-amber-100',
    text: 'text-amber-800',
    border: 'border-amber-300',
    icon: AlertCircle
  },
  IN_PROGRESS: {
    label: 'In Progress',
    bg: 'bg-blue-100',
    text: 'text-blue-800',
    border: 'border-blue-300',
    icon: Clock
  },
  ON_HOLD: {
    label: 'On Hold',
    bg: 'bg-orange-100',
    text: 'text-orange-800',
    border: 'border-orange-300',
    icon: PauseCircle
  },
  DELAYED: {
    label: 'Delayed',
    bg: 'bg-rose-100',
    text: 'text-rose-800',
    border: 'border-rose-300',
    icon: AlertTriangle
  },
  COMPLETED: {
    label: 'Completed',
    bg: 'bg-emerald-100',
    text: 'text-emerald-800',
    border: 'border-emerald-300',
    icon: CheckCircle2
  }
};

type SortField = 'name' | 'type' | 'estimatedHours' | 'startDate' | 'status' | 'taskCount';
type SortDirection = 'asc' | 'desc';

export default function ProjectsPage() {
  const {
    currentUser,
    projects,
    projectTypes,
    taskTypes,
    tasks,
    teams,
    users,
    addProject,
    editProject,
    deleteProject,
    addProjectType,
    editProjectType,
    deleteProjectType,
    addTaskType,
    editTaskType,
    deleteTaskType
  } = useSystem();

  const [activeTab, setActiveTab] = useState<'projects' | 'project-types' | 'task-types'>('projects');

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterTeam, setFilterTeam] = useState<string>('ALL');
  const [filterCompletionDate, setFilterCompletionDate] = useState<string>('');

  // Table Sorting state
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // Modals state
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [viewingProject, setViewingProject] = useState<Project | null>(null);

  const [showProjectTypeModal, setShowProjectTypeModal] = useState(false);
  const [editingProjectType, setEditingProjectType] = useState<ProjectTypeMaster | null>(null);

  const [showTaskTypeModal, setShowTaskTypeModal] = useState(false);
  const [editingTaskType, setEditingTaskType] = useState<TaskTypeMaster | null>(null);

  // Project Form States
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formTypeId, setFormTypeId] = useState('');
  const [formEstimatedHours, setFormEstimatedHours] = useState<number>(40);
  const [formAssignmentType, setFormAssignmentType] = useState<'TEAM' | 'INDIVIDUAL'>('TEAM');
  const [formTeamId, setFormTeamId] = useState('');
  const [formAssignedUserIds, setFormAssignedUserIds] = useState<string[]>([]);
  const [formDocuments, setFormDocuments] = useState<ProjectDocument[]>([]);
  const [formStartDate, setFormStartDate] = useState('');
  const [formEndDate, setFormEndDate] = useState('');
  const [formCompletionDate, setFormCompletionDate] = useState('');
  const [formStatus, setFormStatus] = useState<ProjectStatus>('NOT_STARTED');

  // Master Type Form States
  const [ptName, setPtName] = useState('');
  const [ptCode, setPtCode] = useState('');
  const [ptColor, setPtColor] = useState('#F97316');
  const [ptDesc, setPtDesc] = useState('');

  const [ttName, setTtName] = useState('');
  const [ttCode, setTtCode] = useState('');
  const [ttColor, setTtColor] = useState('#10B981');
  const [ttDesc, setTtDesc] = useState('');

  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showFeedback = (text: string, type: 'success' | 'error' = 'success') => {
    setFeedbackMessage({ type, text });
    setTimeout(() => setFeedbackMessage(null), 4000);
  };

  if (!currentUser) return null;
  const isSuperAdmin = currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'ADMIN_HR';

  // Open Create Project Modal
  const openCreateProject = () => {
    setEditingProject(null);
    setFormName('');
    setFormDescription('');
    setFormTypeId(projectTypes[0]?.id || '');
    setFormEstimatedHours(40);
    setFormAssignmentType('TEAM');
    setFormTeamId(teams[0]?.id || '');
    setFormAssignedUserIds([]);
    setFormDocuments([]);
    const today = new Date().toISOString().split('T')[0];
    setFormStartDate(today);
    setFormEndDate('');
    setFormCompletionDate('');
    setFormStatus('NOT_STARTED');
    setShowProjectModal(true);
  };

  // Open Edit Project Modal
  const openEditProject = (p: Project) => {
    setEditingProject(p);
    setFormName(p.name);
    setFormDescription(p.description || '');
    setFormTypeId(p.typeId);
    setFormEstimatedHours(p.estimatedHours || 0);
    setFormAssignmentType(p.assignmentType || 'TEAM');
    setFormTeamId(p.teamId || teams[0]?.id || '');
    setFormAssignedUserIds(p.assignedUserIds || []);
    setFormDocuments(p.documents || []);
    setFormStartDate(p.startDate || '');
    setFormEndDate(p.endDate || p.deadline || '');
    setFormCompletionDate(p.completionDate || '');
    setFormStatus(p.status || 'NOT_STARTED');
    setShowProjectModal(true);
  };

  // Status Change Handler in Form (Auto set completion date when Completed)
  const handleStatusChange = (newStatus: ProjectStatus) => {
    setFormStatus(newStatus);
    if (newStatus === 'COMPLETED' && !formCompletionDate) {
      setFormCompletionDate(new Date().toISOString().split('T')[0]);
    } else if (newStatus !== 'COMPLETED' && formStatus === 'COMPLETED') {
      setFormCompletionDate('');
    }
  };

  // Multiple File Upload Handler (docx, xlsx, pptx, pdf, zip, rar, images)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const sizeFormatted =
          file.size > 1024 * 1024
            ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
            : `${Math.round(file.size / 1024)} KB`;

        const newDoc: ProjectDocument = {
          id: `pdoc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          name: file.name,
          size: sizeFormatted,
          type: file.type || 'application/octet-stream',
          dataUrl: reader.result as string,
          uploadDate: new Date().toISOString().split('T')[0]
        };

        setFormDocuments((prev) => [...prev, newDoc]);
      };
      reader.readAsDataURL(file);
    });

    e.target.value = '';
  };

  const handleRemoveDoc = (docId: string) => {
    setFormDocuments((prev) => prev.filter((d) => d.id !== docId));
  };

  // Save Project (Create or Edit)
  const handleSaveProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      showFeedback('Project Name is required', 'error');
      return;
    }

    const payload: Omit<Project, 'id' | 'progress'> = {
      name: formName.trim(),
      description: formDescription.trim(),
      typeId: formTypeId,
      estimatedHours: Number(formEstimatedHours) || 0,
      assignmentType: formAssignmentType,
      teamId: formAssignmentType === 'TEAM' ? formTeamId : '',
      assignedUserIds: formAssignmentType === 'INDIVIDUAL' ? formAssignedUserIds : [],
      documents: formDocuments,
      startDate: formStartDate,
      endDate: formEndDate,
      completionDate: formStatus === 'COMPLETED' ? (formCompletionDate || new Date().toISOString().split('T')[0]) : '',
      status: formStatus,
      clientName: formAssignmentType === 'TEAM' ? (teams.find(t => t.id === formTeamId)?.name || 'Team') : 'Individual Assignees',
      deadline: formEndDate,
      budget: 0
    };

    if (editingProject) {
      editProject(editingProject.id, payload);
      showFeedback(`Project "${formName}" updated successfully.`);
    } else {
      addProject(payload);
      showFeedback(`Project "${formName}" created successfully.`);
    }

    setShowProjectModal(false);
  };

  // Delete Project Handler
  const handleDeleteProject = (p: Project) => {
    if (confirm(`Are you sure you want to delete Project "${p.name}"? This action cannot be undone.`)) {
      const res = deleteProject(p.id);
      if (res.success) {
        showFeedback(`Project "${p.name}" deleted successfully.`);
      } else {
        showFeedback(res.message || 'Failed to delete project.', 'error');
      }
    }
  };

  // ── Project Type Master Handlers ──
  const openCreateProjectType = () => {
    setEditingProjectType(null);
    setPtName('');
    setPtCode('');
    setPtColor('#F97316');
    setPtDesc('');
    setShowProjectTypeModal(true);
  };

  const openEditProjectType = (pt: ProjectTypeMaster) => {
    setEditingProjectType(pt);
    setPtName(pt.name);
    setPtCode(pt.code);
    setPtColor(pt.color);
    setPtDesc(pt.description);
    setShowProjectTypeModal(true);
  };

  const handleSaveProjectType = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ptName.trim()) return;

    if (editingProjectType) {
      editProjectType(editingProjectType.id, {
        name: ptName.trim(),
        code: ptCode.trim().toUpperCase() || ptName.substring(0, 4).toUpperCase(),
        color: ptColor,
        description: ptDesc.trim()
      });
      showFeedback(`Project Type "${ptName}" updated.`);
    } else {
      addProjectType({
        name: ptName.trim(),
        code: ptCode.trim().toUpperCase() || ptName.substring(0, 4).toUpperCase(),
        color: ptColor,
        description: ptDesc.trim()
      });
      showFeedback(`Project Type "${ptName}" added.`);
    }
    setShowProjectTypeModal(false);
  };

  const handleDeleteProjectType = (pt: ProjectTypeMaster) => {
    if (confirm(`Are you sure you want to delete Project Type "${pt.name}"?`)) {
      const res = deleteProjectType(pt.id);
      if (res.success) {
        showFeedback(`Project Type "${pt.name}" deleted.`);
      } else {
        showFeedback(res.message || 'Cannot delete this Project Type.', 'error');
      }
    }
  };

  // ── Task Type Master Handlers ──
  const openCreateTaskType = () => {
    setEditingTaskType(null);
    setTtName('');
    setTtCode('');
    setTtColor('#10B981');
    setTtDesc('');
    setShowTaskTypeModal(true);
  };

  const openEditTaskType = (tt: TaskTypeMaster) => {
    setEditingTaskType(tt);
    setTtName(tt.name);
    setTtCode(tt.code);
    setTtColor(tt.color);
    setTtDesc(tt.description);
    setShowTaskTypeModal(true);
  };

  const handleSaveTaskType = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ttName.trim()) return;

    if (editingTaskType) {
      editTaskType(editingTaskType.id, {
        name: ttName.trim(),
        code: ttCode.trim().toUpperCase() || ttName.substring(0, 4).toUpperCase(),
        color: ttColor,
        description: ttDesc.trim()
      });
      showFeedback(`Task Type "${ttName}" updated.`);
    } else {
      addTaskType({
        name: ttName.trim(),
        code: ttCode.trim().toUpperCase() || ttName.substring(0, 4).toUpperCase(),
        color: ttColor,
        description: ttDesc.trim()
      });
      showFeedback(`Task Type "${ttName}" added.`);
    }
    setShowTaskTypeModal(false);
  };

  const handleDeleteTaskType = (tt: TaskTypeMaster) => {
    if (confirm(`Are you sure you want to delete Task Type "${tt.name}"?`)) {
      const res = deleteTaskType(tt.id);
      if (res.success) {
        showFeedback(`Task Type "${tt.name}" deleted.`);
      } else {
        showFeedback(res.message || 'Cannot delete this Task Type.', 'error');
      }
    }
  };

  // Sorting helper
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Filtered & Sorted Projects
  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      // Search Name
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchName = p.name.toLowerCase().includes(query);
        const matchDesc = (p.description || '').toLowerCase().includes(query);
        if (!matchName && !matchDesc) return false;
      }

      // Filter Type
      if (filterType !== 'ALL' && p.typeId !== filterType) {
        return false;
      }

      // Filter Status
      if (filterStatus !== 'ALL' && p.status !== filterStatus) {
        return false;
      }

      // Filter Team
      if (filterTeam !== 'ALL') {
        if (p.assignmentType === 'TEAM' && p.teamId !== filterTeam) return false;
        if (p.assignmentType === 'INDIVIDUAL') {
          // Check if any assigned user belongs to this team
          const teamUsers = users.filter((u) => u.teamId === filterTeam).map((u) => u.id);
          const hasUserInTeam = (p.assignedUserIds || []).some((uId) => teamUsers.includes(uId));
          if (!hasUserInTeam) return false;
        }
      }

      // Filter Completion Date
      if (filterCompletionDate) {
        if (!p.completionDate || !p.completionDate.startsWith(filterCompletionDate)) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      let valA: any = '';
      let valB: any = '';

      if (sortField === 'name') {
        valA = a.name.toLowerCase();
        valB = b.name.toLowerCase();
      } else if (sortField === 'type') {
        const typeA = projectTypes.find((pt) => pt.id === a.typeId)?.name || '';
        const typeB = projectTypes.find((pt) => pt.id === b.typeId)?.name || '';
        valA = typeA.toLowerCase();
        valB = typeB.toLowerCase();
      } else if (sortField === 'estimatedHours') {
        valA = a.estimatedHours || 0;
        valB = b.estimatedHours || 0;
      } else if (sortField === 'startDate') {
        valA = a.startDate || '';
        valB = b.startDate || '';
      } else if (sortField === 'status') {
        valA = a.status || '';
        valB = b.status || '';
      } else if (sortField === 'taskCount') {
        valA = tasks.filter((t) => t.projectId === a.id && !t.isSoftDeleted).length;
        valB = tasks.filter((t) => t.projectId === b.id && !t.isSoftDeleted).length;
      }

      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [projects, searchQuery, filterType, filterStatus, filterTeam, filterCompletionDate, sortField, sortDirection, projectTypes, tasks, users]);

  const hasActiveFilters = searchQuery || filterType !== 'ALL' || filterStatus !== 'ALL' || filterTeam !== 'ALL' || filterCompletionDate;

  const clearAllFilters = () => {
    setSearchQuery('');
    setFilterType('ALL');
    setFilterStatus('ALL');
    setFilterTeam('ALL');
    setFilterCompletionDate('');
  };

  return (
    <div className="space-y-6">
      {/* Toast Feedback Notification */}
      {feedbackMessage && (
        <div
          className={`p-4 rounded-2xl text-xs font-bold flex items-center justify-between border shadow-lg transition-all animate-in fade-in ${
            feedbackMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          <div className="flex items-center space-x-2">
            {feedbackMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600" />
            )}
            <span>{feedbackMessage.text}</span>
          </div>
          <button onClick={() => setFeedbackMessage(null)} className="text-zinc-400 hover:text-zinc-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-zinc-900 tracking-tight flex items-center gap-2">
            <FolderKanban className="w-6 h-6 text-brand-500" /> Projects & System Masters
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            Manage projects with estimated hours, team/individual assignment, document attachments, and lifecycle status.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {activeTab === 'projects' && (
            <button
              onClick={openCreateProject}
              className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-xs font-bold shadow-glow-orange cursor-pointer flex items-center space-x-1.5 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Project</span>
            </button>
          )}

          {activeTab === 'project-types' && (
            <button
              onClick={openCreateProjectType}
              className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-xs font-bold shadow-glow-orange cursor-pointer flex items-center space-x-1.5 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Add Project Type Master</span>
            </button>
          )}

          {activeTab === 'task-types' && (
            <button
              onClick={openCreateTaskType}
              className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-xs font-bold shadow-glow-orange cursor-pointer flex items-center space-x-1.5 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Add Task Type Master</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="border-b border-zinc-200 flex items-center space-x-6 text-xs font-bold">
        <button
          onClick={() => setActiveTab('projects')}
          className={`pb-3 border-b-2 cursor-pointer transition-colors ${
            activeTab === 'projects'
              ? 'border-brand-500 text-brand-600 font-extrabold'
              : 'border-transparent text-zinc-500 hover:text-zinc-900'
          }`}
        >
          Projects ({projects.length})
        </button>

        <button
          onClick={() => setActiveTab('project-types')}
          className={`pb-3 border-b-2 cursor-pointer transition-colors ${
            activeTab === 'project-types'
              ? 'border-brand-500 text-brand-600 font-extrabold'
              : 'border-transparent text-zinc-500 hover:text-zinc-900'
          }`}
        >
          Project Types Master ({projectTypes.length})
        </button>

        <button
          onClick={() => setActiveTab('task-types')}
          className={`pb-3 border-b-2 cursor-pointer transition-colors ${
            activeTab === 'task-types'
              ? 'border-brand-500 text-brand-600 font-extrabold'
              : 'border-transparent text-zinc-500 hover:text-zinc-900'
          }`}
        >
          Task Types Master ({taskTypes.length})
        </button>
      </div>

      {/* Tab 1: Projects (Table Format) */}
      {activeTab === 'projects' && (
        <div className="space-y-4">
          {/* Search & Filters Bar */}
          <div className="card-clean p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-xs font-bold text-zinc-800">
                <Filter className="w-4 h-4 text-brand-500" />
                <span>Search & Filters</span>
              </div>
              {hasActiveFilters && (
                <button
                  onClick={clearAllFilters}
                  className="text-[11px] font-bold text-rose-600 hover:text-rose-700 cursor-pointer"
                >
                  Clear All Filters
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
              {/* Search by Name */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-3 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search project name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 border border-zinc-200 rounded-xl bg-zinc-50 focus:bg-white focus:border-brand-500 text-xs"
                />
              </div>

              {/* Filter by Project Type */}
              <div>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-xl bg-zinc-50 focus:bg-white focus:border-brand-500 text-xs font-medium"
                >
                  <option value="ALL">All Project Types</option>
                  {projectTypes.map((pt) => (
                    <option key={pt.id} value={pt.id}>
                      {pt.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filter by Status */}
              <div>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-xl bg-zinc-50 focus:bg-white focus:border-brand-500 text-xs font-medium"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="NOT_STARTED">Not Started</option>
                  <option value="PENDING">Pending</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="ON_HOLD">On Hold</option>
                  <option value="DELAYED">Delayed</option>
                  <option value="COMPLETED">Completed</option>
                </select>
              </div>

              {/* Filter by Assigned Team */}
              <div>
                <select
                  value={filterTeam}
                  onChange={(e) => setFilterTeam(e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-xl bg-zinc-50 focus:bg-white focus:border-brand-500 text-xs font-medium"
                >
                  <option value="ALL">All Assigned Teams</option>
                  {teams.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filter by Completion Date */}
              <div>
                <input
                  type="date"
                  title="Filter by completion date"
                  placeholder="Completion Date"
                  value={filterCompletionDate}
                  onChange={(e) => setFilterCompletionDate(e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-xl bg-zinc-50 focus:bg-white focus:border-brand-500 text-xs"
                />
              </div>
            </div>
          </div>

          {/* Project List Table */}
          <div className="card-clean overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-zinc-200 bg-zinc-50 text-[11px] font-bold text-zinc-500 uppercase tracking-wider select-none">
                    <th
                      className="py-3 px-4 cursor-pointer hover:text-zinc-900 transition-colors"
                      onClick={() => handleSort('name')}
                    >
                      <div className="flex items-center space-x-1.5">
                        <span>Name & Type</span>
                        {sortField === 'name' ? (
                          sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-brand-500" /> : <ArrowDown className="w-3 h-3 text-brand-500" />
                        ) : (
                          <ArrowUpDown className="w-3 h-3 text-zinc-300" />
                        )}
                      </div>
                    </th>

                    <th
                      className="py-3 px-4 cursor-pointer hover:text-zinc-900 transition-colors text-right"
                      onClick={() => handleSort('estimatedHours')}
                    >
                      <div className="flex items-center justify-end space-x-1.5">
                        <span>Estimated Hrs.</span>
                        {sortField === 'estimatedHours' ? (
                          sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-brand-500" /> : <ArrowDown className="w-3 h-3 text-brand-500" />
                        ) : (
                          <ArrowUpDown className="w-3 h-3 text-zinc-300" />
                        )}
                      </div>
                    </th>

                    <th
                      className="py-3 px-4 cursor-pointer hover:text-zinc-900 transition-colors"
                      onClick={() => handleSort('startDate')}
                    >
                      <div className="flex items-center space-x-1.5">
                        <span>Start Date</span>
                        {sortField === 'startDate' ? (
                          sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-brand-500" /> : <ArrowDown className="w-3 h-3 text-brand-500" />
                        ) : (
                          <ArrowUpDown className="w-3 h-3 text-zinc-300" />
                        )}
                      </div>
                    </th>

                    <th
                      className="py-3 px-4 cursor-pointer hover:text-zinc-900 transition-colors"
                      onClick={() => handleSort('status')}
                    >
                      <div className="flex items-center space-x-1.5">
                        <span>Status</span>
                        {sortField === 'status' ? (
                          sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-brand-500" /> : <ArrowDown className="w-3 h-3 text-brand-500" />
                        ) : (
                          <ArrowUpDown className="w-3 h-3 text-zinc-300" />
                        )}
                      </div>
                    </th>

                    <th className="py-3 px-4">
                      <span>Assign To</span>
                    </th>

                    <th
                      className="py-3 px-4 cursor-pointer hover:text-zinc-900 transition-colors text-center"
                      onClick={() => handleSort('taskCount')}
                    >
                      <div className="flex items-center justify-center space-x-1.5">
                        <span>Task Count</span>
                        {sortField === 'taskCount' ? (
                          sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-brand-500" /> : <ArrowDown className="w-3 h-3 text-brand-500" />
                        ) : (
                          <ArrowUpDown className="w-3 h-3 text-zinc-300" />
                        )}
                      </div>
                    </th>

                    <th className="py-3 px-4 text-right">
                      <span>Action</span>
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-zinc-100 text-xs">
                  {filteredProjects.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-zinc-400">
                        <FolderKanban className="w-8 h-8 mx-auto text-zinc-300 mb-2" />
                        <p className="font-semibold">No projects found matching your criteria.</p>
                        {hasActiveFilters && (
                          <button
                            onClick={clearAllFilters}
                            className="mt-2 text-xs font-bold text-brand-600 hover:text-brand-700 cursor-pointer"
                          >
                            Reset search filters
                          </button>
                        )}
                      </td>
                    </tr>
                  ) : (
                    filteredProjects.map((p) => {
                      const pType = projectTypes.find((pt) => pt.id === p.typeId);
                      const team = teams.find((t) => t.id === p.teamId);
                      const projectTasks = tasks.filter((t) => t.projectId === p.id && !t.isSoftDeleted);
                      const statusConfig = STATUS_CONFIG[p.status] || STATUS_CONFIG.NOT_STARTED;
                      const StatusIcon = statusConfig.icon;

                      return (
                        <tr key={p.id} className="hover:bg-zinc-50/80 transition-colors">
                          {/* Name & Type */}
                          <td className="py-3 px-4">
                            <div className="space-y-1">
                              <div className="flex items-center space-x-2">
                                <span
                                  onClick={() => setViewingProject(p)}
                                  className="font-bold text-zinc-900 hover:text-brand-600 cursor-pointer transition-colors leading-snug"
                                >
                                  {p.name}
                                </span>
                                {pType && (
                                  <span
                                    className="px-2 py-0.5 rounded text-[9px] font-bold text-white uppercase shadow-xs flex-shrink-0"
                                    style={{ backgroundColor: pType.color || '#F97316' }}
                                  >
                                    {pType.name}
                                  </span>
                                )}
                              </div>
                              {p.description && (
                                <p className="text-[11px] text-zinc-500 line-clamp-1 max-w-sm">
                                  {p.description}
                                </p>
                              )}
                              {(p.documents && p.documents.length > 0) && (
                                <span className="inline-flex items-center gap-1 text-[10px] text-zinc-400">
                                  <Paperclip className="w-3 h-3" />
                                  <span>{p.documents.length} document(s)</span>
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Estimated Hrs. */}
                          <td className="py-3 px-4 text-right">
                            <span className="font-mono font-bold text-zinc-900 bg-zinc-100 px-2 py-1 rounded-lg">
                              {p.estimatedHours || 0} hrs
                            </span>
                          </td>

                          {/* Start Date & End Date */}
                          <td className="py-3 px-4">
                            <div>
                              <span className="font-medium text-zinc-800">{formatDate(p.startDate)}</span>
                              {p.endDate && (
                                <span className="text-[10px] text-zinc-400 block">
                                  End: {formatDate(p.endDate)}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Status */}
                          <td className="py-3 px-4">
                            <div className="space-y-0.5">
                              <span
                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}
                              >
                                <StatusIcon className="w-3 h-3" />
                                <span>{statusConfig.label}</span>
                              </span>
                              {p.status === 'COMPLETED' && p.completionDate && (
                                <span className="text-[10px] text-emerald-700 block font-medium">
                                  Done: {formatDate(p.completionDate)}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Assign To (Team or Count of Users) */}
                          <td className="py-3 px-4">
                            {p.assignmentType === 'TEAM' ? (
                              <div className="flex items-center space-x-1.5">
                                <Users className="w-3.5 h-3.5 text-brand-500" />
                                <div>
                                  <span className="font-bold text-zinc-800">{team?.name || 'Unassigned Team'}</span>
                                  {team && (
                                    <span className="text-[10px] text-zinc-400 block">
                                      {team.memberIds.length} member(s)
                                    </span>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center space-x-1.5">
                                <User className="w-3.5 h-3.5 text-blue-500" />
                                <div>
                                  <span className="font-bold text-zinc-800">
                                    {(p.assignedUserIds || []).length} Individual(s)
                                  </span>
                                  <div className="flex items-center -space-x-1 mt-0.5">
                                    {(p.assignedUserIds || []).slice(0, 3).map((uId) => {
                                      const u = users.find((usr) => usr.id === uId);
                                      if (!u) return null;
                                      return (
                                        <img
                                          key={u.id}
                                          src={u.avatar}
                                          alt={u.name}
                                          title={u.name}
                                          className="w-4 h-4 rounded-full border border-white object-cover"
                                        />
                                      );
                                    })}
                                    {(p.assignedUserIds || []).length > 3 && (
                                      <span className="w-4 h-4 rounded-full bg-zinc-200 text-[9px] flex items-center justify-center font-bold text-zinc-600">
                                        +{(p.assignedUserIds || []).length - 3}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}
                          </td>

                          {/* Task Count */}
                          <td className="py-3 px-4 text-center">
                            <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-zinc-100 text-zinc-800">
                              {projectTasks.length}
                            </span>
                          </td>

                          {/* Actions (View, Edit, Del) */}
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end space-x-1">
                              <button
                                onClick={() => setViewingProject(p)}
                                className="p-1.5 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg cursor-pointer transition-colors"
                                title="View Project Details"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={() => openEditProject(p)}
                                className="p-1.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg cursor-pointer transition-colors"
                                title="Edit Project"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>

                              {isSuperAdmin && (
                                <button
                                  onClick={() => handleDeleteProject(p)}
                                  className="p-1.5 text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg cursor-pointer transition-colors"
                                  title="Delete Project"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Table Footer Summary */}
            <div className="p-3 bg-zinc-50 border-t border-zinc-100 flex items-center justify-between text-xs text-zinc-500">
              <span>
                Showing <strong>{filteredProjects.length}</strong> of <strong>{projects.length}</strong> project(s)
              </span>
              <span>Sorted by {sortField} ({sortDirection.toUpperCase()})</span>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Project Types Master */}
      {activeTab === 'project-types' && (
        <div className="card-clean p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
            <div>
              <h3 className="font-bold text-sm text-zinc-900 flex items-center gap-2">
                <Layers className="w-4 h-4 text-brand-500" /> Project Types Master Register
              </h3>
              <p className="text-xs text-zinc-500">Create, modify or remove Project Type classifications</p>
            </div>
            <button
              onClick={openCreateProjectType}
              className="px-3 py-1.5 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-xs font-bold cursor-pointer flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Project Type Master</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {projectTypes.map((pt) => {
              const assignedCount = projects.filter((p) => p.typeId === pt.id).length;

              return (
                <div
                  key={pt.id}
                  className="p-4 bg-zinc-50 border border-zinc-200 rounded-2xl flex items-start justify-between space-x-3 transition-all hover:border-zinc-300"
                >
                  <div className="flex items-start space-x-3 flex-1">
                    <div className="w-4 h-4 rounded-full mt-0.5 flex-shrink-0 shadow-xs" style={{ backgroundColor: pt.color }} />
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-extrabold text-sm text-zinc-900">{pt.name}</h4>
                        <span className="font-mono text-[10px] font-bold bg-zinc-200 text-zinc-800 px-1.5 py-0.5 rounded">
                          {pt.code}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-500">{pt.description || 'No description provided.'}</p>
                      <p className="text-[10px] font-semibold text-zinc-400">
                        Used in {assignedCount} project(s)
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => openEditProjectType(pt)}
                      className="p-1.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg cursor-pointer"
                      title="Edit Project Type"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    {isSuperAdmin && (
                      <button
                        onClick={() => handleDeleteProjectType(pt)}
                        className="p-1.5 text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg cursor-pointer"
                        title="Delete Project Type"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 3: Task Types Master */}
      {activeTab === 'task-types' && (
        <div className="card-clean p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
            <div>
              <h3 className="font-bold text-sm text-zinc-900 flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-brand-500" /> Task Types Master Register
              </h3>
              <p className="text-xs text-zinc-500">Create, modify or remove Task Type categories</p>
            </div>
            <button
              onClick={openCreateTaskType}
              className="px-3 py-1.5 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-xs font-bold cursor-pointer flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Task Type Master</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {taskTypes.map((tt) => {
              const assignedCount = tasks.filter((t) => t.typeId === tt.id && !t.isSoftDeleted).length;

              return (
                <div
                  key={tt.id}
                  className="p-4 bg-zinc-50 border border-zinc-200 rounded-2xl flex items-start justify-between space-x-3 transition-all hover:border-zinc-300"
                >
                  <div className="flex items-start space-x-3 flex-1">
                    <div className="w-4 h-4 rounded-full mt-0.5 flex-shrink-0 shadow-xs" style={{ backgroundColor: tt.color }} />
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-extrabold text-sm text-zinc-900">{tt.name}</h4>
                        <span className="font-mono text-[10px] font-bold bg-zinc-200 text-zinc-800 px-1.5 py-0.5 rounded">
                          {tt.code}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-500">{tt.description || 'No description provided.'}</p>
                      <p className="text-[10px] font-semibold text-zinc-400">
                        Used in {assignedCount} task(s)
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => openEditTaskType(tt)}
                      className="p-1.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg cursor-pointer"
                      title="Edit Task Type"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    {isSuperAdmin && (
                      <button
                        onClick={() => handleDeleteTaskType(tt)}
                        className="p-1.5 text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg cursor-pointer"
                        title="Delete Task Type"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Create / Edit Project Modal */}
      {showProjectModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <h3 className="font-bold text-base text-zinc-900 flex items-center gap-2">
                <FolderKanban className="w-5 h-5 text-brand-500" />
                {editingProject ? 'Edit Project' : 'Create New Project'}
              </h3>
              <button
                onClick={() => setShowProjectModal(false)}
                className="text-zinc-400 hover:text-zinc-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProject} className="space-y-4 text-xs">
              {/* Name */}
              <div>
                <label className="font-bold text-zinc-700 block mb-1">Project Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Next.js SaaS Analytics Platform"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-xl focus:border-brand-500 font-semibold"
                />
              </div>

              {/* Description */}
              <div>
                <label className="font-bold text-zinc-700 block mb-1">Description</label>
                <textarea
                  rows={3}
                  placeholder="Provide scope, deliverables, and architecture details..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-xl focus:border-brand-500"
                />
              </div>

              {/* Project Type & Estimated Hours */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-zinc-700 block mb-1">Project Type *</label>
                  <select
                    value={formTypeId}
                    onChange={(e) => setFormTypeId(e.target.value)}
                    className="w-full px-3 py-2 border border-zinc-200 rounded-xl focus:border-brand-500 font-semibold"
                  >
                    {projectTypes.map((pt) => (
                      <option key={pt.id} value={pt.id}>
                        {pt.name} ({pt.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-zinc-700 block mb-1">Estimated Hours *</label>
                  <input
                    type="number"
                    min={0}
                    step={0.5}
                    required
                    placeholder="e.g. 120"
                    value={formEstimatedHours}
                    onChange={(e) => setFormEstimatedHours(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-zinc-200 rounded-xl focus:border-brand-500 font-mono font-bold"
                  />
                </div>
              </div>

              {/* Assignment Mode Selector (Assign to Team vs Individual) */}
              <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl space-y-3">
                <label className="font-bold text-zinc-800 block">Project Assignment *</label>
                
                <div className="flex items-center space-x-6">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="assignmentType"
                      checked={formAssignmentType === 'TEAM'}
                      onChange={() => setFormAssignmentType('TEAM')}
                      className="text-brand-500 focus:ring-brand-500"
                    />
                    <span className="font-bold text-zinc-800 flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-brand-500" /> Assign to Team
                    </span>
                  </label>

                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="assignmentType"
                      checked={formAssignmentType === 'INDIVIDUAL'}
                      onChange={() => setFormAssignmentType('INDIVIDUAL')}
                      className="text-brand-500 focus:ring-brand-500"
                    />
                    <span className="font-bold text-zinc-800 flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-blue-500" /> Assign to Individual(s)
                    </span>
                  </label>
                </div>

                {formAssignmentType === 'TEAM' ? (
                  <div>
                    <label className="font-bold text-zinc-700 block mb-1">Select Team *</label>
                    <select
                      value={formTeamId}
                      onChange={(e) => setFormTeamId(e.target.value)}
                      className="w-full px-3 py-2 border border-zinc-200 rounded-xl bg-white focus:border-brand-500 font-semibold"
                    >
                      {teams.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name} ({t.memberIds.length} members) - {t.code}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="font-bold text-zinc-700 block mb-1">
                      Select Individual Users (Check all that apply) *
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2 bg-white border border-zinc-200 rounded-xl">
                      {users.map((u) => {
                        const isChecked = formAssignedUserIds.includes(u.id);
                        return (
                          <label
                            key={u.id}
                            className={`flex items-center space-x-2 p-2 rounded-lg border cursor-pointer transition-colors ${
                              isChecked ? 'bg-brand-50 border-brand-300' : 'hover:bg-zinc-50 border-zinc-200'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setFormAssignedUserIds((prev) => [...prev, u.id]);
                                } else {
                                  setFormAssignedUserIds((prev) => prev.filter((id) => id !== u.id));
                                }
                              }}
                              className="rounded text-brand-500 focus:ring-brand-500"
                            />
                            <img src={u.avatar} alt={u.name} className="w-5 h-5 rounded-full object-cover" />
                            <div className="truncate">
                              <span className="font-bold text-zinc-800 text-[11px] block truncate">{u.name}</span>
                              <span className="text-[9px] text-zinc-400 block truncate">{u.title}</span>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Document Uploads (Multiple Allowed) */}
              <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="font-bold text-zinc-800 block">Upload Documents (Multiple)</label>
                    <p className="text-[10px] text-zinc-500">
                      Supports DOCX, XLSX, PPTX, PDF, ZIP, RAR, PNG, JPG, SVG
                    </p>
                  </div>

                  <label className="px-3 py-1.5 bg-zinc-900 hover:bg-black text-white rounded-lg cursor-pointer flex items-center gap-1 font-bold text-[11px] shadow-sm">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Choose Files</span>
                    <input
                      type="file"
                      multiple
                      accept=".docx,.xlsx,.pptx,.pdf,.zip,.rar,image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Uploaded Documents List */}
                {formDocuments.length > 0 && (
                  <div className="space-y-1.5 max-h-36 overflow-y-auto">
                    {formDocuments.map((doc) => (
                      <div
                        key={doc.id}
                        className="p-2 bg-white border border-zinc-200 rounded-lg flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center space-x-2 overflow-hidden">
                          <FileText className="w-4 h-4 text-brand-500 flex-shrink-0" />
                          <div className="truncate">
                            <p className="font-bold text-zinc-800 truncate">{doc.name}</p>
                            <p className="text-[10px] text-zinc-400">{doc.size} • Uploaded {doc.uploadDate}</p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveDoc(doc.id)}
                          className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded cursor-pointer flex-shrink-0"
                          title="Remove file"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Start Date, End Date, Completion Date */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-zinc-700 block mb-1">Start Date *</label>
                  <input
                    type="date"
                    required
                    value={formStartDate}
                    onChange={(e) => setFormStartDate(e.target.value)}
                    className="w-full px-3 py-2 border border-zinc-200 rounded-xl focus:border-brand-500 font-medium"
                  />
                </div>

                <div>
                  <label className="font-bold text-zinc-700 block mb-1">End Date</label>
                  <input
                    type="date"
                    value={formEndDate}
                    onChange={(e) => setFormEndDate(e.target.value)}
                    className="w-full px-3 py-2 border border-zinc-200 rounded-xl focus:border-brand-500 font-medium"
                  />
                </div>

                <div>
                  <label className="font-bold text-zinc-700 block mb-1">
                    Completion Date {formStatus === 'COMPLETED' && '(Auto-Set)'}
                  </label>
                  <input
                    type="date"
                    value={formCompletionDate}
                    onChange={(e) => setFormCompletionDate(e.target.value)}
                    className="w-full px-3 py-2 border border-zinc-200 rounded-xl focus:border-brand-500 font-medium bg-zinc-50"
                  />
                </div>
              </div>

              {/* Project Status */}
              <div>
                <label className="font-bold text-zinc-700 block mb-1">Project Status *</label>
                <select
                  value={formStatus}
                  onChange={(e) => handleStatusChange(e.target.value as ProjectStatus)}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-xl focus:border-brand-500 font-bold"
                >
                  <option value="NOT_STARTED">Not Started</option>
                  <option value="PENDING">Pending</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="ON_HOLD">On Hold</option>
                  <option value="DELAYED">Delayed</option>
                  <option value="COMPLETED">Completed</option>
                </select>
                <p className="text-[10px] text-zinc-400 mt-1">
                  Selecting "Completed" automatically assigns today's date as the Completion Date.
                </p>
              </div>

              {/* Modal Footer */}
              <div className="pt-3 border-t border-zinc-100 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowProjectModal(false)}
                  className="px-4 py-2 text-zinc-600 hover:bg-zinc-100 rounded-xl cursor-pointer font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-xl shadow-glow-orange cursor-pointer"
                >
                  {editingProject ? 'Save Changes' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Project Details View Modal */}
      {viewingProject && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span
                    className="px-2 py-0.5 rounded text-[10px] font-bold text-white uppercase"
                    style={{
                      backgroundColor:
                        projectTypes.find((pt) => pt.id === viewingProject.typeId)?.color || '#F97316'
                    }}
                  >
                    {projectTypes.find((pt) => pt.id === viewingProject.typeId)?.name || 'Project'}
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                      STATUS_CONFIG[viewingProject.status]?.bg || 'bg-zinc-100'
                    } ${STATUS_CONFIG[viewingProject.status]?.text || 'text-zinc-700'} ${
                      STATUS_CONFIG[viewingProject.status]?.border || 'border-zinc-300'
                    }`}
                  >
                    {STATUS_CONFIG[viewingProject.status]?.label || viewingProject.status}
                  </span>
                </div>
                <h3 className="font-extrabold text-lg text-zinc-900 leading-snug">{viewingProject.name}</h3>
              </div>

              <button
                onClick={() => setViewingProject(null)}
                className="text-zinc-400 hover:text-zinc-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Description */}
            {viewingProject.description && (
              <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-100 text-xs text-zinc-700">
                <p className="font-bold text-zinc-900 mb-1">Project Scope & Details</p>
                <p className="leading-relaxed">{viewingProject.description}</p>
              </div>
            )}

            {/* Key Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl">
                <span className="text-[10px] font-bold text-zinc-400 uppercase block">Estimated Hours</span>
                <span className="text-base font-black text-zinc-900 font-mono">{viewingProject.estimatedHours || 0} hrs</span>
              </div>

              <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl">
                <span className="text-[10px] font-bold text-zinc-400 uppercase block">Start Date</span>
                <span className="text-xs font-bold text-zinc-800">{formatDate(viewingProject.startDate)}</span>
              </div>

              <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl">
                <span className="text-[10px] font-bold text-zinc-400 uppercase block">End Date</span>
                <span className="text-xs font-bold text-zinc-800">{formatDate(viewingProject.endDate || viewingProject.deadline)}</span>
              </div>

              <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl">
                <span className="text-[10px] font-bold text-zinc-400 uppercase block">Completion Date</span>
                <span className="text-xs font-bold text-emerald-700">
                  {viewingProject.completionDate ? formatDate(viewingProject.completionDate) : 'In Progress'}
                </span>
              </div>
            </div>

            {/* Assignment Details */}
            <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl space-y-2 text-xs">
              <span className="text-[10px] font-bold text-zinc-400 uppercase block">Assigned Resource(s)</span>
              {viewingProject.assignmentType === 'TEAM' ? (
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4 text-brand-500" />
                  <span className="font-bold text-zinc-900">
                    Team: {teams.find((t) => t.id === viewingProject.teamId)?.name || 'Unassigned'}
                  </span>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4 text-blue-500" />
                    <span className="font-bold text-zinc-900">
                      {(viewingProject.assignedUserIds || []).length} Assigned Staff Member(s)
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {(viewingProject.assignedUserIds || []).map((uId) => {
                      const u = users.find((usr) => usr.id === uId);
                      if (!u) return null;
                      return (
                        <div key={u.id} className="flex items-center space-x-2 p-2 bg-white rounded-lg border border-zinc-200">
                          <img src={u.avatar} alt={u.name} className="w-6 h-6 rounded-full object-cover" />
                          <div className="truncate">
                            <p className="font-bold text-zinc-900 text-xs truncate">{u.name}</p>
                            <p className="text-[10px] text-zinc-500 truncate">{u.title}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Attached Documents */}
            {viewingProject.documents && viewingProject.documents.length > 0 && (
              <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl space-y-2 text-xs">
                <span className="text-[10px] font-bold text-zinc-400 uppercase block">
                  Project Documents ({viewingProject.documents.length})
                </span>
                <div className="space-y-1.5">
                  {viewingProject.documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="p-2.5 bg-white border border-zinc-200 rounded-lg flex items-center justify-between text-xs shadow-xs"
                    >
                      <div className="flex items-center space-x-2 overflow-hidden">
                        <FileText className="w-4 h-4 text-brand-500 flex-shrink-0" />
                        <div className="truncate">
                          <p className="font-bold text-zinc-900 truncate">{doc.name}</p>
                          <p className="text-[10px] text-zinc-400">{doc.size} • Uploaded {doc.uploadDate}</p>
                        </div>
                      </div>

                      {doc.dataUrl && (
                        <a
                          href={doc.dataUrl}
                          download={doc.name}
                          className="px-2.5 py-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-lg font-bold text-[11px] flex items-center gap-1 cursor-pointer flex-shrink-0"
                        >
                          <Download className="w-3 h-3" />
                          <span>Download</span>
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Linked Tasks List */}
            <div className="space-y-2 text-xs">
              <span className="text-[10px] font-bold text-zinc-400 uppercase block">
                Associated Tasks ({tasks.filter((t) => t.projectId === viewingProject.id && !t.isSoftDeleted).length})
              </span>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {tasks
                  .filter((t) => t.projectId === viewingProject.id && !t.isSoftDeleted)
                  .map((t) => {
                    const assignee = users.find((u) => u.id === t.assigneeId);
                    return (
                      <div
                        key={t.id}
                        className="p-2.5 bg-zinc-50 border border-zinc-200 rounded-xl flex items-center justify-between text-xs"
                      >
                        <div className="space-y-0.5 max-w-sm">
                          <p className="font-bold text-zinc-900 truncate">{t.title}</p>
                          <p className="text-[10px] text-zinc-500">
                            Assignee: <strong>{assignee?.name || 'Unassigned'}</strong> • Due: {formatDate(t.dueDate)}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="font-mono font-bold text-zinc-800 text-[11px]">
                            {t.loggedHours} / {t.estimatedHours}h
                          </span>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="pt-3 border-t border-zinc-100 flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => {
                  const p = viewingProject;
                  setViewingProject(null);
                  openEditProject(p);
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold cursor-pointer flex items-center gap-1.5 text-xs"
              >
                <Edit className="w-3.5 h-3.5" />
                <span>Edit Project</span>
              </button>
              <button
                type="button"
                onClick={() => setViewingProject(null)}
                className="px-4 py-2 text-zinc-600 hover:bg-zinc-100 rounded-xl cursor-pointer font-bold text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Project Type Master Modal (Create & Edit) */}
      {showProjectTypeModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <h3 className="font-bold text-base text-zinc-900 flex items-center gap-2">
                <Layers className="w-5 h-5 text-brand-500" />
                {editingProjectType ? 'Edit Project Type Master' : 'Add Project Type Master'}
              </h3>
              <button
                onClick={() => setShowProjectTypeModal(false)}
                className="text-zinc-400 hover:text-zinc-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProjectType} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-zinc-700 block mb-1">Type Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Consulting & Advisory"
                  value={ptName}
                  onChange={(e) => setPtName(e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-xl focus:border-brand-500 font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-zinc-700 block mb-1">Code</label>
                  <input
                    type="text"
                    placeholder="e.g. ADVISORY"
                    value={ptCode}
                    onChange={(e) => setPtCode(e.target.value)}
                    className="w-full px-3 py-2 border border-zinc-200 rounded-xl focus:border-brand-500 font-mono font-bold uppercase"
                  />
                </div>
                <div>
                  <label className="font-bold text-zinc-700 block mb-1">Color Accent</label>
                  <input
                    type="color"
                    value={ptColor}
                    onChange={(e) => setPtColor(e.target.value)}
                    className="w-full h-9 p-1 border border-zinc-200 rounded-xl cursor-pointer"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-zinc-700 block mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Brief description of this project classification..."
                  value={ptDesc}
                  onChange={(e) => setPtDesc(e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-xl focus:border-brand-500"
                />
              </div>

              <div className="pt-3 border-t border-zinc-100 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowProjectTypeModal(false)}
                  className="px-4 py-2 text-zinc-600 hover:bg-zinc-100 rounded-xl cursor-pointer font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-xl shadow-glow-orange cursor-pointer"
                >
                  {editingProjectType ? 'Save Changes' : 'Save Master Type'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Task Type Master Modal (Create & Edit) */}
      {showTaskTypeModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <h3 className="font-bold text-base text-zinc-900 flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-brand-500" />
                {editingTaskType ? 'Edit Task Type Master' : 'Add Task Type Master'}
              </h3>
              <button
                onClick={() => setShowTaskTypeModal(false)}
                className="text-zinc-400 hover:text-zinc-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTaskType} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-zinc-700 block mb-1">Type Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Performance Benchmarking"
                  value={ttName}
                  onChange={(e) => setTtName(e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-xl focus:border-brand-500 font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-zinc-700 block mb-1">Code</label>
                  <input
                    type="text"
                    placeholder="e.g. BENCH"
                    value={ttCode}
                    onChange={(e) => setTtCode(e.target.value)}
                    className="w-full px-3 py-2 border border-zinc-200 rounded-xl focus:border-brand-500 font-mono font-bold uppercase"
                  />
                </div>
                <div>
                  <label className="font-bold text-zinc-700 block mb-1">Color Accent</label>
                  <input
                    type="color"
                    value={ttColor}
                    onChange={(e) => setTtColor(e.target.value)}
                    className="w-full h-9 p-1 border border-zinc-200 rounded-xl cursor-pointer"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-zinc-700 block mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Brief description of this task category..."
                  value={ttDesc}
                  onChange={(e) => setTtDesc(e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-xl focus:border-brand-500"
                />
              </div>

              <div className="pt-3 border-t border-zinc-100 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowTaskTypeModal(false)}
                  className="px-4 py-2 text-zinc-600 hover:bg-zinc-100 rounded-xl cursor-pointer font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-xl shadow-glow-orange cursor-pointer"
                >
                  {editingTaskType ? 'Save Changes' : 'Save Master Type'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

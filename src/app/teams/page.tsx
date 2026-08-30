'use client';

import React, { useState, useMemo } from 'react';
import { useSystem } from '@/context/SystemContext';
import { UserProfile, DocumentStatus, UserDocument, Team } from '@/lib/types';
import { formatDate, formatCurrency } from '@/lib/utils';
import {
  Users,
  Plus,
  ShieldCheck,
  FileCheck,
  CheckCircle2,
  XCircle,
  Clock,
  DollarSign,
  UserPlus,
  X,
  Upload,
  Calendar,
  Mail,
  Phone,
  Edit,
  Trash2,
  Crown,
  Search,
  Filter,
  Check,
  ExternalLink,
  FileText,
  AlertCircle,
  ArrowRightLeft,
  UserCheck,
  UserMinus
} from 'lucide-react';
import UserFormModal from '@/components/modals/UserFormModal';

export default function TeamsPage() {
  const {
    currentUser,
    teams,
    users,
    customRoles,
    myTeamMemberIds,
    systemSettings,
    addTeam,
    updateTeam,
    addTeamMembers,
    removeTeamMember,
    changeTeamLeader,
    addUser,
    addDocument,
    editDocument,
    deleteDocument,
    verifyDocument,
    addSalaryIncrement
  } = useSystem();

  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  
  // Base Modals
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showIncrementModal, setShowIncrementModal] = useState(false);
  const [editingTeamId, setEditingTeamId] = useState<string | null>(null);

  // New/Edit Team Form State
  const [teamName, setTeamName] = useState('');
  const [teamCode, setTeamCode] = useState('');
  const [teamLeaderId, setTeamLeaderId] = useState(users[0]?.id || '');
  const [teamDesc, setTeamDesc] = useState('');

  // Salary Increment Form State
  const [incNewSalary, setIncNewSalary] = useState(9000);
  const [incPercent, setIncPercent] = useState(12.5);
  const [incNotes, setIncNotes] = useState('Annual performance review increment');

  // --- Document Management State (Super Admin / Admin HR) ---
  const [showDocModal, setShowDocModal] = useState(false);
  const [editingDoc, setEditingDoc] = useState<UserDocument | null>(null);
  const [docName, setDocName] = useState('');
  const [docType, setDocType] = useState('ID_PROOF');
  const [docUrl, setDocUrl] = useState('');
  const [docStatus, setDocStatus] = useState<DocumentStatus>('VERIFIED');
  const [docNotes, setDocNotes] = useState('');

  // --- Add Team Member Directly from Card State ---
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [activeTeamForAddMember, setActiveTeamForAddMember] = useState<Team | null>(null);
  const [selectedMemberIdsToAdd, setSelectedMemberIdsToAdd] = useState<string[]>([]);
  const [memberRoleFilter, setMemberRoleFilter] = useState<string>('ALL');
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [memberStatusFilter, setMemberStatusFilter] = useState<'ALL' | 'UNASSIGNED' | 'ASSIGNED'>('ALL');

  // --- Change Team Leader Directly from Card State ---
  const [showChangeLeaderModal, setShowChangeLeaderModal] = useState(false);
  const [activeTeamForLeader, setActiveTeamForLeader] = useState<Team | null>(null);
  const [leaderSearchQuery, setLeaderSearchQuery] = useState('');

  if (!currentUser) return null;

  const isAdminOrHR = currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'ADMIN_HR';
  const isSuperAdmin = currentUser.role === 'SUPER_ADMIN';
  const isTeamLeader = currentUser.role === 'TEAM_LEADER';

  const visibleTeams = isAdminOrHR ? teams : (isTeamLeader ? teams.filter(t => t.leaderId === currentUser.id) : []);
  const visibleUsers = isAdminOrHR ? users : (isTeamLeader ? users.filter(u => myTeamMemberIds.includes(u.id) || u.id === currentUser.id) : []);

  // Update selectedUser reference when users state changes
  const activeUser = selectedUser ? users.find(u => u.id === selectedUser.id) || selectedUser : null;

  const handleCreateTeam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamName.trim()) return;

    if (editingTeamId) {
      updateTeam(editingTeamId, {
        name: teamName,
        code: teamCode || teamName.substring(0, 4).toUpperCase(),
        leaderId: teamLeaderId,
        description: teamDesc
      });
    } else {
      addTeam({
        name: teamName,
        code: teamCode || teamName.substring(0, 4).toUpperCase(),
        leaderId: teamLeaderId,
        memberIds: [teamLeaderId],
        description: teamDesc
      });
    }

    setTeamName('');
    setTeamCode('');
    setTeamDesc('');
    setEditingTeamId(null);
    setShowTeamModal(false);
  };

  const openEditTeam = (t: typeof teams[0]) => {
    setEditingTeamId(t.id);
    setTeamName(t.name);
    setTeamCode(t.code);
    setTeamLeaderId(t.leaderId);
    setTeamDesc(t.description || '');
    setShowTeamModal(true);
  };

  const handleAddIncrement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeUser) return;

    addSalaryIncrement(activeUser.id, Number(incNewSalary), Number(incPercent), incNotes);
    setShowIncrementModal(false);
  };

  // --- Document Action Handlers ---
  const openAddDocModal = () => {
    setEditingDoc(null);
    setDocName('');
    setDocType('ID_PROOF');
    setDocUrl('https://example.com/documents/doc-sample.pdf');
    setDocStatus('VERIFIED');
    setDocNotes('Verified by Super Admin');
    setShowDocModal(true);
  };

  const openEditDocModal = (doc: UserDocument) => {
    setEditingDoc(doc);
    setDocName(doc.name);
    setDocType(doc.type);
    setDocUrl(doc.url || '');
    setDocStatus(doc.status);
    setDocNotes(doc.notes || '');
    setShowDocModal(true);
  };

  const handleSaveDocument = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeUser || !docName.trim()) return;

    if (editingDoc) {
      editDocument(activeUser.id, editingDoc.id, {
        name: docName,
        type: docType,
        url: docUrl || 'https://example.com/documents/doc-sample.pdf',
        status: docStatus,
        notes: docNotes,
        verifiedBy: docStatus === 'VERIFIED' ? currentUser.name : undefined
      });
    } else {
      addDocument(activeUser.id, {
        name: docName,
        type: docType,
        url: docUrl || 'https://example.com/documents/doc-sample.pdf',
        status: docStatus,
        notes: docNotes,
        verifiedBy: docStatus === 'VERIFIED' ? currentUser.name : undefined
      });
    }

    setShowDocModal(false);
    setEditingDoc(null);
  };

  const handleDeleteDocument = (docId: string, docTitle: string) => {
    if (!activeUser) return;
    if (window.confirm(`Are you sure you want to delete the document "${docTitle}"?`)) {
      deleteDocument(activeUser.id, docId);
    }
  };

  // --- Add Team Member Modal Open ---
  const openAddMemberModal = (team: Team) => {
    setActiveTeamForAddMember(team);
    setSelectedMemberIdsToAdd([]);
    setMemberRoleFilter('ALL');
    setMemberSearchQuery('');
    setMemberStatusFilter('ALL');
    setShowAddMemberModal(true);
  };

  const handleSaveTeamMembers = () => {
    if (!activeTeamForAddMember || selectedMemberIdsToAdd.length === 0) return;
    addTeamMembers(activeTeamForAddMember.id, selectedMemberIdsToAdd);
    setShowAddMemberModal(false);
    setActiveTeamForAddMember(null);
    setSelectedMemberIdsToAdd([]);
  };

  // --- Change Team Leader Modal Open ---
  const openChangeLeaderModal = (team: Team) => {
    setActiveTeamForLeader(team);
    setLeaderSearchQuery('');
    setShowChangeLeaderModal(true);
  };

  const handleSelectLeader = (newLeaderId: string) => {
    if (!activeTeamForLeader) return;
    changeTeamLeader(activeTeamForLeader.id, newLeaderId);
    setShowChangeLeaderModal(false);
    setActiveTeamForLeader(null);
  };

  // Filtered members for Add Member modal
  const filteredUsersForTeam = useMemo(() => {
    if (!activeTeamForAddMember) return [];
    const teamMemberSet = new Set(Array.isArray(activeTeamForAddMember.memberIds) ? activeTeamForAddMember.memberIds : []);

    return users.filter(u => {
      // Search match
      const query = memberSearchQuery.toLowerCase();
      const matchesSearch = !query || 
        u.name.toLowerCase().includes(query) || 
        u.email.toLowerCase().includes(query) || 
        u.title.toLowerCase().includes(query);

      if (!matchesSearch) return false;

      // Role filter match
      if (memberRoleFilter !== 'ALL') {
        if (u.role !== memberRoleFilter && u.customRoleId !== memberRoleFilter) {
          return false;
        }
      }

      // Status filter
      if (memberStatusFilter === 'UNASSIGNED') {
        return !u.teamId;
      }
      if (memberStatusFilter === 'ASSIGNED') {
        return !!u.teamId && !teamMemberSet.has(u.id);
      }

      return true;
    });
  }, [users, activeTeamForAddMember, memberSearchQuery, memberRoleFilter, memberStatusFilter]);

  // Filtered users for Change Leader modal
  const filteredLeaderCandidates = useMemo(() => {
    if (!activeTeamForLeader) return [];
    const query = leaderSearchQuery.toLowerCase();
    return users.filter(u => 
      !query || 
      u.name.toLowerCase().includes(query) || 
      u.email.toLowerCase().includes(query) || 
      u.title.toLowerCase().includes(query) ||
      u.role.toLowerCase().includes(query)
    );
  }, [users, activeTeamForLeader, leaderSearchQuery]);

  return (
    <div className="space-y-6">
      
      {/* Header & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-zinc-900 tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-brand-500" /> Teams & Employee Management
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            Manage teams, add members, assign team leaders, verify employee documents, and track salary structures.
          </p>
        </div>

        {isAdminOrHR && (
          <div className="flex items-center space-x-3">
            <button
              onClick={() => {
                setEditingTeamId(null);
                setTeamName('');
                setTeamCode('');
                setTeamLeaderId(users[0]?.id || '');
                setTeamDesc('');
                setShowTeamModal(true);
              }}
              className="px-4 py-2 bg-obsidian-950 hover:bg-black text-white rounded-xl text-xs font-bold border border-obsidian-800 cursor-pointer flex items-center space-x-1.5 transition-all shadow-sm"
            >
              <Plus className="w-4 h-4 text-brand-400" />
              <span>Create Team</span>
            </button>

            <button
              onClick={() => { setSelectedUser(null); setShowUserModal(true); }}
              className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-xs font-bold shadow-glow-orange cursor-pointer flex items-center space-x-1.5 transition-all"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add New Employee</span>
            </button>
          </div>
        )}
      </div>

      {/* Teams Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {visibleTeams.map((t) => {
          const leader = users.find(u => u.id === t.leaderId);
          const memberIds = Array.isArray(t.memberIds) ? t.memberIds : [];
          const members = users.filter(u => memberIds.includes(u.id) || u.teamId === t.id);

          return (
            <div key={t.id} className="card-clean p-5 space-y-4 hover:border-zinc-300 transition-all shadow-sm">
              
              {/* Card Header */}
              <div className="flex items-start justify-between border-b border-zinc-100 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-extrabold text-brand-600 bg-brand-50 px-2 py-0.5 rounded-md border border-brand-200 uppercase tracking-wider">
                      {t.code}
                    </span>
                    <span className="text-xs text-zinc-500 font-bold bg-zinc-100 px-2 py-0.5 rounded-md">
                      {members.length} {members.length === 1 ? 'Member' : 'Members'}
                    </span>
                  </div>
                  <h3 className="font-extrabold text-base text-zinc-900 mt-1.5">{t.name}</h3>
                </div>

                <div className="flex items-center gap-1.5">
                  {isAdminOrHR && (
                    <>
                      <button
                        onClick={() => openAddMemberModal(t)}
                        className="px-2.5 py-1.5 bg-brand-50 hover:bg-brand-100 text-brand-700 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors border border-brand-200/60"
                        title="Add Team Member"
                      >
                        <UserPlus className="w-3.5 h-3.5 text-brand-600" />
                        <span>Add Member</span>
                      </button>
                      <button
                        onClick={() => openEditTeam(t)}
                        className="p-1.5 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg cursor-pointer transition-colors"
                        title="Edit Team Details"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>

              <p className="text-xs text-zinc-600 line-clamp-2">{t.description || 'No description provided.'}</p>

              {/* Team Leader Section */}
              <div className="p-3 bg-zinc-50 border border-zinc-200/80 rounded-xl flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className="relative">
                    <img
                      src={leader?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}
                      alt={leader?.name || 'Leader'}
                      className="w-8 h-8 rounded-full object-cover ring-2 ring-amber-400"
                    />
                    <Crown className="w-3.5 h-3.5 text-amber-500 fill-amber-500 absolute -top-1.5 -right-1" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">Team Leader</span>
                    </div>
                    <p className="font-bold text-xs text-zinc-900 leading-tight">{leader?.name || 'Unassigned'}</p>
                    <p className="text-[10px] text-zinc-500">{leader?.title || leader?.role}</p>
                  </div>
                </div>

                {isAdminOrHR && (
                  <button
                    onClick={() => openChangeLeaderModal(t)}
                    className="px-2.5 py-1 bg-white hover:bg-amber-50 text-amber-700 border border-amber-200/80 rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-all shadow-2xs"
                  >
                    <ArrowRightLeft className="w-3 h-3" />
                    <span>Change Leader</span>
                  </button>
                )}
              </div>

              {/* Team Members List */}
              <div className="pt-1 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-500 font-bold text-[11px]">Team Members ({members.length}):</span>
                  {isAdminOrHR && (
                    <button
                      onClick={() => openAddMemberModal(t)}
                      className="text-[11px] text-brand-600 hover:text-brand-700 font-bold cursor-pointer hover:underline flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" /> Add Member
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
                  {members.length === 0 ? (
                    <p className="text-zinc-400 text-xs italic">No members assigned yet.</p>
                  ) : (
                    members.map(m => {
                      const isLeaderOfThisTeam = m.id === t.leaderId;
                      return (
                        <div
                          key={m.id}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs border ${
                            isLeaderOfThisTeam 
                              ? 'bg-amber-50/80 border-amber-200 text-amber-900 font-semibold' 
                              : 'bg-zinc-100 border-zinc-200 text-zinc-800'
                          }`}
                        >
                          <img src={m.avatar} alt={m.name} className="w-4 h-4 rounded-full object-cover" />
                          <span className="truncate max-w-[120px]">{m.name}</span>
                          {isLeaderOfThisTeam && (
                            <Crown className="w-3 h-3 text-amber-500 fill-amber-500" />
                          )}
                          {isAdminOrHR && !isLeaderOfThisTeam && (
                            <button
                              onClick={() => {
                                if (window.confirm(`Remove ${m.name} from ${t.name}?`)) {
                                  removeTeamMember(t.id, m.id);
                                }
                              }}
                              className="text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded p-0.5 cursor-pointer ml-0.5"
                              title={`Remove ${m.name}`}
                            >
                              <X className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Employee Directory Table */}
      <div className="card-clean p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
          <h3 className="font-bold text-sm text-zinc-900 flex items-center gap-2">
            <Users className="w-4 h-4 text-brand-500" /> Employee Directory & Profiles
          </h3>
          <span className="text-xs text-zinc-500 font-bold">{visibleUsers.length} Total Staff</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-100 border-b border-zinc-200 text-zinc-500 font-bold uppercase tracking-wider">
              <tr>
                <th className="p-3">Employee</th>
                <th className="p-3">Role & Title</th>
                <th className="p-3">Assigned Team</th>
                <th className="p-3">Joining Date</th>
                <th className="p-3">Contact</th>
                {isAdminOrHR && <th className="p-3">Documents</th>}
                {isAdminOrHR && <th className="p-3">Monthly Salary</th>}
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {visibleUsers.map((u) => {
                const userTeam = teams.find(t => t.id === u.teamId);
                const pendingDocs = (u.documents || []).filter(d => d.status === 'PENDING').length;
                const verifiedDocs = (u.documents || []).filter(d => d.status === 'VERIFIED').length;
                const totalSalary = u.salary ? (u.salary.basic + u.salary.hra + u.salary.specialAllowance) : 0;

                return (
                  <tr key={u.id} className="hover:bg-zinc-50/80 cursor-pointer transition-colors" onClick={() => setSelectedUser(u)}>
                    <td className="p-3">
                      <div className="flex items-center space-x-3">
                        <img src={u.avatar} alt={u.name} className="w-9 h-9 rounded-full object-cover" />
                        <div>
                          <p className="font-bold text-zinc-900">{u.name}</p>
                          <p className="text-[10px] text-zinc-400">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-obsidian-950 text-white block w-fit mb-0.5">
                        {u.role.replace('_', ' ')}
                      </span>
                      <span className="text-[11px] text-zinc-600">{u.title}</span>
                    </td>
                    <td className="p-3">
                      {userTeam ? (
                        <span className="px-2 py-0.5 bg-brand-50 text-brand-700 border border-brand-200 rounded font-semibold text-[10px]">
                          {userTeam.name}
                        </span>
                      ) : (
                        <span className="text-zinc-400 italic text-[11px]">Unassigned</span>
                      )}
                    </td>
                    <td className="p-3 font-semibold text-zinc-700">{formatDate(u.joiningDate)}</td>
                    <td className="p-3 font-mono text-zinc-600">{u.phone}</td>
                    {isAdminOrHR && (
                      <td className="p-3">
                        {pendingDocs > 0 ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 flex items-center gap-1 w-fit">
                            <Clock className="w-3 h-3" /> {pendingDocs} Pending
                          </span>
                        ) : (u.documents && u.documents.length > 0) ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1 w-fit">
                            <CheckCircle2 className="w-3 h-3" /> {verifiedDocs} Verified
                          </span>
                        ) : (
                          <span className="text-zinc-400 text-[10px] italic">0 Docs</span>
                        )}
                      </td>
                    )}
                    {isAdminOrHR && (
                      <td className="p-3 font-mono font-bold text-zinc-800">
                        {formatCurrency(totalSalary, systemSettings)}
                      </td>
                    )}
                    <td className="p-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => setSelectedUser(u)}
                        className="px-3 py-1 bg-brand-50 text-brand-700 hover:bg-brand-100 rounded-lg text-xs font-bold transition-colors cursor-pointer border border-brand-200/50"
                      >
                        View Profile
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Selected Employee Detailed Profile & Verification Drawer */}
      {activeUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-end animate-in fade-in">
          <div className="bg-white w-full max-w-xl h-full p-6 shadow-2xl overflow-y-auto space-y-6 animate-in slide-in-from-right duration-200">
            
            {/* Drawer Header */}
            <div className="border-b border-zinc-100 pb-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <img src={activeUser.avatar} alt={activeUser.name} className="w-12 h-12 rounded-full object-cover ring-2 ring-brand-500/20" />
                <div>
                  <h3 className="font-extrabold text-lg text-zinc-900 flex items-center gap-2">
                    {activeUser.name}
                  </h3>
                  <p className="text-xs text-zinc-500">{activeUser.title} • <span className="font-bold text-zinc-700">{activeUser.role.replace('_', ' ')}</span></p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {isAdminOrHR && (
                  <button
                    onClick={() => setShowUserModal(true)}
                    className="p-2 text-brand-600 hover:bg-brand-50 rounded-xl cursor-pointer transition-colors"
                    title="Edit Full Profile"
                  >
                    <Edit className="w-5 h-5" />
                  </button>
                )}
                <button
                  onClick={() => setSelectedUser(null)}
                  className="p-2 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-xl cursor-pointer transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Personal Details */}
            <div className="space-y-3 text-xs">
              <h4 className="font-bold text-zinc-900 border-b border-zinc-100 pb-1.5">Personal & Contact Info</h4>
              <div className="grid grid-cols-2 gap-3 text-zinc-600 bg-zinc-50 p-3.5 rounded-xl border border-zinc-200">
                <div>
                  <span className="text-zinc-400 block text-[10px] font-bold uppercase">Email Address</span>
                  <strong className="text-zinc-800 text-xs break-all">{activeUser.email}</strong>
                </div>
                <div>
                  <span className="text-zinc-400 block text-[10px] font-bold uppercase">Phone Number</span>
                  <strong className="text-zinc-800 text-xs font-mono">{activeUser.phone}</strong>
                </div>
                <div>
                  <span className="text-zinc-400 block text-[10px] font-bold uppercase">Joining Date</span>
                  <span className="font-bold text-zinc-900">{formatDate(activeUser.joiningDate)}</span>
                </div>
                <div>
                  <span className="text-zinc-400 block text-[10px] font-bold uppercase">Date of Birth</span>
                  <span className="font-bold text-zinc-900">{formatDate(activeUser.birthDate)}</span>
                </div>
                <div className="col-span-2 pt-1 border-t border-zinc-200">
                  <span className="text-zinc-400 block text-[10px] font-bold uppercase">Residential Address</span>
                  <span className="text-zinc-800">{activeUser.address}</span>
                </div>
              </div>
            </div>

            {/* Documents & Compliance Management (Super Admin & Admin HR) */}
            {isAdminOrHR && (
              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between border-b border-zinc-100 pb-2">
                  <div>
                    <h4 className="font-bold text-zinc-900 flex items-center gap-1.5">
                      <FileCheck className="w-4 h-4 text-brand-500" /> Verification Documents & Compliance
                    </h4>
                    <p className="text-[11px] text-zinc-500">Add, edit, verify, or remove employee documentation</p>
                  </div>
                  {isAdminOrHR && (
                    <button
                      onClick={openAddDocModal}
                      className="px-3 py-1.5 bg-brand-500 hover:bg-brand-600 text-white rounded-lg text-xs font-bold cursor-pointer flex items-center gap-1 shadow-glow-orange transition-all"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Document</span>
                    </button>
                  )}
                </div>

                <div className="space-y-2.5">
                  {(!activeUser.documents || activeUser.documents.length === 0) ? (
                    <div className="p-4 bg-zinc-50 border border-dashed border-zinc-300 rounded-xl text-center space-y-2">
                      <FileText className="w-8 h-8 text-zinc-300 mx-auto" />
                      <p className="text-zinc-500 text-xs font-medium">No verification documents uploaded yet.</p>
                      {isAdminOrHR && (
                        <button
                          onClick={openAddDocModal}
                          className="text-xs text-brand-600 font-bold hover:underline"
                        >
                          + Upload first document
                        </button>
                      )}
                    </div>
                  ) : (
                    activeUser.documents.map((doc) => (
                      <div key={doc.id} className="p-3.5 bg-zinc-50 border border-zinc-200 rounded-xl space-y-2.5 hover:border-zinc-300 transition-colors">
                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <FileText className="w-4 h-4 text-brand-600" />
                              <p className="font-bold text-zinc-900 text-xs">{doc.name}</p>
                            </div>
                            <p className="text-[10px] text-zinc-500">
                              Type: <span className="font-semibold text-zinc-700">{doc.type.replace('_', ' ')}</span> • Uploaded: {formatDate(doc.uploadDate)}
                            </p>
                            {doc.verifiedBy && (
                              <p className="text-[10px] text-emerald-700 font-medium">
                                Verified by {doc.verifiedBy}
                              </p>
                            )}
                            {doc.notes && (
                              <p className="text-[10px] text-zinc-600 italic bg-white p-1.5 rounded border border-zinc-200/60 mt-1">
                                Note: {doc.notes}
                              </p>
                            )}
                          </div>

                          <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              doc.status === 'VERIFIED' ? 'bg-emerald-100 text-emerald-800' :
                              doc.status === 'REJECTED' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                            }`}>
                              {doc.status}
                            </span>
                            
                            {/* Super Admin & Admin HR Action Buttons */}
                            <div className="flex items-center space-x-1 pt-1">
                              {doc.url && (
                                <a
                                  href={doc.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="p-1 text-zinc-500 hover:text-brand-600 hover:bg-brand-50 rounded"
                                  title="Open Document Link"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                              )}
                              <button
                                onClick={() => openEditDocModal(doc)}
                                className="p-1 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200 rounded cursor-pointer"
                                title="Edit Document"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteDocument(doc.id, doc.name)}
                                className="p-1 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded cursor-pointer"
                                title="Delete Document"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Quick HR Approval / Rejection buttons if PENDING */}
                        {doc.status === 'PENDING' && (
                          <div className="pt-2 border-t border-zinc-200 flex items-center justify-end space-x-2">
                            <button
                              onClick={() => verifyDocument(activeUser.id, doc.id, 'VERIFIED')}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-[10px] cursor-pointer flex items-center gap-1"
                            >
                              <Check className="w-3 h-3" /> Approve
                            </button>
                            <button
                              onClick={() => verifyDocument(activeUser.id, doc.id, 'REJECTED', 'Documents unclear / incomplete')}
                              className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg text-[10px] cursor-pointer flex items-center gap-1"
                            >
                              <X className="w-3 h-3" /> Reject
                            </button>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Salary Structure & Increment History */}
            {isAdminOrHR && activeUser.salary && (
              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between border-b border-zinc-100 pb-1.5">
                  <h4 className="font-bold text-zinc-900 flex items-center gap-1.5">
                    <DollarSign className="w-4 h-4 text-brand-500" /> Salary Structure & Increment History
                  </h4>
                  <button
                    onClick={() => {
                      setIncNewSalary(Math.round((activeUser.salary.basic + activeUser.salary.hra + activeUser.salary.specialAllowance) * 1.15));
                      setShowIncrementModal(true);
                    }}
                    className="px-2.5 py-1 bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-lg text-[10px] cursor-pointer"
                  >
                    + Log Increment
                  </button>
                </div>

                <div className="p-3.5 bg-obsidian-950 text-white rounded-xl space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Basic Salary:</span>
                    <span className="font-mono font-bold">{formatCurrency(activeUser.salary.basic, systemSettings)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">HRA Allowance:</span>
                    <span className="font-mono font-bold">{formatCurrency(activeUser.salary.hra, systemSettings)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Special Allowance:</span>
                    <span className="font-mono font-bold">{formatCurrency(activeUser.salary.specialAllowance, systemSettings)}</span>
                  </div>
                  <div className="pt-2 border-t border-obsidian-800 flex justify-between text-brand-400 font-extrabold">
                    <span>Gross Monthly Total:</span>
                    <span className="font-mono">{formatCurrency(activeUser.salary.basic + activeUser.salary.hra + activeUser.salary.specialAllowance, systemSettings)}</span>
                  </div>
                </div>

                {/* Increment Logs */}
                <div className="space-y-2">
                  <p className="font-bold text-zinc-800">Increment Log History:</p>
                  {(!activeUser.salary.increments || activeUser.salary.increments.length === 0) ? (
                    <p className="text-zinc-400 text-[11px]">No salary increment recorded yet.</p>
                  ) : (
                    activeUser.salary.increments.map((inc) => (
                      <div key={inc.id} className="p-2.5 bg-zinc-50 border border-zinc-200 rounded-xl space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-emerald-700">+{inc.percentage}% Increment</span>
                          <span className="text-[10px] text-zinc-400">{formatDate(inc.date)}</span>
                        </div>
                        <p className="font-mono text-xs font-bold text-zinc-900">
                          {formatCurrency(inc.oldSalary, systemSettings)} ➔ {formatCurrency(inc.newSalary, systemSettings)}
                        </p>
                        <p className="text-[10px] text-zinc-500">Approved by: {inc.approvedBy} • {inc.notes}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* --- ADD TEAM MEMBER DIRECT MODAL --- */}
      {showAddMemberModal && activeTeamForAddMember && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-xl w-full max-h-[88vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-zinc-100 flex items-center justify-between bg-zinc-50">
              <div>
                <span className="text-[10px] font-extrabold text-brand-600 bg-brand-50 px-2 py-0.5 rounded border border-brand-200 uppercase">
                  {activeTeamForAddMember.code}
                </span>
                <h3 className="font-extrabold text-base text-zinc-900 mt-1 flex items-center gap-1.5">
                  <UserPlus className="w-4 h-4 text-brand-500" /> Add Members to {activeTeamForAddMember.name}
                </h3>
              </div>
              <button
                onClick={() => setShowAddMemberModal(false)}
                className="p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-200 rounded-lg cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Filters Bar */}
            <div className="p-4 border-b border-zinc-100 space-y-3 bg-white">
              <div className="relative">
                <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search employees by name, title, or email..."
                  value={memberSearchQuery}
                  onChange={(e) => setMemberSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-zinc-200 rounded-xl text-xs focus:border-brand-500 focus:outline-none"
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                {/* Role Filter */}
                <div className="flex items-center gap-1.5">
                  <Filter className="w-3.5 h-3.5 text-zinc-400" />
                  <span className="text-zinc-500 font-medium text-[11px]">Role:</span>
                  <select
                    value={memberRoleFilter}
                    onChange={(e) => setMemberRoleFilter(e.target.value)}
                    className="px-2.5 py-1 bg-zinc-100 border border-zinc-200 rounded-lg text-xs font-semibold focus:border-brand-500"
                  >
                    <option value="ALL">All Roles</option>
                    <option value="EMPLOYEE">Employee</option>
                    <option value="TEAM_LEADER">Team Leader</option>
                    <option value="ADMIN_HR">Admin / HR</option>
                    <option value="SUPER_ADMIN">Super Admin</option>
                    {customRoles.map(cr => (
                      <option key={cr.id} value={cr.id}>{cr.name} (Custom)</option>
                    ))}
                  </select>
                </div>

                {/* Status Tabs */}
                <div className="flex items-center bg-zinc-100 p-0.5 rounded-lg border border-zinc-200 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setMemberStatusFilter('ALL')}
                    className={`px-2.5 py-0.5 rounded-md font-bold transition-colors cursor-pointer ${
                      memberStatusFilter === 'ALL' ? 'bg-white shadow-2xs text-zinc-900' : 'text-zinc-500 hover:text-zinc-800'
                    }`}
                  >
                    All Staff
                  </button>
                  <button
                    type="button"
                    onClick={() => setMemberStatusFilter('UNASSIGNED')}
                    className={`px-2.5 py-0.5 rounded-md font-bold transition-colors cursor-pointer ${
                      memberStatusFilter === 'UNASSIGNED' ? 'bg-white shadow-2xs text-emerald-700' : 'text-zinc-500 hover:text-zinc-800'
                    }`}
                  >
                    Unassigned
                  </button>
                  <button
                    type="button"
                    onClick={() => setMemberStatusFilter('ASSIGNED')}
                    className={`px-2.5 py-0.5 rounded-md font-bold transition-colors cursor-pointer ${
                      memberStatusFilter === 'ASSIGNED' ? 'bg-white shadow-2xs text-amber-700' : 'text-zinc-500 hover:text-zinc-800'
                    }`}
                  >
                    Other Teams
                  </button>
                </div>
              </div>
            </div>

            {/* Selectable Users List */}
            <div className="p-4 overflow-y-auto flex-1 divide-y divide-zinc-100">
              {filteredUsersForTeam.length === 0 ? (
                <div className="p-8 text-center text-zinc-400 space-y-2 text-xs">
                  <AlertCircle className="w-8 h-8 mx-auto text-zinc-300" />
                  <p>No matching employees found for the selected filters.</p>
                </div>
              ) : (
                filteredUsersForTeam.map(u => {
                  const isAlreadyMember = (activeTeamForAddMember.memberIds || []).includes(u.id) || u.teamId === activeTeamForAddMember.id;
                  const isSelected = selectedMemberIdsToAdd.includes(u.id);
                  const otherTeam = teams.find(t => t.id === u.teamId && t.id !== activeTeamForAddMember.id);

                  return (
                    <div
                      key={u.id}
                      onClick={() => {
                        if (isAlreadyMember) return;
                        if (isSelected) {
                          setSelectedMemberIdsToAdd(prev => prev.filter(id => id !== u.id));
                        } else {
                          setSelectedMemberIdsToAdd(prev => [...prev, u.id]);
                        }
                      }}
                      className={`p-3 flex items-center justify-between rounded-xl transition-all cursor-pointer ${
                        isAlreadyMember 
                          ? 'opacity-60 bg-zinc-50 cursor-not-allowed' 
                          : isSelected 
                          ? 'bg-brand-50/80 border border-brand-200' 
                          : 'hover:bg-zinc-50'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={isAlreadyMember || isSelected}
                          disabled={isAlreadyMember}
                          onChange={() => {}}
                          className="w-4 h-4 text-brand-600 rounded border-zinc-300 focus:ring-brand-500"
                        />
                        <img src={u.avatar} alt={u.name} className="w-9 h-9 rounded-full object-cover" />
                        <div>
                          <div className="flex items-center gap-1.5">
                            <p className="font-bold text-zinc-900 text-xs">{u.name}</p>
                            <span className="text-[10px] font-semibold text-zinc-500">({u.role.replace('_', ' ')})</span>
                          </div>
                          <p className="text-[11px] text-zinc-500">{u.title} • <span className="text-zinc-400">{u.email}</span></p>
                        </div>
                      </div>

                      <div className="text-right">
                        {isAlreadyMember ? (
                          <span className="px-2 py-0.5 bg-zinc-200 text-zinc-700 rounded text-[10px] font-bold">
                            Already in Team
                          </span>
                        ) : otherTeam ? (
                          <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded text-[10px] font-bold">
                            In {otherTeam.name}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded text-[10px] font-bold">
                            Unassigned
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-zinc-100 bg-zinc-50 flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-600">
                {selectedMemberIdsToAdd.length} employee(s) selected
              </span>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddMemberModal(false)}
                  className="px-4 py-2 text-xs font-bold text-zinc-600 hover:bg-zinc-200 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={selectedMemberIdsToAdd.length === 0}
                  onClick={handleSaveTeamMembers}
                  className="px-4 py-2 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-glow-orange cursor-pointer flex items-center gap-1.5 transition-all"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Add {selectedMemberIdsToAdd.length} Members</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* --- CHANGE TEAM LEADER MODAL --- */}
      {showChangeLeaderModal && activeTeamForLeader && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95">
            
            {/* Header */}
            <div className="p-5 border-b border-zinc-100 flex items-center justify-between bg-zinc-50">
              <div>
                <h3 className="font-extrabold text-base text-zinc-900 flex items-center gap-2">
                  <Crown className="w-4 h-4 text-amber-500 fill-amber-500" /> Change Team Leader
                </h3>
                <p className="text-xs text-zinc-500 mt-0.5">Select a new Leader for {activeTeamForLeader.name}</p>
              </div>
              <button
                onClick={() => setShowChangeLeaderModal(false)}
                className="p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-200 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search */}
            <div className="p-4 border-b border-zinc-100 bg-white">
              <div className="relative">
                <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search by name, title, or role..."
                  value={leaderSearchQuery}
                  onChange={(e) => setLeaderSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-zinc-200 rounded-xl text-xs focus:border-brand-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Candidates List */}
            <div className="p-4 overflow-y-auto flex-1 space-y-2">
              {filteredLeaderCandidates.map((u) => {
                const isCurrentLeader = u.id === activeTeamForLeader.leaderId;
                return (
                  <div
                    key={u.id}
                    className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                      isCurrentLeader 
                        ? 'bg-amber-50 border-amber-300 ring-1 ring-amber-400/40' 
                        : 'bg-zinc-50 border-zinc-200 hover:border-brand-300 hover:bg-brand-50/40'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <img src={u.avatar} alt={u.name} className="w-9 h-9 rounded-full object-cover" />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <p className="font-bold text-zinc-900 text-xs">{u.name}</p>
                          {isCurrentLeader && (
                            <span className="px-1.5 py-0.2 text-[9px] font-bold bg-amber-200 text-amber-900 rounded">
                              Current Leader
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-zinc-500">{u.title} • <span className="font-semibold text-zinc-700">{u.role.replace('_', ' ')}</span></p>
                      </div>
                    </div>

                    {!isCurrentLeader ? (
                      <button
                        onClick={() => handleSelectLeader(u.id)}
                        className="px-3 py-1.5 bg-brand-500 hover:bg-brand-600 text-white rounded-lg text-xs font-bold shadow-2xs cursor-pointer flex items-center gap-1"
                      >
                        <Check className="w-3 h-3" /> Select
                      </button>
                    ) : (
                      <span className="text-xs font-bold text-amber-700 flex items-center gap-1">
                        <Crown className="w-3.5 h-3.5 fill-amber-500" /> Active
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="p-4 border-t border-zinc-100 bg-zinc-50 flex justify-end">
              <button
                type="button"
                onClick={() => setShowChangeLeaderModal(false)}
                className="px-4 py-2 text-xs font-bold text-zinc-600 hover:bg-zinc-200 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
            </div>

          </div>
        </div>
      )}

      {/* --- ADD / EDIT DOCUMENT MODAL (SUPER ADMIN / ADMIN HR) --- */}
      {showDocModal && activeUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <h3 className="font-bold text-base text-zinc-900 flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-brand-500" />
                {editingDoc ? 'Edit Verification Document' : `Add Document for ${activeUser.name}`}
              </h3>
              <button
                onClick={() => setShowDocModal(false)}
                className="text-zinc-400 hover:text-zinc-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDocument} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-zinc-700 block mb-1">Document Title / Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Government Aadhaar Card / Passport"
                  value={docName}
                  onChange={(e) => setDocName(e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-xl focus:border-brand-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-zinc-700 block mb-1">Category / Type *</label>
                  <select
                    value={docType}
                    onChange={(e) => setDocType(e.target.value)}
                    className="w-full px-3 py-2 border border-zinc-200 rounded-xl focus:border-brand-500 focus:outline-none bg-white font-medium"
                  >
                    <option value="ID_PROOF">National ID / Passport</option>
                    <option value="ADDRESS_PROOF">Address Proof</option>
                    <option value="EDUCATIONAL">Educational Degree</option>
                    <option value="EXPERIENCE_LETTER">Work Experience</option>
                    <option value="TAX_PAN">Tax / PAN Card</option>
                    <option value="PAYSLIP">Previous Payslip</option>
                    <option value="OTHER">Other Compliance Doc</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-zinc-700 block mb-1">Compliance Status *</label>
                  <select
                    value={docStatus}
                    onChange={(e) => setDocStatus(e.target.value as DocumentStatus)}
                    className="w-full px-3 py-2 border border-zinc-200 rounded-xl focus:border-brand-500 focus:outline-none bg-white font-bold"
                  >
                    <option value="VERIFIED">VERIFIED (Approved)</option>
                    <option value="PENDING">PENDING (In Review)</option>
                    <option value="REJECTED">REJECTED (Needs Re-upload)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-zinc-700 block mb-1">Document URL / File Link</label>
                <input
                  type="url"
                  placeholder="https://storage.enterprise.com/docs/file.pdf"
                  value={docUrl}
                  onChange={(e) => setDocUrl(e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-xl focus:border-brand-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-zinc-700 block mb-1">Verification Remarks / Notes</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Identity verified against government records"
                  value={docNotes}
                  onChange={(e) => setDocNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-xl focus:border-brand-500 focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-zinc-100 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowDocModal(false)}
                  className="px-4 py-2 text-zinc-600 hover:bg-zinc-100 rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-xl shadow-glow-orange cursor-pointer flex items-center gap-1.5"
                >
                  <FileCheck className="w-4 h-4" />
                  <span>{editingDoc ? 'Update Document' : 'Save Document'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create / Edit Team Details Modal */}
      {showTeamModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <h3 className="font-bold text-base text-zinc-900">{editingTeamId ? 'Edit Team Details' : 'Create New Team'}</h3>
              <button onClick={() => setShowTeamModal(false)} className="text-zinc-400 hover:text-zinc-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTeam} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-zinc-700 block mb-1">Team Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mobile Engineering Team"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-xl focus:border-brand-500"
                />
              </div>

              <div>
                <label className="font-bold text-zinc-700 block mb-1">Team Code</label>
                <input
                  type="text"
                  placeholder="e.g. MOBE"
                  value={teamCode}
                  onChange={(e) => setTeamCode(e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-xl focus:border-brand-500 uppercase"
                />
              </div>

              <div>
                <label className="font-bold text-zinc-700 block mb-1">Select Team Leader</label>
                <select
                  value={teamLeaderId}
                  onChange={(e) => setTeamLeaderId(e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-xl focus:border-brand-500 font-medium bg-white"
                >
                  {users.map(u => (
                    <option key={u.id} value={u.id}>{u.name} ({u.role.replace('_', ' ')})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-zinc-700 block mb-1">Description</label>
                <textarea
                  rows={2}
                  value={teamDesc}
                  onChange={(e) => setTeamDesc(e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-xl focus:border-brand-500"
                />
              </div>

              <div className="pt-3 border-t border-zinc-100 flex justify-end space-x-2">
                <button type="button" onClick={() => setShowTeamModal(false)} className="px-4 py-2 text-zinc-600 hover:bg-zinc-100 rounded-xl cursor-pointer">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-brand-500 text-white font-bold rounded-xl cursor-pointer">
                  Save Team
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create & Edit Employee Modal */}
      {showUserModal && (
        <UserFormModal
          user={activeUser}
          onClose={() => {
            setShowUserModal(false);
          }}
          onSave={() => {
            setShowUserModal(false);
          }}
        />
      )}

      {/* Salary Increment Modal */}
      {showIncrementModal && activeUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <h3 className="font-bold text-base text-zinc-900">Log Salary Increment for {activeUser.name}</h3>
              <button onClick={() => setShowIncrementModal(false)} className="text-zinc-400 hover:text-zinc-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddIncrement} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-zinc-700 block mb-1">New Total Monthly Gross Salary</label>
                <input
                  type="number"
                  required
                  value={incNewSalary}
                  onChange={(e) => setIncNewSalary(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-xl focus:border-brand-500"
                />
              </div>

              <div>
                <label className="font-bold text-zinc-700 block mb-1">Percentage Increment (%)</label>
                <input
                  type="number"
                  required
                  value={incPercent}
                  onChange={(e) => setIncPercent(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-xl focus:border-brand-500"
                />
              </div>

              <div>
                <label className="font-bold text-zinc-700 block mb-1">Increment Rationale / Notes</label>
                <textarea
                  rows={2}
                  required
                  value={incNotes}
                  onChange={(e) => setIncNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-xl focus:border-brand-500"
                />
              </div>

              <div className="pt-3 border-t border-zinc-100 flex justify-end space-x-2">
                <button type="button" onClick={() => setShowIncrementModal(false)} className="px-4 py-2 text-zinc-600 hover:bg-zinc-100 rounded-xl cursor-pointer">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-brand-500 text-white font-bold rounded-xl cursor-pointer">
                  Save Increment Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

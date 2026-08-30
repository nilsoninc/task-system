'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  UserProfile,
  UserRole,
  Team,
  ProjectTypeMaster,
  TaskTypeMaster,
  Project,
  Task,
  AttendanceRecord,
  LeaveApplication,
  CompOffRequest,
  LeaveRule,
  CompanyEvent,
  Payslip,
  PayslipConfig,
  DEFAULT_PAYSLIP_CONFIG,
  DEFAULT_PROF_TAX_SLABS,
  normalizePayslipConfig,
  ChatMessage,
  ChatChannel,
  CustomRole,
  DocumentStatus,
  UserDocument,
  SystemSettings,
  AppNotification
} from '@/lib/types';
import {
  INITIAL_EVENTS,
  INITIAL_CHAT_CHANNELS,
  INITIAL_CHAT_MESSAGES,
} from '@/lib/mock-data';

const DEFAULT_SETTINGS: SystemSettings = {
  morningPunchInThreshold: '09:30 AM',
  minDailyWorkingHours: '08:00',
  lateArrivalFlagLimit: 3,
  currencySymbol: '₹',
  currencyCode: 'INR',
  totalPaidLeavePerYear: 18,
  smtpConfig: {
    host: 'smtp.enterprise-mail.com',
    port: 587,
    user: 'notifications@enterprise-mail.com',
    pass: '••••••••••••'
  },
  companyInfo: {
    name: 'Penguin Peak Technologies Pvt Ltd.',
    logoUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&auto=format&fit=crop&q=80',
    email: 'contact@enterprise.com',
    phone: '+1 (800) 555-0199'
  },
  themeConfig: {
    fontFamily: 'Inter',
    headingFontSize: 'lg',
    bodyFontSize: 'xs',
    primaryColor: '#F97316',
    accentColor: '#EA580C',
    darkColor: '#09090B',
    headingColor: '#09090B',
    bodyColor: '#3F3F46',
    buttonPrimaryColor: '#F97316',
    buttonHoverColor: '#EA580C',
    buttonTextColor: '#FFFFFF'
  },
  dateFormat: 'YYYY-MM-DD',
  timeFormat: '12 Hours (AM/PM)',
  maxConsecutiveLeaveGroup: 10,
  sandwichRule: {
    enabled: true,
    conditionText: 'If a weekend/public holiday falls between approved leave start and end dates, those days will be counted as leave days.'
  },
  payslipConfig: DEFAULT_PAYSLIP_CONFIG,
  probationPaidLeaveEligibilityMonths: 6,
  minNoticeDaysRequired: 3
};

interface SystemContextType {
  currentUser: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<boolean>;
  logout: () => void;
  switchPersona: (role: UserRole) => void;

  users: UserProfile[];
  myTeamMemberIds: string[];
  teams: Team[];
  projectTypes: ProjectTypeMaster[];
  taskTypes: TaskTypeMaster[];
  projects: Project[];
  tasks: Task[];
  attendance: AttendanceRecord[];
  leaveApplications: LeaveApplication[];
  compOffRequests: CompOffRequest[];
  leaveRules: LeaveRule[];
  events: CompanyEvent[];
  payslips: Payslip[];
  chatChannels: ChatChannel[];
  chatMessages: ChatMessage[];
  customRoles: CustomRole[];
  systemSettings: SystemSettings;
  notifications: AppNotification[];

  // Attendance & Timer
  isCheckedIn: boolean;
  activeWorkSeconds: number;
  toggleCheckIn: () => void;
  toggleTaskTimer: (taskId: string) => void;

  // Actions
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'worklogs' | 'loggedHours'>) => void;
  assignTaskToTeam: (teamId: string, taskData: Omit<Task, 'id' | 'createdAt' | 'worklogs' | 'loggedHours' | 'assigneeId'>) => void;
  assignTaskToAllMembers: (taskData: Omit<Task, 'id' | 'createdAt' | 'worklogs' | 'loggedHours' | 'assigneeId'>) => void;
  editTask: (taskId: string, updated: Partial<Task>) => void;
  deleteTask: (taskId: string) => { success: boolean; message?: string };
  restoreTask: (taskId: string) => void;
  hardDeleteTask: (taskId: string) => void;
  sendTaskReminder: (taskId: string) => void;
  updateTaskStatus: (taskId: string, status: Task['status']) => void;

  // Leave Applications
  applyLeave: (leave: Omit<LeaveApplication, 'id' | 'appliedOn' | 'status' | 'userId' | 'userName' | 'userRole'> & { workInAbsence?: string }) => void;
  editLeave: (leaveId: string, updated: Partial<LeaveApplication>) => void;
  reviewLeave: (leaveId: string, status: 'APPROVED' | 'REJECTED', reason?: string) => void;
  softDeleteLeave: (leaveId: string) => void;
  hardDeleteLeave: (leaveId: string) => void;
  addPaidLeaveCredit: (userIds: string[], days: number, reason: string) => void;
  submitCompOff: (request: Omit<CompOffRequest, 'id' | 'requestedOn' | 'status' | 'userId' | 'userName'> & { userId?: string; userName?: string; convertedDays?: number; status?: 'PENDING' | 'APPROVED_BY_TL' | 'APPROVED' | 'REJECTED' }) => void;
  reviewCompOff: (requestId: string, status: 'PENDING' | 'APPROVED_BY_TL' | 'APPROVED' | 'REJECTED') => void;
  addLeaveRule: (rule: Omit<LeaveRule, 'id'>) => void;

  // Master Administration & System Settings
  updateSystemSettings: (newSettings: Partial<SystemSettings>) => void;
  addProjectType: (type: Omit<ProjectTypeMaster, 'id'>) => void;
  editProjectType: (typeId: string, updated: Partial<ProjectTypeMaster>) => void;
  deleteProjectType: (typeId: string) => { success: boolean; message?: string };
  addTaskType: (type: Omit<TaskTypeMaster, 'id'>) => void;
  editTaskType: (typeId: string, updated: Partial<TaskTypeMaster>) => void;
  deleteTaskType: (typeId: string) => { success: boolean; message?: string };
  addTeam: (team: Omit<Team, 'id'>) => void;
  updateTeam: (id: string, data: Partial<Omit<Team, 'id'>>) => void;
  addProject: (project: Omit<Project, 'id' | 'progress'>) => void;
  editProject: (projectId: string, updated: Partial<Project>) => void;
  deleteProject: (projectId: string) => { success: boolean; message?: string };
  addCustomRole: (role: Omit<CustomRole, 'id' | 'createdDate'>) => void;
  editCustomRole: (roleId: string, updated: Omit<CustomRole, 'id' | 'createdDate'>) => void;
  deleteCustomRole: (roleId: string) => void;
  addUser: (user: Omit<UserProfile, 'id' | 'status' | 'isLoggedIn' | 'documents' | 'leaveBalance'>) => void;
  updateUser: (userId: string, data: Partial<UserProfile> & { password?: string }) => void;
  deleteUser: (userId: string) => void;
  addDocument: (userId: string, doc: Omit<UserDocument, 'id' | 'uploadDate'>) => void;
  editDocument: (userId: string, docId: string, updated: Partial<UserDocument>) => void;
  deleteDocument: (userId: string, docId: string) => void;
  verifyDocument: (userId: string, docId: string, status: DocumentStatus, notes?: string) => void;
  addSalaryIncrement: (userId: string, newSalary: number, percentage: number, notes: string) => void;

  // Team Management
  addTeamMembers: (teamId: string, memberIds: string[]) => void;
  removeTeamMember: (teamId: string, memberId: string) => void;
  changeTeamLeader: (teamId: string, leaderId: string) => void;

  // Notifications
  addNotification: (notification: Omit<AppNotification, 'id' | 'timestamp' | 'isRead'>) => void;
  markNotificationAsRead: (id: string) => void;
  clearAllNotifications: () => void;

  // Chat
  sendMessage: (text: string, channelId?: string, recipientId?: string, attachmentName?: string) => void;

  // Payslip Generator & Configuration
  payslipConfig: PayslipConfig;
  updatePayslipConfig: (newConfig: Partial<PayslipConfig>) => void;
  calculatePayslipsForCriteria: (month: string, year: string, targetUserId: string) => Payslip[];
  saveGeneratedPayslips: (generatedPayslips: Payslip[]) => void;
  generateMonthlyPayslips: (monthYear: string) => void;
}

const SystemContext = createContext<SystemContextType | undefined>(undefined);

// ─── Helper: fire-and-forget API call ─────────────────────────────────────────
function persist(url: string, method: string, body?: unknown) {
  fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  }).catch(err => console.error(`[persist] ${method} ${url}:`, err));
}

export const SystemProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // ── State ──────────────────────────────────────────────────────────────────
  const [isLoading, setIsLoading] = useState(true);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('task_system_user_id') || null;
    }
    return null;
  });
  const [teams, setTeams] = useState<Team[]>([]);
  const [projectTypes, setProjectTypes] = useState<ProjectTypeMaster[]>([]);
  const [taskTypes, setTaskTypes] = useState<TaskTypeMaster[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [leaveApplications, setLeaveApplications] = useState<LeaveApplication[]>([]);
  const [compOffRequests, setCompOffRequests] = useState<CompOffRequest[]>([]);
  const [leaveRules, setLeaveRules] = useState<LeaveRule[]>([]);
  const [events] = useState<CompanyEvent[]>(INITIAL_EVENTS);
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [chatChannels] = useState<ChatChannel[]>(INITIAL_CHAT_CHANNELS);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('task_system_chat_messages');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          // fallback
        }
      }
    }
    return INITIAL_CHAT_MESSAGES;
  });
  const [customRoles, setCustomRoles] = useState<CustomRole[]>([]);
  const [systemSettings, setSystemSettings] = useState<SystemSettings>(DEFAULT_SETTINGS);
  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('task_system_notifications');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          // fallback
        }
      }
    }
    return [
      {
        id: 'notif-init-1',
        userId: 'ALL',
        title: 'Leave & Attendance Policy Active',
        message: 'Minimum advance leave notice period is configured. Ensure handover colleague is specified on application.',
        type: 'INFO',
        timestamp: '09:00 AM',
        isRead: false,
        linkUrl: '/leaves'
      }
    ];
  });

  const addNotification = useCallback((n: Omit<AppNotification, 'id' | 'timestamp' | 'isRead'>) => {
    const newNotif: AppNotification = {
      ...n,
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isRead: false
    };
    setNotifications(prev => {
      const updated = [newNotif, ...prev];
      if (typeof window !== 'undefined') {
        localStorage.setItem('task_system_notifications', JSON.stringify(updated));
      }
      return updated;
    });
  }, []);

  const markNotificationAsRead = useCallback((id: string) => {
    setNotifications(prev => {
      const updated = prev.map(n => n.id === id ? { ...n, isRead: true } : n);
      if (typeof window !== 'undefined') {
        localStorage.setItem('task_system_notifications', JSON.stringify(updated));
      }
      return updated;
    });
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('task_system_notifications');
    }
  }, []);

  const currentUser = users.find(u => u.id === currentUserId) || null;
  const isAuthenticated = !!currentUser;
  
  // Identify if current user is a TL and get their team members
  const myTeamIds = currentUser ? teams.filter(t => t.leaderId === currentUser.id).map(t => t.id) : [];
  const myTeamMemberIds = users.filter(u => myTeamIds.includes(u.teamId || '')).map(u => u.id);

  // ── Load all data from DB on mount ─────────────────────────────────────────
  useEffect(() => {
    const loadAll = async () => {
      try {
        const [
          usersRes, teamsRes, projectTypesRes, taskTypesRes,
          projectsRes, tasksRes, attendanceRes, leavesRes,
          compOffRes, leaveRulesRes, payslipsRes, customRolesRes, settingsRes
        ] = await Promise.all([
          fetch('/api/users'),
          fetch('/api/teams'),
          fetch('/api/project-types'),
          fetch('/api/task-types'),
          fetch('/api/projects'),
          fetch('/api/tasks'),
          fetch('/api/attendance'),
          fetch('/api/leaves'),
          fetch('/api/comp-off'),
          fetch('/api/leave-rules'),
          fetch('/api/payslips'),
          fetch('/api/custom-roles'),
          fetch('/api/settings'),
        ]);

        const [
          usersData, teamsData, projectTypesData, taskTypesData,
          projectsData, tasksData, attendanceData, leavesData,
          compOffData, leaveRulesData, payslipsData, customRolesData, settingsData
        ] = await Promise.all([
          usersRes.json(), teamsRes.json(), projectTypesRes.json(), taskTypesRes.json(),
          projectsRes.json(), tasksRes.json(), attendanceRes.json(), leavesRes.json(),
          compOffRes.json(), leaveRulesRes.json(), payslipsRes.json(), customRolesRes.json(), settingsRes.json(),
        ]);

        if (usersData.users) setUsers(usersData.users);
        if (teamsData.teams) setTeams(teamsData.teams);
        if (projectTypesData.projectTypes) setProjectTypes(projectTypesData.projectTypes);
        if (taskTypesData.taskTypes) setTaskTypes(taskTypesData.taskTypes);
        if (projectsData.projects) setProjects(projectsData.projects);
        if (tasksData.tasks) setTasks(tasksData.tasks);
        if (attendanceData.attendance) setAttendance(attendanceData.attendance);
        if (leavesData.leaveApplications) setLeaveApplications(leavesData.leaveApplications);
        if (compOffData.compOffRequests) setCompOffRequests(compOffData.compOffRequests);
        if (leaveRulesData.leaveRules) setLeaveRules(leaveRulesData.leaveRules);
        if (payslipsData.payslips) setPayslips(payslipsData.payslips);
        if (customRolesData.customRoles) setCustomRoles(customRolesData.customRoles);
        if (settingsData.settings) setSystemSettings(settingsData.settings);
      } catch (err) {
        console.error('Failed to load initial data from DB:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadAll();
  }, []);

  // ── Auth ───────────────────────────────────────────────────────────────────
  const login = useCallback(async (email: string, pass: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: pass }),
      });
      const data = await res.json();
      if (res.ok && data.user) {
        // Refresh users list, then set current user
        const usersRes = await fetch('/api/users');
        const usersData = await usersRes.json();
        if (usersData.users) setUsers(usersData.users);

        setCurrentUserId(data.user.id);
        if (typeof window !== 'undefined') {
          localStorage.setItem('task_system_user_id', data.user.id);
        }
        // Track activity timestamp
        persist(`/api/users/${data.user.id}`, 'PATCH', { lastActivityTimestamp: Date.now() });
        return true;
      }
      return false;
    } catch (err) {
      console.error('Login error:', err);
      return false;
    }
  }, []);

  const logout = useCallback(() => {
    setCurrentUserId(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('task_system_user_id');
    }
  }, []);

  const switchPersona = useCallback((role: UserRole) => {
    const targetUser = users.find(u => u.role === role);
    if (targetUser) {
      setCurrentUserId(targetUser.id);
      if (typeof window !== 'undefined') {
        localStorage.setItem('task_system_user_id', targetUser.id);
      }
    }
  }, [users]);

  // ── Attendance / Timer ─────────────────────────────────────────────────────
  const isCheckedIn = currentUser ? currentUser.isLoggedIn : false;
  const [activeWorkSeconds, setActiveWorkSeconds] = useState<number>(27000);

  // Auto Check-Out Scheduler
  useEffect(() => {
    const autoCheckOutTimer = setInterval(() => {
      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes();
      const is9PMWindow = hours === 21 && minutes === 0;
      const is1130PMWindow = hours === 23 && minutes === 30;

      if (is9PMWindow || is1130PMWindow) {
        const twentyMinsAgo = Date.now() - 20 * 60 * 1000;
        setUsers(prevUsers =>
          prevUsers.map(u => {
            if (u.isLoggedIn && (u.lastActivityTimestamp || 0) < twentyMinsAgo) {
              const updated = {
                ...u,
                isLoggedIn: false,
                status: 'OFFLINE' as const,
                checkOutTime: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              };
              persist(`/api/users/${u.id}`, 'PATCH', {
                isLoggedIn: false, status: 'OFFLINE', checkOutTime: updated.checkOutTime
              });
              return updated;
            }
            return u;
          })
        );
      }
    }, 60000);
    return () => clearInterval(autoCheckOutTimer);
  }, []);

  // Live Timer Ticker
  useEffect(() => {
    const interval = setInterval(() => {
      if (isCheckedIn) setActiveWorkSeconds(prev => prev + 1);
      setTasks(prevTasks =>
        prevTasks.map(task => {
          if (task.isTimerRunning && task.activeTimerStart) {
            return { ...task, loggedHours: parseFloat((task.loggedHours + 0.00028).toFixed(2)) };
          }
          return task;
        })
      );
    }, 1000);
    return () => clearInterval(interval);
  }, [isCheckedIn]);

  const toggleCheckIn = useCallback(() => {
    if (!currentUser) return;
    const today = new Date().toISOString().split('T')[0];
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    setUsers(prev =>
      prev.map(u =>
        u.id === currentUser.id
          ? {
              ...u,
              isLoggedIn: !u.isLoggedIn,
              status: !u.isLoggedIn ? 'ONLINE' : 'OFFLINE',
              checkInTime: !u.isLoggedIn ? nowTime : u.checkInTime,
              checkOutTime: u.isLoggedIn ? nowTime : undefined,
              lastActivityTimestamp: Date.now()
            }
          : u
      )
    );

    // Persist user status
    const willBeCheckedIn = !isCheckedIn;
    persist(`/api/users/${currentUser.id}`, 'PATCH', {
      isLoggedIn: willBeCheckedIn,
      status: willBeCheckedIn ? 'ONLINE' : 'OFFLINE',
      checkInTime: willBeCheckedIn ? nowTime : currentUser.checkInTime,
      checkOutTime: !willBeCheckedIn ? nowTime : null,
      lastActivityTimestamp: Date.now(),
    });

    if (!isCheckedIn) {
      const isLateCheckin = new Date().getHours() >= 9 && new Date().getMinutes() > 30;
      const newRecord: AttendanceRecord = {
        id: `att-${Date.now()}`,
        userId: currentUser.id,
        date: today,
        checkIn: nowTime,
        workHours: 0.1,
        isLate: isLateCheckin,
        status: 'PRESENT',
        notes: isLateCheckin ? 'Checked in after threshold (Late Flag)' : 'On-time checkin'
      };
      setAttendance(prev => [newRecord, ...prev]);
      persist('/api/attendance', 'POST', newRecord);
    } else {
      const todayRecord = attendance.find(a => a.userId === currentUser.id && a.date === today);
      setAttendance(prev =>
        prev.map(att =>
          att.userId === currentUser.id && att.date === today
            ? { ...att, checkOut: nowTime, workHours: parseFloat((activeWorkSeconds / 3600).toFixed(1)) }
            : att
        )
      );
      if (todayRecord) {
        persist(`/api/attendance/${todayRecord.id}`, 'PATCH', {
          checkOut: nowTime,
          workHours: parseFloat((activeWorkSeconds / 3600).toFixed(1)),
        });
      }
    }
  }, [currentUser, isCheckedIn, attendance, activeWorkSeconds]);

  const toggleTaskTimer = useCallback((taskId: string) => {
    if (!currentUser) return;
    setTasks(prev =>
      prev.map(t => {
        if (t.id === taskId) {
          const isRunning = !t.isTimerRunning;
          let updatedWorklogs = [...t.worklogs];
          let updatedLoggedHours = t.loggedHours;

          if (!isRunning && t.activeTimerStart) {
            const durationSec = Math.max(1, Math.round((Date.now() - new Date(t.activeTimerStart).getTime()) / 1000));
            const hoursAdded = durationSec / 3600;
            updatedLoggedHours = parseFloat((t.loggedHours + hoursAdded).toFixed(2));

            const isStoppedByOther = currentUser.id !== t.assigneeId;
            updatedWorklogs.unshift({
              id: `wl-${Date.now()}`,
              userId: currentUser.id,
              userName: isStoppedByOther ? `${currentUser.name} (${currentUser.role.replace('_', ' ')})` : currentUser.name,
              startTime: new Date(t.activeTimerStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              endTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              durationSeconds: durationSec,
              notes: isStoppedByOther ? `Timer stopped by ${currentUser.name}` : 'Live timer work session'
            });
          }

          const updated = {
            ...t,
            isTimerRunning: isRunning,
            activeTimerStart: isRunning ? new Date().toISOString() : undefined,
            loggedHours: updatedLoggedHours,
            status: (isRunning ? 'IN_PROGRESS' : t.status) as Task['status'],
            worklogs: updatedWorklogs
          };

          persist(`/api/tasks/${taskId}`, 'PATCH', {
            isTimerRunning: updated.isTimerRunning,
            activeTimerStart: updated.activeTimerStart ?? null,
            loggedHours: updated.loggedHours,
            status: updated.status,
            worklogsJson: JSON.stringify(updatedWorklogs),
          });

          return updated;
        }
        return { ...t, isTimerRunning: false, activeTimerStart: undefined };
      })
    );
  }, [currentUser]);

  // ── Task Actions ───────────────────────────────────────────────────────────
  const addTask = useCallback((taskData: Omit<Task, 'id' | 'createdAt' | 'worklogs' | 'loggedHours'>) => {
    if (!currentUser) return;
    const newTask: Task = {
      ...taskData,
      id: `task-${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0],
      loggedHours: 0,
      worklogs: [],
      attachments: taskData.attachments || [],
      isSoftDeleted: false
    };
    setTasks(prev => [newTask, ...prev]);
    persist('/api/tasks', 'POST', newTask);
  }, [currentUser]);

  const assignTaskToTeam = useCallback((teamId: string, taskData: Omit<Task, 'id' | 'createdAt' | 'worklogs' | 'loggedHours' | 'assigneeId'>) => {
    if (!currentUser) return;
    const teamObj = teams.find(t => t.id === teamId);
    if (!teamObj) return;

    const newTasks: Task[] = teamObj.memberIds.map((memId, idx) => ({
      ...taskData,
      id: `task-${Date.now()}-${idx}-${memId}`,
      assigneeId: memId,
      createdAt: new Date().toISOString().split('T')[0],
      loggedHours: 0,
      worklogs: [],
      attachments: taskData.attachments || [],
      isSoftDeleted: false
    }));

    setTasks(prev => [...newTasks, ...prev]);
    newTasks.forEach(t => persist('/api/tasks', 'POST', t));
  }, [currentUser, teams]);

  const assignTaskToAllMembers = useCallback((taskData: Omit<Task, 'id' | 'createdAt' | 'worklogs' | 'loggedHours' | 'assigneeId'>) => {
    if (!currentUser) return;
    const targetUsers = users.filter(u => u.role === 'EMPLOYEE' || u.role === 'TEAM_LEADER');
    const newTasks: Task[] = targetUsers.map((u, idx) => ({
      ...taskData,
      id: `task-${Date.now()}-${idx}-${u.id}`,
      assigneeId: u.id,
      createdAt: new Date().toISOString().split('T')[0],
      loggedHours: 0,
      worklogs: [],
      attachments: taskData.attachments || [],
      isSoftDeleted: false
    }));

    setTasks(prev => [...newTasks, ...prev]);
    newTasks.forEach(t => persist('/api/tasks', 'POST', t));
  }, [currentUser, users]);

  const editTask = useCallback((taskId: string, updated: Partial<Task>) => {
    setTasks(prev => prev.map(t => (t.id === taskId ? { ...t, ...updated } : t)));
    persist(`/api/tasks/${taskId}`, 'PATCH', {
      ...updated,
      worklogsJson: updated.worklogs ? JSON.stringify(updated.worklogs) : undefined,
      attachmentsJson: updated.attachments ? JSON.stringify(updated.attachments) : undefined
    });
  }, []);

  const deleteTask = useCallback((taskId: string): { success: boolean; message?: string } => {
    if (!currentUser) return { success: false, message: 'Not authenticated' };
    const task = tasks.find(t => t.id === taskId);
    if (!task) return { success: false, message: 'Task not found' };

    const isSuperAdmin = currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'ADMIN_HR';
    const isTeamLead = currentUser.role === 'TEAM_LEADER';
    const isAssignee = task.assigneeId === currentUser.id;

    if (currentUser.role === 'EMPLOYEE') {
      if (!isAssignee) {
        return { success: false, message: 'You can only delete your own assigned tasks.' };
      }
      if (task.loggedHours > 0 || task.worklogs.length > 0 || task.isTimerRunning) {
        return { success: false, message: 'Cannot delete task after work has started or timer has been logged.' };
      }
      setTasks(prev => prev.filter(t => t.id !== taskId));
      persist(`/api/tasks/${taskId}`, 'DELETE');
      return { success: true, message: 'Task deleted successfully.' };
    }

    if (isTeamLead) {
      const softDeletedTask = {
        ...task,
        isSoftDeleted: true,
        softDeletedBy: currentUser.name,
        softDeletedRole: 'TEAM_LEADER'
      };
      setTasks(prev => prev.map(t => (t.id === taskId ? softDeletedTask : t)));
      persist(`/api/tasks/${taskId}`, 'PATCH', {
        isSoftDeleted: true,
        softDeletedBy: currentUser.name,
        softDeletedRole: 'TEAM_LEADER'
      });
      return { success: true, message: 'Task deleted by Team Leader (Moved to Super Admin queue).' };
    }

    if (isSuperAdmin) {
      setTasks(prev => prev.filter(t => t.id !== taskId));
      persist(`/api/tasks/${taskId}`, 'DELETE');
      return { success: true, message: 'Task permanently deleted by Super Admin.' };
    }

    return { success: false, message: 'Permission denied.' };
  }, [currentUser, tasks]);

  const restoreTask = useCallback((taskId: string) => {
    setTasks(prev =>
      prev.map(t => (t.id === taskId ? { ...t, isSoftDeleted: false, softDeletedBy: undefined, softDeletedRole: undefined } : t))
    );
    persist(`/api/tasks/${taskId}`, 'PATCH', {
      isSoftDeleted: false,
      softDeletedBy: null,
      softDeletedRole: null
    });
  }, []);

  const hardDeleteTask = useCallback((taskId: string) => {
    setTasks(prev => prev.filter(t => t.id !== taskId));
    persist(`/api/tasks/${taskId}`, 'DELETE');
  }, []);

  const sendTaskReminder = useCallback((taskId: string) => {
    if (!currentUser) return;
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    addNotification({
      userId: task.assigneeId,
      title: `Task Priority Reminder 🔔`,
      message: `${currentUser.name} requested immediate priority on task: "${task.title}" (Due: ${task.dueDate}).`,
      type: 'INFO',
      linkUrl: '/tasks',
      referenceId: task.id
    });
  }, [currentUser, tasks, addNotification]);

  const updateTaskStatus = useCallback((taskId: string, status: Task['status']) => {
    setTasks(prev => prev.map(t => (t.id === taskId ? { ...t, status } : t)));
    persist(`/api/tasks/${taskId}`, 'PATCH', { status });
  }, []);

  // ── Leave Actions ──────────────────────────────────────────────────────────
  const applyLeave = useCallback((leaveData: Omit<LeaveApplication, 'id' | 'appliedOn' | 'status' | 'userId' | 'userName' | 'userRole'> & { workInAbsence?: string }) => {
    if (!currentUser) return;
    const newLeave: LeaveApplication = {
      ...leaveData,
      id: `lv-${Date.now()}`,
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      status: 'PENDING',
      appliedOn: new Date().toISOString().split('T')[0],
      workInAbsence: leaveData.workInAbsence
    };
    setLeaveApplications(prev => [newLeave, ...prev]);
    persist('/api/leaves', 'POST', newLeave);

    // Notify Team Leader if applicant is in a team
    const applicantTeam = teams.find(t => t.id === currentUser.teamId);
    if (applicantTeam && applicantTeam.leaderId && applicantTeam.leaderId !== currentUser.id) {
      addNotification({
        userId: applicantTeam.leaderId,
        teamId: applicantTeam.id,
        title: `Leave Applied by ${currentUser.name}`,
        message: `${currentUser.name} applied for ${leaveData.days} days ${leaveData.leaveType} leave (${leaveData.startDate} to ${leaveData.endDate}). Handover: ${leaveData.workInAbsence || 'Not specified'}.`,
        type: 'LEAVE_APPLIED',
        linkUrl: '/leaves',
        referenceId: newLeave.id
      });
    }

    // Always notify Super Admin
    addNotification({
      userId: 'SUPER_ADMIN',
      targetRole: 'SUPER_ADMIN',
      title: `Leave Applied by ${currentUser.name}`,
      message: `${currentUser.name} (${applicantTeam ? applicantTeam.name : 'Individual Staff'}) applied for ${leaveData.days} days ${leaveData.leaveType} leave (${leaveData.startDate} to ${leaveData.endDate}). Handover: ${leaveData.workInAbsence || 'Not specified'}.`,
      type: 'LEAVE_APPLIED',
      linkUrl: '/leaves',
      referenceId: newLeave.id
    });
  }, [currentUser, teams, addNotification]);

  const editLeave = useCallback((leaveId: string, updated: Partial<LeaveApplication>) => {
    setLeaveApplications(prev => prev.map(l => (l.id === leaveId ? { ...l, ...updated } : l)));
    persist(`/api/leaves/${leaveId}`, 'PATCH', updated);
  }, []);

  const reviewLeave = useCallback((leaveId: string, status: 'APPROVED' | 'REJECTED', reason?: string) => {
    if (!currentUser) return;
    setLeaveApplications(prev =>
      prev.map(l => {
        if (l.id === leaveId) {
          if (status === 'APPROVED') {
            setUsers(uPrev =>
              uPrev.map(u => {
                if (u.id === l.userId) {
                  const currentBalance = u.leaveBalance;
                  const typeKey = l.leaveType.toLowerCase() as 'paid' | 'sick' | 'casual' | 'compOff';
                  const newBalance = {
                    ...currentBalance,
                    [typeKey]: Math.max(0, (currentBalance[typeKey] || 0) - l.days),
                    used: currentBalance.used + l.days
                  };
                  persist(`/api/users/${u.id}`, 'PATCH', { leaveBalanceJson: JSON.stringify(newBalance) });
                  return { ...u, leaveBalance: newBalance };
                }
                return u;
              })
            );
          }
          const updatedLeave = {
            ...l,
            status,
            rejectionReason: reason,
            approverId: currentUser.id,
            approverName: `${currentUser.name} (${currentUser.role.replace('_', ' ')})`
          };
          persist(`/api/leaves/${leaveId}`, 'PATCH', {
            status,
            rejectionReason: reason,
            approverId: currentUser.id,
            approverName: updatedLeave.approverName,
          });

          // Notify the applicant user
          addNotification({
            userId: l.userId,
            title: `Leave Application ${status === 'APPROVED' ? 'Approved ✅' : 'Rejected ❌'}`,
            message: `Your ${l.leaveType} leave application (${l.startDate} to ${l.endDate}) was ${status.toLowerCase()} by ${currentUser.name}.${reason ? ` Reason: ${reason}` : ''}`,
            type: 'LEAVE_STATUS',
            linkUrl: '/leaves',
            referenceId: l.id
          });

          return updatedLeave;
        }
        return l;
      })
    );
  }, [currentUser, addNotification]);

  const softDeleteLeave = useCallback((leaveId: string) => {
    if (!currentUser) return;
    setLeaveApplications(prev =>
      prev.map(l => (l.id === leaveId ? { ...l, isSoftDeleted: true, softDeletedBy: currentUser.name } : l))
    );
    persist(`/api/leaves/${leaveId}`, 'PATCH', { isSoftDeleted: true, softDeletedBy: currentUser.name });
  }, [currentUser]);

  const hardDeleteLeave = useCallback((leaveId: string) => {
    setLeaveApplications(prev => prev.filter(l => l.id !== leaveId));
    persist(`/api/leaves/${leaveId}`, 'DELETE');
  }, []);

  const addPaidLeaveCredit = useCallback((userIds: string[], days: number, reason: string) => {
    setUsers(prev =>
      prev.map(u => {
        if (userIds.includes(u.id)) {
          const newBalance = { ...u.leaveBalance, paid: u.leaveBalance.paid + days };
          persist(`/api/users/${u.id}`, 'PATCH', { leaveBalanceJson: JSON.stringify(newBalance) });
          
          addNotification({
            userId: u.id,
            title: `Paid Leave Credited (+${days} Days)`,
            message: `${days} paid leave day(s) credited to your account. Reason: ${reason}`,
            type: 'INFO',
            linkUrl: '/leaves'
          });

          return { ...u, leaveBalance: newBalance };
        }
        return u;
      })
    );
  }, [addNotification]);

  const submitCompOff = useCallback((requestData: Omit<CompOffRequest, 'id' | 'requestedOn' | 'status' | 'userId' | 'userName'> & { userId?: string; userName?: string; convertedDays?: number; status?: 'PENDING' | 'APPROVED_BY_TL' | 'APPROVED' | 'REJECTED' }) => {
    if (!currentUser) return;
    const targetUser = requestData.userId ? users.find(u => u.id === requestData.userId) : currentUser;
    const applicantId = targetUser?.id || currentUser.id;
    const applicantName = targetUser?.name || currentUser.name;

    const newReq: CompOffRequest = {
      id: `co-${Date.now()}`,
      userId: applicantId,
      userName: applicantName,
      workDate: requestData.workDate,
      hoursWorked: requestData.hoursWorked,
      reason: requestData.reason,
      projectWorkedOn: requestData.projectWorkedOn,
      status: requestData.status || 'PENDING',
      convertedDays: requestData.convertedDays !== undefined ? requestData.convertedDays : (Math.floor(requestData.hoursWorked / 8) || 1),
      requestedOn: new Date().toISOString().split('T')[0]
    };

    setCompOffRequests(prev => [newReq, ...prev]);
    persist('/api/comp-off', 'POST', newReq);

    // Notify Super Admin & Team Leader
    const applicantTeam = teams.find(t => t.id === targetUser?.teamId);
    if (applicantTeam && applicantTeam.leaderId && applicantTeam.leaderId !== currentUser.id) {
      addNotification({
        userId: applicantTeam.leaderId,
        teamId: applicantTeam.id,
        title: `Comp-Off Claim from ${applicantName}`,
        message: `${applicantName} submitted a Comp-Off claim for ${requestData.workDate} (${requestData.hoursWorked} hrs).`,
        type: 'COMP_OFF',
        linkUrl: '/leaves',
        referenceId: newReq.id
      });
    }

    addNotification({
      userId: 'SUPER_ADMIN',
      targetRole: 'SUPER_ADMIN',
      title: `Comp-Off Claim from ${applicantName}`,
      message: `${applicantName} submitted a Comp-Off claim for ${requestData.workDate} (${requestData.hoursWorked} hrs / ${newReq.convertedDays} day(s) credit).`,
      type: 'COMP_OFF',
      linkUrl: '/leaves',
      referenceId: newReq.id
    });
  }, [currentUser, users, teams, addNotification]);

  const reviewCompOff = useCallback((requestId: string, status: 'PENDING' | 'APPROVED_BY_TL' | 'APPROVED' | 'REJECTED') => {
    if (!currentUser) return;
    setCompOffRequests(prev =>
      prev.map(co => {
        if (co.id === requestId) {
          if (status === 'APPROVED') {
            setUsers(uPrev =>
              uPrev.map(u => {
                if (u.id === co.userId) {
                  const newBalance = { ...u.leaveBalance, compOff: u.leaveBalance.compOff + co.convertedDays };
                  persist(`/api/users/${u.id}`, 'PATCH', { leaveBalanceJson: JSON.stringify(newBalance) });
                  return { ...u, leaveBalance: newBalance };
                }
                return u;
              })
            );
          }

          persist(`/api/comp-off/${requestId}`, 'PATCH', { status, verifiedBy: currentUser.name });

          // Notify the applicant
          addNotification({
            userId: co.userId,
            title: `Comp-Off Request: ${status.replace(/_/g, ' ')}`,
            message: `Your Comp-Off request for ${co.workDate} was reviewed as "${status.replace(/_/g, ' ')}" by ${currentUser.name}.`,
            type: 'COMP_OFF',
            linkUrl: '/leaves',
            referenceId: co.id
          });

          return { ...co, status, verifiedBy: currentUser.name };
        }
        return co;
      })
    );
  }, [currentUser, addNotification]);

  // ── Admin / Master Actions ─────────────────────────────────────────────────
  const updateSystemSettings = useCallback((newSettings: Partial<SystemSettings>) => {
    setSystemSettings(prev => {
      const merged = { ...prev, ...newSettings };
      persist('/api/settings', 'POST', merged);
      return merged;
    });
  }, []);

  const addLeaveRule = useCallback((rule: Omit<LeaveRule, 'id'>) => {
    const newRule = { ...rule, id: `rule-${Date.now()}` };
    setLeaveRules(prev => [...prev, newRule]);
    persist('/api/leave-rules', 'POST', newRule);
  }, []);

  const addProjectType = useCallback((type: Omit<ProjectTypeMaster, 'id'>) => {
    const newType = { ...type, id: `pt-${Date.now()}` };
    setProjectTypes(prev => [...prev, newType]);
    persist('/api/project-types', 'POST', newType);
  }, []);

  const editProjectType = useCallback((typeId: string, updated: Partial<ProjectTypeMaster>) => {
    setProjectTypes(prev => prev.map(pt => (pt.id === typeId ? { ...pt, ...updated } : pt)));
    persist(`/api/project-types/${typeId}`, 'PATCH', updated);
  }, []);

  const deleteProjectType = useCallback((typeId: string): { success: boolean; message?: string } => {
    const isUsed = projects.some(p => p.typeId === typeId);
    if (isUsed) {
      return { success: false, message: 'Cannot delete Project Type because it is assigned to existing projects.' };
    }
    setProjectTypes(prev => prev.filter(pt => pt.id !== typeId));
    persist(`/api/project-types/${typeId}`, 'DELETE');
    return { success: true, message: 'Project Type deleted successfully.' };
  }, [projects]);

  const addTaskType = useCallback((type: Omit<TaskTypeMaster, 'id'>) => {
    const newType = { ...type, id: `tt-${Date.now()}` };
    setTaskTypes(prev => [...prev, newType]);
    persist('/api/task-types', 'POST', newType);
  }, []);

  const editTaskType = useCallback((typeId: string, updated: Partial<TaskTypeMaster>) => {
    setTaskTypes(prev => prev.map(tt => (tt.id === typeId ? { ...tt, ...updated } : tt)));
    persist(`/api/task-types/${typeId}`, 'PATCH', updated);
  }, []);

  const deleteTaskType = useCallback((typeId: string): { success: boolean; message?: string } => {
    const isUsed = tasks.some(t => t.typeId === typeId && !t.isSoftDeleted);
    if (isUsed) {
      return { success: false, message: 'Cannot delete Task Type because it is assigned to existing tasks.' };
    }
    setTaskTypes(prev => prev.filter(tt => tt.id !== typeId));
    persist(`/api/task-types/${typeId}`, 'DELETE');
    return { success: true, message: 'Task Type deleted successfully.' };
  }, [tasks]);

  const addTeam = useCallback(async (teamData: Omit<Team, 'id'>) => {
    try {
      const newTeam = { id: `team-${Date.now()}`, ...teamData };
      const res = await fetch('/api/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTeam)
      });
      if (res.ok) {
        setTeams(prev => [...prev, newTeam]);
      }
    } catch (err) {
      console.error('Failed to add team:', err);
    }
  }, []);

  const updateTeam = useCallback(async (id: string, data: Partial<Omit<Team, 'id'>>) => {
    try {
      const res = await fetch(`/api/teams/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (res.ok) {
        const { team } = await res.json();
        setTeams(prev => prev.map(t => (t.id === id ? team : t)));
      }
    } catch (err) {
      console.error('Failed to update team:', err);
    }
  }, []);

  const addProject = useCallback((proj: Omit<Project, 'id' | 'progress'>) => {
    const newProject: Project = {
      ...proj,
      id: `proj-${Date.now()}`,
      progress: 0,
      assignedUserIds: proj.assignedUserIds || [],
      documents: proj.documents || [],
      startDate: proj.startDate || '',
      endDate: proj.endDate || proj.deadline || '',
      completionDate: proj.status === 'COMPLETED' ? (proj.completionDate || new Date().toISOString().split('T')[0]) : '',
      description: proj.description || '',
      estimatedHours: proj.estimatedHours || 0,
      assignmentType: proj.assignmentType || 'TEAM',
      teamId: proj.teamId || '',
      clientName: proj.clientName || '',
      budget: proj.budget || 0,
      status: proj.status || 'NOT_STARTED',
    };
    setProjects(prev => [...prev, newProject]);
    persist('/api/projects', 'POST', newProject);
  }, []);

  const editProject = useCallback((projectId: string, updated: Partial<Project>) => {
    setProjects(prev =>
      prev.map(p => {
        if (p.id === projectId) {
          const newStatus = updated.status !== undefined ? updated.status : p.status;
          let completionDate = updated.completionDate !== undefined ? updated.completionDate : p.completionDate;
          if (newStatus === 'COMPLETED' && !completionDate) {
            completionDate = new Date().toISOString().split('T')[0];
          } else if (newStatus !== 'COMPLETED' && updated.status !== undefined && updated.completionDate === undefined) {
            completionDate = '';
          }
          const merged: Project = {
            ...p,
            ...updated,
            status: newStatus,
            completionDate,
          };
          persist(`/api/projects/${projectId}`, 'PATCH', merged);
          return merged;
        }
        return p;
      })
    );
  }, []);

  const deleteProject = useCallback((projectId: string): { success: boolean; message?: string } => {
    setProjects(prev => prev.filter(p => p.id !== projectId));
    persist(`/api/projects/${projectId}`, 'DELETE');
    return { success: true, message: 'Project deleted successfully.' };
  }, []);

  const addCustomRole = useCallback((role: Omit<CustomRole, 'id' | 'createdDate'>) => {
    const newRole = { ...role, id: `role-${Date.now()}`, createdDate: new Date().toISOString().split('T')[0] };
    setCustomRoles(prev => [...prev, newRole]);
    persist('/api/custom-roles', 'POST', newRole);
  }, []);

  const editCustomRole = useCallback((roleId: string, updated: Omit<CustomRole, 'id' | 'createdDate'>) => {
    setCustomRoles(prev => prev.map(r => (r.id === roleId ? { ...r, ...updated } : r)));
    persist(`/api/custom-roles/${roleId}`, 'PATCH', updated);
  }, []);

  const deleteCustomRole = useCallback((roleId: string) => {
    setCustomRoles(prev => prev.filter(r => r.id !== roleId));
    persist(`/api/custom-roles/${roleId}`, 'DELETE');
  }, []);

  const addUser = useCallback((userData: Omit<UserProfile, 'id' | 'status' | 'isLoggedIn' | 'documents' | 'leaveBalance' | 'emergencyContacts'> & { password?: string }) => {
    const newUser: UserProfile = {
      name: userData.name,
      email: userData.email,
      title: userData.title,
      role: userData.role,
      customRoleId: userData.customRoleId,
      teamId: userData.teamId,
      phone: userData.phone,
      address: userData.address,
      birthDate: userData.birthDate,
      joiningDate: userData.joiningDate,
      avatar: userData.avatar,
      salary: userData.salary,
      id: `user-${Date.now()}`,
      status: 'OFFLINE',
      isLoggedIn: false,
      documents: [],
      emergencyContacts: [],
      leaveBalance: { paid: 18, sick: 10, casual: 6, compOff: 0, used: 0 }
    };
    setUsers(prev => [...prev, newUser]);
    persist('/api/users', 'POST', { ...newUser, password: userData.password || 'admin123' });
  }, []);

  const updateUser = useCallback((userId: string, data: Partial<UserProfile> & { password?: string }) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, ...data } : u));
    // Build the API payload
    const payload: Record<string, unknown> = {};
    if (data.name !== undefined) payload.name = data.name;
    if (data.title !== undefined) payload.title = data.title;
    if (data.role !== undefined) payload.role = data.role;
    if (data.customRoleId !== undefined) payload.customRoleId = data.customRoleId;
    if (data.phone !== undefined) payload.phone = data.phone;
    if (data.address !== undefined) payload.address = data.address;
    if (data.birthDate !== undefined) payload.birthDate = data.birthDate;
    if (data.joiningDate !== undefined) payload.joiningDate = data.joiningDate;
    if (data.avatar !== undefined) payload.avatar = data.avatar;
    if (data.teamId !== undefined) payload.teamId = data.teamId;
    if (data.salary !== undefined) payload.salaryJson = JSON.stringify(data.salary);
    if (data.documents !== undefined) payload.documentsJson = JSON.stringify(data.documents);
    if (data.leaveBalance !== undefined) payload.leaveBalanceJson = JSON.stringify(data.leaveBalance);
    if (data.emergencyContacts !== undefined) payload.emergencyContactsJson = JSON.stringify(data.emergencyContacts);
    if (data.password !== undefined) payload.password = data.password;
    persist(`/api/users/${userId}`, 'PATCH', payload);
  }, []);

  const deleteUser = useCallback((userId: string) => {
    setUsers(prev => prev.filter(u => u.id !== userId));
    persist(`/api/users/${userId}`, 'DELETE');
  }, []);

  const addDocument = useCallback((userId: string, docData: Omit<UserDocument, 'id' | 'uploadDate'>) => {
    const newDoc: UserDocument = {
      ...docData,
      id: `doc-${Date.now()}`,
      uploadDate: new Date().toISOString().split('T')[0]
    };
    setUsers(prev =>
      prev.map(u => {
        if (u.id === userId) {
          const updatedDocs = [newDoc, ...(u.documents || [])];
          persist(`/api/users/${userId}`, 'PATCH', { documentsJson: JSON.stringify(updatedDocs) });
          return { ...u, documents: updatedDocs };
        }
        return u;
      })
    );
  }, []);

  const editDocument = useCallback((userId: string, docId: string, updated: Partial<UserDocument>) => {
    setUsers(prev =>
      prev.map(u => {
        if (u.id === userId) {
          const updatedDocs = (u.documents || []).map(d => (d.id === docId ? { ...d, ...updated } : d));
          persist(`/api/users/${userId}`, 'PATCH', { documentsJson: JSON.stringify(updatedDocs) });
          return { ...u, documents: updatedDocs };
        }
        return u;
      })
    );
  }, []);

  const deleteDocument = useCallback((userId: string, docId: string) => {
    setUsers(prev =>
      prev.map(u => {
        if (u.id === userId) {
          const updatedDocs = (u.documents || []).filter(d => d.id !== docId);
          persist(`/api/users/${userId}`, 'PATCH', { documentsJson: JSON.stringify(updatedDocs) });
          return { ...u, documents: updatedDocs };
        }
        return u;
      })
    );
  }, []);

  const verifyDocument = useCallback((userId: string, docId: string, status: DocumentStatus, notes?: string) => {
    if (!currentUser) return;
    setUsers(prev =>
      prev.map(u => {
        if (u.id === userId) {
          const updatedDocs = (u.documents || []).map(d =>
            d.id === docId ? { ...d, status, verifiedBy: currentUser.name, notes } : d
          );
          persist(`/api/users/${userId}`, 'PATCH', { documentsJson: JSON.stringify(updatedDocs) });
          return { ...u, documents: updatedDocs };
        }
        return u;
      })
    );
  }, [currentUser]);

  // ── Team Member & Leader Management ────────────────────────────────────────
  const addTeamMembers = useCallback((teamId: string, memberIdsToAdd: string[]) => {
    setTeams(prev =>
      prev.map(t => {
        if (t.id === teamId) {
          const currentMembers = Array.isArray(t.memberIds) ? t.memberIds : [];
          const uniqueMembers = Array.from(new Set([...currentMembers, ...memberIdsToAdd]));
          persist(`/api/teams/${teamId}`, 'PATCH', { memberIds: uniqueMembers });
          return { ...t, memberIds: uniqueMembers };
        }
        return t;
      })
    );
    // Update teamId on each user
    setUsers(prev =>
      prev.map(u => {
        if (memberIdsToAdd.includes(u.id)) {
          persist(`/api/users/${u.id}`, 'PATCH', { teamId });
          return { ...u, teamId };
        }
        return u;
      })
    );
  }, []);

  const removeTeamMember = useCallback((teamId: string, memberId: string) => {
    setTeams(prev =>
      prev.map(t => {
        if (t.id === teamId) {
          const currentMembers = Array.isArray(t.memberIds) ? t.memberIds : [];
          const updatedMembers = currentMembers.filter(id => id !== memberId);
          persist(`/api/teams/${teamId}`, 'PATCH', { memberIds: updatedMembers });
          return { ...t, memberIds: updatedMembers };
        }
        return t;
      })
    );
    setUsers(prev =>
      prev.map(u => {
        if (u.id === memberId && u.teamId === teamId) {
          persist(`/api/users/${u.id}`, 'PATCH', { teamId: null });
          return { ...u, teamId: undefined };
        }
        return u;
      })
    );
  }, []);

  const changeTeamLeader = useCallback((teamId: string, newLeaderId: string) => {
    setTeams(prev =>
      prev.map(t => {
        if (t.id === teamId) {
          const currentMembers = Array.isArray(t.memberIds) ? t.memberIds : [];
          const uniqueMembers = Array.from(new Set([...currentMembers, newLeaderId]));
          persist(`/api/teams/${teamId}`, 'PATCH', { leaderId: newLeaderId, memberIds: uniqueMembers });
          return { ...t, leaderId: newLeaderId, memberIds: uniqueMembers };
        }
        return t;
      })
    );
    setUsers(prev =>
      prev.map(u => {
        if (u.id === newLeaderId) {
          persist(`/api/users/${u.id}`, 'PATCH', { teamId });
          return { ...u, teamId };
        }
        return u;
      })
    );
  }, []);

  const addSalaryIncrement = useCallback((userId: string, newSalary: number, percentage: number, notes: string) => {
    if (!currentUser) return;
    setUsers(prev =>
      prev.map(u => {
        if (u.id === userId) {
          const oldTotal = u.salary.basic + u.salary.hra + u.salary.specialAllowance;
          const newBasic = Math.round(newSalary * 0.6);
          const newHra = Math.round(newSalary * 0.25);
          const newSpecial = newSalary - newBasic - newHra;

          const newSalaryObj = {
            ...u.salary,
            basic: newBasic,
            hra: newHra,
            specialAllowance: newSpecial,
            increments: [
              {
                id: `inc-${Date.now()}`,
                date: new Date().toISOString().split('T')[0],
                oldSalary: oldTotal,
                newSalary,
                percentage,
                approvedBy: currentUser.name,
                notes
              },
              ...u.salary.increments
            ]
          };
          persist(`/api/users/${userId}`, 'PATCH', { salaryJson: JSON.stringify(newSalaryObj) });
          return { ...u, salary: newSalaryObj };
        }
        return u;
      })
    );
  }, [currentUser]);

  // ── Chat ───────────────────────────────────────────────────────────────────
  const sendMessage = useCallback((text: string, channelId?: string, recipientId?: string, attachmentName?: string) => {
    if (!currentUser) return;
    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderAvatar: currentUser.avatar,
      channelId,
      recipientId,
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      attachment: attachmentName ? { name: attachmentName, size: '1.2 MB', type: 'PDF' } : undefined
    };
    setChatMessages(prev => {
      const updated = [...prev, newMsg];
      if (typeof window !== 'undefined') {
        localStorage.setItem('task_system_chat_messages', JSON.stringify(updated));
      }
      return updated;
    });
  }, [currentUser]);

  // ── Payslips ───────────────────────────────────────────────────────────────
  const currentPayslipConfig: PayslipConfig = useMemo(() => {
    return normalizePayslipConfig(systemSettings.payslipConfig);
  }, [systemSettings.payslipConfig]);

  const updatePayslipConfig = useCallback((newConfig: Partial<PayslipConfig>) => {
    setSystemSettings(prev => {
      const mergedConfig = normalizePayslipConfig({
        ...prev.payslipConfig,
        ...newConfig,
        earnings: {
          ...(prev.payslipConfig?.earnings || DEFAULT_PAYSLIP_CONFIG.earnings),
          ...(newConfig.earnings || {})
        },
        deductions: {
          ...(prev.payslipConfig?.deductions || DEFAULT_PAYSLIP_CONFIG.deductions),
          ...(newConfig.deductions || {})
        }
      });
      const updatedSettings = {
        ...prev,
        payslipConfig: mergedConfig
      };
      persist('/api/settings', 'POST', updatedSettings);
      return updatedSettings;
    });
  }, []);

  const calculatePayslipsForCriteria = useCallback((month: string, year: string, targetUserId: string): Payslip[] => {
    const config = normalizePayslipConfig(systemSettings.payslipConfig);
    const targetUsers = targetUserId === 'ALL' ? users : users.filter(u => u.id === targetUserId);
    const monthYear = `${month} ${year}`;
    const generationDate = new Date().toISOString().split('T')[0];

    return targetUsers.map(u => {
      const totalSalary = (u.salary?.basic || 0) + (u.salary?.hra || 0) + (u.salary?.specialAllowance || 0);

      // Components distribution
      const basic = config.earnings.basicSalary ? (u.salary?.basic || Math.round(totalSalary * 0.50)) : 0;
      const hra = config.earnings.hra ? (u.salary?.hra || Math.round(totalSalary * 0.25)) : 0;
      const special = config.earnings.specialAllowance ? (u.salary?.specialAllowance || Math.round(totalSalary * 0.15)) : 0;
      const da = config.earnings.daAllowance ? Math.round(totalSalary * 0.05) : 0;
      const ta = config.earnings.taAllowance ? Math.round(totalSalary * 0.03) : 0;
      const food = config.earnings.foodAllowance ? Math.round(totalSalary * 0.02) : 0;

      const earningsMap: Record<string, number> = {};
      if (config.earnings.basicSalary) earningsMap['Basic Salary'] = basic;
      if (config.earnings.hra) earningsMap['HRA Allowance'] = hra;
      if (config.earnings.specialAllowance) earningsMap['Special Allowance'] = special;
      if (config.earnings.daAllowance) earningsMap['DA Allowance'] = da;
      if (config.earnings.taAllowance) earningsMap['TA Allowance'] = ta;
      if (config.earnings.foodAllowance) earningsMap['Food Allowance'] = food;

      const grossSalary = Object.values(earningsMap).reduce((acc, val) => acc + val, 0) || totalSalary;

      // Deductions
      const pf = config.deductions.providentFund ? Math.round((config.earnings.basicSalary && basic > 0 ? basic : grossSalary) * (config.deductions.pfPercentage / 100)) : 0;
      const tax = config.deductions.incomeTax ? Math.round(grossSalary * (config.deductions.taxPercentage / 100)) : 0;
      
      let unpaidDays = 0;
      if (config.deductions.leaveDeduction) {
        unpaidDays = leaveApplications
          .filter(l => l.userId === u.id && l.leaveType === 'UNPAID' && l.status === 'APPROVED')
          .reduce((sum, l) => sum + (l.days || 0), 0);
      }
      const unpaidLeaveDeduction = unpaidDays > 0 ? Math.round((grossSalary / 30) * unpaidDays) : 0;

      let profTax = 0;
      if (config.deductions.profTax) {
        const slabs = config.deductions.profTaxSlabs || DEFAULT_PROF_TAX_SLABS;
        const sortedSlabs = [...slabs].sort((a, b) => b.minSalary - a.minSalary);
        const matchedSlab = sortedSlabs.find(s => grossSalary > s.minSalary);
        if (matchedSlab) {
          profTax = matchedSlab.taxAmount;
        } else {
          profTax = config.deductions.profTaxAmount || 0;
        }
      }

      const deductionsMap: Record<string, number> = {};
      if (config.deductions.providentFund) deductionsMap[`Provident Fund (${config.deductions.pfPercentage}%)`] = pf;
      if (config.deductions.incomeTax) deductionsMap[`Income Tax (${config.deductions.taxPercentage}%)`] = tax;
      if (config.deductions.leaveDeduction) deductionsMap['Leave Deduction'] = unpaidLeaveDeduction;
      if (config.deductions.profTax) deductionsMap['Prof. Tax Deduction'] = profTax;

      const totalDeductions = Object.values(deductionsMap).reduce((acc, val) => acc + val, 0);
      const netPay = Math.max(0, grossSalary - totalDeductions);

      return {
        id: `pay-${month.toLowerCase()}-${year}-${u.id}`,
        userId: u.id,
        userName: u.name,
        userRole: u.title,
        month: monthYear,
        year: year,
        generationDate,
        basicSalary: basic,
        hra,
        specialAllowance: special,
        daAllowance: da,
        taAllowance: ta,
        foodAllowance: food,
        grossSalary,
        pfDeduction: pf,
        taxDeduction: tax,
        unpaidLeaveDeduction,
        profTaxDeduction: profTax,
        netPay,
        breakdown: {
          earnings: earningsMap,
          deductions: deductionsMap,
        },
        status: 'PAID' as const
      };
    });
  }, [systemSettings.payslipConfig, users, leaveApplications, currentPayslipConfig]);

  const saveGeneratedPayslips = useCallback((generatedPayslips: Payslip[]) => {
    setPayslips(prev => {
      const generatedIds = new Set(generatedPayslips.map(p => p.id));
      const filtered = prev.filter(p => !generatedIds.has(p.id));
      return [...generatedPayslips, ...filtered];
    });
    persist('/api/payslips', 'POST', { payslips: generatedPayslips });
  }, []);

  const generateMonthlyPayslips = useCallback((monthYear: string) => {
    const parts = monthYear.split(' ');
    const month = parts[0] || 'August';
    const year = parts[1] || '2026';
    const generated = calculatePayslipsForCriteria(month, year, 'ALL');
    saveGeneratedPayslips(generated);
  }, [calculatePayslipsForCriteria, saveGeneratedPayslips]);

  return (
    <SystemContext.Provider
      value={{
        currentUser,
        isAuthenticated,
        isLoading,
        login,
        logout,
        switchPersona,
        users,
        myTeamMemberIds,
        teams,
        projectTypes,
        taskTypes,
        projects,
        tasks,
        attendance,
        leaveApplications,
        compOffRequests,
        leaveRules,
        events,
        payslips,
        chatChannels,
        chatMessages,
        customRoles,
        systemSettings,
        isCheckedIn,
        activeWorkSeconds,
        toggleCheckIn,
        toggleTaskTimer,
        addTask,
        assignTaskToTeam,
        assignTaskToAllMembers,
        editTask,
        deleteTask,
        restoreTask,
        hardDeleteTask,
        sendTaskReminder,
        updateTaskStatus,
        applyLeave,
        editLeave,
        reviewLeave,
        softDeleteLeave,
        hardDeleteLeave,
        addPaidLeaveCredit,
        submitCompOff,
        reviewCompOff,
        addLeaveRule,
        updateSystemSettings,
        addProjectType,
        editProjectType,
        deleteProjectType,
        addTaskType,
        editTaskType,
        deleteTaskType,
        addTeam,
        updateTeam,
        addProject,
        editProject,
        deleteProject,
        addCustomRole,
        editCustomRole,
        deleteCustomRole,
        addUser,
        updateUser,
        deleteUser,
        addDocument,
        editDocument,
        deleteDocument,
        verifyDocument,
        addSalaryIncrement,
        addTeamMembers,
        removeTeamMember,
        changeTeamLeader,
        notifications,
        addNotification,
        markNotificationAsRead,
        clearAllNotifications,
        sendMessage,
        payslipConfig: currentPayslipConfig,
        updatePayslipConfig,
        calculatePayslipsForCriteria,
        saveGeneratedPayslips,
        generateMonthlyPayslips
      }}
    >
      {children}
    </SystemContext.Provider>
  );
};

export const useSystem = () => {
  const context = useContext(SystemContext);
  if (!context) {
    throw new Error('useSystem must be used within a SystemProvider');
  }
  return context;
};

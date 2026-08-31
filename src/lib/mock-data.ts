import {
  UserProfile,
  Team,
  ProjectTypeMaster,
  TaskTypeMaster,
  Project,
  Task,
  AttendanceRecord,
  LeaveApplication,
  CompOffRequest,
  PaidLeaveCredit,
  LeaveRule,
  CompanyEvent,
  Payslip,
  ChatMessage,
  ChatChannel,
  CustomRole
} from './types';

export const INITIAL_USERS: UserProfile[] = [
  {
    id: 'user-1',
    name: 'Nilesh Soni',
    email: 'nileshsoni@gmail.com',
    role: 'SUPER_ADMIN',
    title: 'Super Master Admin & CTO',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    joiningDate: '2021-01-15',
    birthDate: '1988-08-25',
    phone: '+1 (555) 019-2834',
    address: '742 Evergreen Terrace, San Francisco, CA',
    status: 'ONLINE',
    isLoggedIn: true,
    checkInTime: '08:45 AM',
    documents: [
      {
        id: 'doc-101',
        name: 'Executive_ID_Proof.pdf',
        type: 'Government ID',
        url: '#',
        uploadDate: '2021-01-16',
        status: 'VERIFIED',
        verifiedBy: 'HR Portal',
        notes: 'Verified passport document'
      },
      {
        id: 'doc-102',
        name: 'Employment_Contract_CTO.pdf',
        type: 'Contract',
        url: '#',
        uploadDate: '2021-01-16',
        status: 'VERIFIED',
        verifiedBy: 'Board Committee'
      }
    ],
    salary: {
      basic: 12000,
      hra: 4500,
      specialAllowance: 3500,
      effectiveDate: '2026-01-01',
      increments: [
        {
          id: 'inc-1',
          date: '2026-01-01',
          oldSalary: 18000,
          newSalary: 20000,
          percentage: 11.1,
          approvedBy: 'Board of Directors',
          notes: 'Annual CTO performance bonus & scale review'
        }
      ]
    },
    leaveBalance: {
      paid: 24,
      sick: 10,
      casual: 8,
      compOff: 3,
      used: 4
    }
  },
  {
    id: 'user-2',
    name: 'Eleanor Vance',
    email: 'eleanor.hr@enterprise.com',
    role: 'ADMIN_HR',
    title: 'Head of Human Resources & Admin',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    joiningDate: '2022-03-01',
    birthDate: '1992-08-18', // Birthday coming up soon!
    phone: '+1 (555) 234-5678',
    address: '120 Wall Street, New York, NY',
    status: 'ONLINE',
    isLoggedIn: true,
    checkInTime: '09:00 AM',
    documents: [
      {
        id: 'doc-201',
        name: 'HR_Certification_SHRM.pdf',
        type: 'Certificate',
        url: '#',
        uploadDate: '2022-03-02',
        status: 'VERIFIED',
        verifiedBy: 'Nilesh Soni'
      }
    ],
    salary: {
      basic: 7000,
      hra: 2500,
      specialAllowance: 1500,
      effectiveDate: '2026-01-01',
      increments: []
    },
    leaveBalance: {
      paid: 20,
      sick: 10,
      casual: 7,
      compOff: 2,
      used: 3
    }
  },
  {
    id: 'user-3',
    name: 'Marcus Brody',
    email: 'marcus.brody@enterprise.com',
    role: 'TEAM_LEADER',
    title: 'Senior Engineering Team Lead',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    joiningDate: '2022-08-10',
    birthDate: '1990-11-04',
    phone: '+1 (555) 345-6789',
    address: '45 Austin Ave, Austin, TX',
    teamId: 'team-1',
    status: 'ONLINE',
    isLoggedIn: true,
    checkInTime: '09:15 AM',
    documents: [
      {
        id: 'doc-301',
        name: 'Master_Degree_CS.pdf',
        type: 'Degree',
        url: '#',
        uploadDate: '2022-08-11',
        status: 'VERIFIED',
        verifiedBy: 'Eleanor Vance'
      }
    ],
    salary: {
      basic: 6500,
      hra: 2200,
      specialAllowance: 1300,
      effectiveDate: '2026-01-01',
      increments: []
    },
    leaveBalance: {
      paid: 18,
      sick: 10,
      casual: 6,
      compOff: 4,
      used: 5
    }
  },
  {
    id: 'user-4',
    name: 'Sophia Chen',
    email: 'sophia.chen@enterprise.com',
    role: 'EMPLOYEE',
    title: 'Full Stack Frontend Developer',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    joiningDate: '2023-05-15',
    birthDate: '1995-08-20', // Birthday coming up in 4 days!
    phone: '+1 (555) 456-7890',
    address: '88 Market St, San Francisco, CA',
    teamId: 'team-1',
    status: 'ONLINE',
    isLoggedIn: true,
    checkInTime: '09:28 AM',
    documents: [
      {
        id: 'doc-401',
        name: 'Sophia_Chen_Passport.pdf',
        type: 'Government ID',
        url: '#',
        uploadDate: '2023-05-16',
        status: 'VERIFIED',
        verifiedBy: 'Eleanor Vance'
      },
      {
        id: 'doc-402',
        name: 'Previous_Experience_Relieving.pdf',
        type: 'Experience Letter',
        url: '#',
        uploadDate: '2023-05-16',
        status: 'PENDING',
        notes: 'Awaiting HR verification check'
      }
    ],
    salary: {
      basic: 5000,
      hra: 1800,
      specialAllowance: 1200,
      effectiveDate: '2026-01-01',
      increments: [
        {
          id: 'inc-401',
          date: '2026-01-01',
          oldSalary: 7200,
          newSalary: 8000,
          percentage: 11.1,
          approvedBy: 'Nilesh Soni & Eleanor Vance',
          notes: 'Promoted to Senior Frontend Dev scale'
        }
      ]
    },
    leaveBalance: {
      paid: 16,
      sick: 9,
      casual: 5,
      compOff: 2,
      used: 6
    }
  },
  {
    id: 'user-5',
    name: 'David Miller',
    email: 'david.m@enterprise.com',
    role: 'EMPLOYEE',
    title: 'UI/UX Product Designer',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    joiningDate: '2023-09-01',
    birthDate: '1994-09-12',
    phone: '+1 (555) 567-8901',
    address: '15 Ocean Blvd, Seattle, WA',
    teamId: 'team-2',
    status: 'OFFLINE',
    isLoggedIn: false,
    documents: [
      {
        id: 'doc-501',
        name: 'Design_Portfolio_Cert.pdf',
        type: 'Certificate',
        url: '#',
        uploadDate: '2023-09-02',
        status: 'VERIFIED',
        verifiedBy: 'Eleanor Vance'
      }
    ],
    salary: {
      basic: 4800,
      hra: 1700,
      specialAllowance: 1000,
      effectiveDate: '2026-01-01',
      increments: []
    },
    leaveBalance: {
      paid: 15,
      sick: 10,
      casual: 6,
      compOff: 1,
      used: 4
    }
  }
];

export const INITIAL_TEAMS: Team[] = [
  {
    id: 'team-1',
    name: 'Alpha Product Core',
    code: 'CORE-ENG',
    leaderId: 'user-3', // Marcus Brody
    memberIds: ['user-3', 'user-4'],
    description: 'Responsible for core SaaS architecture, App Router performance, and task execution engine.'
  },
  {
    id: 'team-2',
    name: 'UX & Design Systems',
    code: 'UX-DESIGN',
    leaderId: 'user-1', // Nilesh Soni
    memberIds: ['user-1', 'user-5'],
    description: 'Focusing on high-converting UI, responsive themes, micro-interactions and design tokens.'
  }
];

export const INITIAL_PROJECT_TYPES: ProjectTypeMaster[] = [
  { id: 'pt-1', name: 'Internal Core Product', code: 'PROD', description: 'Primary enterprise web software applications', color: '#F97316' },
  { id: 'pt-2', name: 'Client Project', code: 'CLIENT', description: 'Bespoke custom solutions for external clients', color: '#3B82F6' },
  { id: 'pt-3', name: 'R&D Innovation Lab', code: 'R&D', description: 'Experimental AI tools, research, and proof-of-concepts', color: '#8B5CF6' },
  { id: 'pt-4', name: 'Infrastructure & Ops', code: 'INFRA', description: 'DevOps, CI/CD pipelines, cloud security & maintenance', color: '#10B981' }
];

export const INITIAL_TASK_TYPES: TaskTypeMaster[] = [
  { id: 'tt-1', name: 'Feature Requirement', code: 'FEAT', description: 'New capability or functional module development', color: '#10B981' },
  { id: 'tt-2', name: 'Bug & Defect Fix', code: 'BUG', description: 'Resolving production or qa issue', color: '#EF4444' },
  { id: 'tt-3', name: 'UI / UX Design', code: 'DESIGN', description: 'Wireframing, prototyping, design token update', color: '#F59E0B' },
  { id: 'tt-4', name: 'Code Review & Refactor', code: 'REVIEW', description: 'Peer code review, unit test coverage & cleanup', color: '#6366F1' },
  { id: 'tt-5', name: 'Architecture & Research', code: 'ARCH', description: 'Technical design doc, database schema planning', color: '#8B5CF6' }
];

export const INITIAL_PROJECTS: Project[] = [
  {
    id: 'proj-1',
    name: 'Task System Next.js Platform',
    description: 'Next.js App Router based Task Management and Attendance Tracking system.',
    typeId: 'pt-1',
    clientName: 'Core Product',
    assignmentType: 'TEAM',
    teamId: 'team-1',
    assignedUserIds: [],
    estimatedHours: 160,
    startDate: '2026-07-01',
    endDate: '2026-09-30',
    deadline: '2026-09-30',
    completionDate: '',
    budget: 85000,
    status: 'IN_PROGRESS',
    progress: 75,
    documents: [
      {
        id: 'pdoc-1',
        name: 'Product_Architecture_Doc.pdf',
        size: '2.4 MB',
        type: 'application/pdf',
        uploadDate: '2026-07-05'
      }
    ]
  },
  {
    id: 'proj-2',
    name: 'Royal Orange Design Tokens & UI',
    description: 'Design system and accessible component library with high contrast theme.',
    typeId: 'pt-1',
    clientName: 'Design Guild',
    assignmentType: 'TEAM',
    teamId: 'team-2',
    assignedUserIds: [],
    estimatedHours: 80,
    startDate: '2026-08-01',
    endDate: '2026-08-31',
    deadline: '2026-08-31',
    completionDate: '',
    budget: 35000,
    status: 'IN_PROGRESS',
    progress: 90,
    documents: []
  },
  {
    id: 'proj-3',
    name: 'Cloud Payroll & Payslip Engine',
    description: 'Automated salary increment calculation and monthly payslip generation service.',
    typeId: 'pt-3',
    clientName: 'Finance Division',
    assignmentType: 'INDIVIDUAL',
    teamId: '',
    assignedUserIds: ['user-3', 'user-4'],
    estimatedHours: 120,
    startDate: '2026-09-01',
    endDate: '2026-10-15',
    deadline: '2026-10-15',
    completionDate: '',
    budget: 45000,
    status: 'PENDING',
    progress: 30,
    documents: []
  }
];

export const INITIAL_TASKS: Task[] = [
  {
    id: 'task-101',
    title: 'Implement Live Task Timer & Worklog Recorder',
    description: 'Add start/stop timer widget to task card with automatic duration logging into the user task log history.',
    projectId: 'proj-1',
    typeId: 'tt-1',
    priority: 'URGENT',
    status: 'IN_PROGRESS',
    assigneeId: 'user-4', // Sophia Chen
    creatorId: 'user-3', // Marcus Brody
    estimatedHours: 12,
    loggedHours: 7.5,
    dueDate: '2026-08-18',
    createdAt: '2026-08-14',
    isTimerRunning: true,
    activeTimerStart: new Date(Date.now() - 45 * 60 * 1000).toISOString(), // 45 mins ago
    worklogs: [
      {
        id: 'wl-1',
        userId: 'user-4',
        userName: 'Sophia Chen',
        startTime: '2026-08-15 09:30 AM',
        endTime: '2026-08-15 01:00 PM',
        durationSeconds: 12600,
        notes: 'Built state handler and start/stop hook'
      },
      {
        id: 'wl-2',
        userId: 'user-4',
        userName: 'Sophia Chen',
        startTime: '2026-08-16 10:00 AM',
        endTime: '2026-08-16 02:00 PM',
        durationSeconds: 14400,
        notes: 'Integrated task cards with live timer overlay'
      }
    ]
  },
  {
    id: 'task-102',
    title: 'Create Senior Approval Workflow for Leave Applications',
    description: 'Team leaders must receive pending leave applications from team members and have Approve/Reject buttons with rationale.',
    projectId: 'proj-1',
    typeId: 'tt-1',
    priority: 'HIGH',
    status: 'TODO',
    assigneeId: 'user-3', // Marcus Brody
    creatorId: 'user-2', // Eleanor Vance
    estimatedHours: 8,
    loggedHours: 2.0,
    dueDate: '2026-08-20',
    createdAt: '2026-08-15',
    worklogs: [
      {
        id: 'wl-3',
        userId: 'user-3',
        userName: 'Marcus Brody',
        startTime: '2026-08-15 02:00 PM',
        endTime: '2026-08-15 04:00 PM',
        durationSeconds: 7200,
        notes: 'Designed approval state machine interface'
      }
    ]
  },
  {
    id: 'task-103',
    title: 'Royal Orange Futuristic Dark/Light Theme System',
    description: 'Ensure all components comply with #F97316 primary, obsidian dark elements, high contrast text, and clean white card styling.',
    projectId: 'proj-2',
    typeId: 'tt-3',
    priority: 'HIGH',
    status: 'COMPLETED',
    assigneeId: 'user-5', // David Miller
    creatorId: 'user-1', // Nilesh Soni
    estimatedHours: 16,
    loggedHours: 16.0,
    dueDate: '2026-08-15',
    createdAt: '2026-08-10',
    worklogs: [
      {
        id: 'wl-4',
        userId: 'user-5',
        userName: 'David Miller',
        startTime: '2026-08-12 09:00 AM',
        endTime: '2026-08-12 05:00 PM',
        durationSeconds: 28800,
        notes: 'Constructed Tailwind theme tokens and glass shadows'
      },
      {
        id: 'wl-5',
        userId: 'user-5',
        userName: 'David Miller',
        startTime: '2026-08-13 09:00 AM',
        endTime: '2026-08-13 05:00 PM',
        durationSeconds: 28800,
        notes: 'Polished responsive layout breakpoints and typography font sizes'
      }
    ]
  }
];

export const INITIAL_ATTENDANCE: AttendanceRecord[] = [
  {
    id: 'att-1',
    userId: 'user-4',
    date: '2026-08-16',
    checkIn: '09:28 AM',
    workHours: 7.2,
    isLate: false,
    status: 'PRESENT',
    notes: 'On-time standard checkin'
  },
  {
    id: 'att-2',
    userId: 'user-3',
    date: '2026-08-16',
    checkIn: '09:15 AM',
    workHours: 7.5,
    isLate: false,
    status: 'PRESENT'
  },
  {
    id: 'att-3',
    userId: 'user-2',
    date: '2026-08-16',
    checkIn: '09:00 AM',
    workHours: 7.8,
    isLate: false,
    status: 'PRESENT'
  },
  {
    id: 'att-4',
    userId: 'user-1',
    date: '2026-08-16',
    checkIn: '08:45 AM',
    workHours: 8.0,
    isLate: false,
    status: 'PRESENT'
  },
  {
    id: 'att-5',
    userId: 'user-4',
    date: '2026-08-15',
    checkIn: '09:48 AM', // Late!
    checkOut: '06:30 PM',
    workHours: 8.7,
    isLate: true,
    status: 'PRESENT',
    notes: 'Late arrival due to severe transit traffic'
  },
  {
    id: 'att-6',
    userId: 'user-5',
    date: '2026-08-15',
    checkIn: '09:55 AM', // Late!
    checkOut: '06:00 PM',
    workHours: 8.0,
    isLate: true,
    status: 'PRESENT',
    notes: 'Late arrival flagged automatically by gate log'
  }
];

export const INITIAL_LEAVE_APPLICATIONS: LeaveApplication[] = [
  {
    id: 'lv-101',
    userId: 'user-4',
    userName: 'Sophia Chen',
    userRole: 'EMPLOYEE',
    leaveType: 'PAID',
    startDate: '2026-08-25',
    endDate: '2026-08-27',
    days: 3,
    reason: 'Family vacation and personal milestone event.',
    status: 'PENDING',
    appliedOn: '2026-08-15'
  },
  {
    id: 'lv-102',
    userId: 'user-5',
    userName: 'David Miller',
    userRole: 'EMPLOYEE',
    leaveType: 'SICK',
    startDate: '2026-08-10',
    endDate: '2026-08-11',
    days: 2,
    reason: 'Fever and viral flu recovery.',
    attachmentName: 'Doctor_Note_Medical_Cert.pdf',
    status: 'APPROVED',
    appliedOn: '2026-08-09',
    approverId: 'user-2',
    approverName: 'Eleanor Vance (HR)'
  }
];

export const INITIAL_COMP_OFF_REQUESTS: CompOffRequest[] = [
  {
    id: 'co-1',
    userId: 'user-4',
    userName: 'Sophia Chen',
    workDate: '2026-08-09', // Sunday extra work
    hoursWorked: 8,
    reason: 'Emergency production deployment for client release',
    projectWorkedOn: 'Task System Next.js Platform',
    status: 'PENDING',
    convertedDays: 1,
    requestedOn: '2026-08-10'
  }
];

export const INITIAL_PAID_LEAVE_CREDITS: PaidLeaveCredit[] = [
  {
    id: 'plc-1',
    userId: 'user-emp-1',
    userName: 'David Miller',
    days: 3,
    reason: 'Annual Performance Incentive Paid Leave Credit',
    validFrom: '2026-08-01',
    validTo: '2026-12-31',
    creditedBy: 'Alex Rivera (Super Admin)',
    creditedAt: '2026-08-01T10:00:00Z'
  },
  {
    id: 'plc-2',
    userId: 'user-emp-2',
    userName: 'Emma Watson',
    days: 2,
    reason: 'Q2 Milestone Achievement Bonus Paid Leave',
    validFrom: '2026-07-15',
    validTo: '2026-12-31',
    creditedBy: 'Alex Rivera (Super Admin)',
    creditedAt: '2026-07-15T09:30:00Z'
  }
];

export const INITIAL_LEAVE_RULES: LeaveRule[] = [
  {
    id: 'rule-1',
    leaveType: 'PAID',
    title: 'Annual Privilege Leave Policy',
    maxDaysPerYear: 18,
    noticePeriodDays: 5,
    maxConsecutiveDays: 3,
    allowCarryForward: false,
    description: 'Requires advance application minimum 3 days prior. This will combine SICK & CASUAL Leaves. Senior Team Leader or HR approval mandated.'
  },
  {
    id: 'rule-3',
    leaveType: 'COMP_OFF',
    title: 'Compensatory Leave Conversion Rule',
    maxDaysPerYear: 12,
    noticePeriodDays: 5,
    maxConsecutiveDays: 3,
    allowCarryForward: false,
    description: '8 hours of verified weekend/holiday work converts into 1 Paid Comp-Off day after HR confirmation.'
  }
];

export const INITIAL_EVENTS: CompanyEvent[] = [
  {
    id: 'ev-1',
    title: 'Q3 Enterprise Product Roadmap Summit',
    date: '2026-08-22',
    type: 'EVENT',
    description: 'All-hands engineering, product, and design team alignment meeting in Main Auditorium.',
    isHoliday: false
  },
  {
    id: 'ev-2',
    title: 'Labor Day Public Holiday',
    date: '2026-09-07',
    type: 'HOLIDAY',
    description: 'Official corporate company holiday. Offices closed.',
    isHoliday: true
  },
  {
    id: 'ev-3',
    title: 'Sophia Chen Birthday Celebration 🎉',
    date: '2026-08-20',
    type: 'CELEBRATION',
    description: 'Join us at 4 PM in the lounge for cake cutting & team birthday celebration!',
    isHoliday: false
  },
  {
    id: 'ev-4',
    title: 'Eleanor Vance Birthday 🎉',
    date: '2026-08-18',
    type: 'CELEBRATION',
    description: 'Happy Birthday to our Head of HR!',
    isHoliday: false
  }
];

export const INITIAL_PAYSLIPS: Payslip[] = [
  {
    id: 'pay-2026-07-user-4',
    userId: 'user-4',
    userName: 'Sophia Chen',
    userRole: 'Full Stack Frontend Developer',
    month: 'July 2026',
    generationDate: '2026-08-01',
    basicSalary: 5000,
    hra: 1800,
    specialAllowance: 1200,
    grossSalary: 8000,
    pfDeduction: 600,
    taxDeduction: 800,
    unpaidLeaveDeduction: 0,
    netPay: 6600,
    status: 'PAID'
  },
  {
    id: 'pay-2026-07-user-3',
    userId: 'user-3',
    userName: 'Marcus Brody',
    userRole: 'Senior Engineering Team Lead',
    month: 'July 2026',
    generationDate: '2026-08-01',
    basicSalary: 6500,
    hra: 2200,
    specialAllowance: 1300,
    grossSalary: 10000,
    pfDeduction: 750,
    taxDeduction: 1050,
    unpaidLeaveDeduction: 0,
    netPay: 8200,
    status: 'PAID'
  }
];

export const INITIAL_CHAT_CHANNELS: ChatChannel[] = [
  {
    id: 'chan-general',
    name: 'general-announcements',
    description: 'Company-wide updates, official announcements and milestone news',
    isPrivate: false,
    memberIds: ['user-1', 'user-2', 'user-3', 'user-4', 'user-5']
  },
  {
    id: 'chan-alpha-team',
    name: 'alpha-product-core',
    description: 'Team channel for Core Engineering & Next.js Tasks',
    isPrivate: true,
    memberIds: ['user-3', 'user-4', 'user-1']
  }
];

export const INITIAL_CHAT_MESSAGES: ChatMessage[] = [
  {
    id: 'msg-1',
    senderId: 'user-1',
    senderName: 'Nilesh Soni',
    senderAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    channelId: 'chan-general',
    text: 'Welcome everyone! The new Task System with Royal Orange theme and live timer logging is officially deployed.',
    timestamp: '10:00 AM'
  },
  {
    id: 'msg-2',
    senderId: 'user-4',
    senderName: 'Sophia Chen',
    senderAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    channelId: 'chan-general',
    text: 'Awesome! I am testing the live timer and worklog recording now. Everything feels super smooth.',
    timestamp: '10:05 AM'
  },
  {
    id: 'msg-3',
    senderId: 'user-3',
    senderName: 'Marcus Brody',
    senderAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    recipientId: 'user-4',
    text: 'Hi Sophia, let me know when task-101 timer test is complete so I can review your leave approval workflow next.',
    timestamp: '10:15 AM'
  }
];

export const INITIAL_CUSTOM_ROLES: CustomRole[] = [
  {
    id: 'role-super-admin',
    name: 'Super Master Admin',
    description: 'Unrestricted access to all modules, role creator, system audit and payroll configuration',
    createdDate: '2026-01-01',
    permissions: [
      {
        module: 'tasks',
        moduleLabel: 'Tasks & Timer Engine',
        subFunctions: [
          { key: 'tasks.board', label: 'Kanban & List Board', canView: true, canCreate: true, canEdit: true, canDelete: true },
          { key: 'tasks.timer', label: 'Live Worklog Timer', canView: true, canCreate: true, canEdit: true, canDelete: true },
          { key: 'tasks.worklog', label: 'Worklog Session History', canView: true, canCreate: true, canEdit: true, canDelete: true }
        ]
      },
      {
        module: 'leaves',
        moduleLabel: 'Leaves & Comp-Off System',
        subFunctions: [
          { key: 'leaves.applications', label: 'Leave Applications', canView: true, canCreate: true, canEdit: true, canDelete: true },
          { key: 'leaves.approvals', label: 'Hierarchy Approvals Queue', canView: true, canCreate: true, canEdit: true, canDelete: true },
          { key: 'leaves.comp_off', label: 'Comp-Off Overtime Claims', canView: true, canCreate: true, canEdit: true, canDelete: true },
          { key: 'leaves.rules', label: 'Policy Rules Configuration', canView: true, canCreate: true, canEdit: true, canDelete: true }
        ]
      },
      {
        module: 'attendance',
        moduleLabel: 'Attendance & Hours Register',
        subFunctions: [
          { key: 'attendance.register', label: 'Daily Punch Register', canView: true, canCreate: true, canEdit: true, canDelete: true },
          { key: 'attendance.late', label: 'Late Arrival Audit Flags', canView: true, canCreate: true, canEdit: true, canDelete: true }
        ]
      },
      {
        module: 'teams',
        moduleLabel: 'Teams & Directory',
        subFunctions: [
          { key: 'teams.directory', label: 'Staff Directory', canView: true, canCreate: true, canEdit: true, canDelete: true },
          { key: 'teams.docs', label: 'Document Verification', canView: true, canCreate: true, canEdit: true, canDelete: true },
          { key: 'teams.salary', label: 'Salary & Increment History', canView: true, canCreate: true, canEdit: true, canDelete: true }
        ]
      },
      {
        module: 'projects',
        moduleLabel: 'Projects & Masters',
        subFunctions: [
          { key: 'projects.list', label: 'Projects List', canView: true, canCreate: true, canEdit: true, canDelete: true },
          { key: 'projects.masters', label: 'Project & Task Types Master', canView: true, canCreate: true, canEdit: true, canDelete: true }
        ]
      },
      {
        module: 'payroll',
        moduleLabel: 'Payslips & Payroll Engine',
        subFunctions: [
          { key: 'payroll.viewer', label: 'Payslip Viewer', canView: true, canCreate: true, canEdit: true, canDelete: true },
          { key: 'payroll.batch', label: 'Fixed-Date Batch Generator', canView: true, canCreate: true, canEdit: true, canDelete: true }
        ]
      },
      {
        module: 'reports',
        moduleLabel: 'Analytics & Reports',
        subFunctions: [
          { key: 'reports.view', label: 'User & Cross-User Reports', canView: true, canCreate: true, canEdit: true, canDelete: true }
        ]
      },
      {
        module: 'admin',
        moduleLabel: 'Web Admin Controls',
        subFunctions: [
          { key: 'admin.settings', label: 'System Configurations', canView: true, canCreate: true, canEdit: true, canDelete: true },
          { key: 'admin.roles', label: 'Role & Permission Manager', canView: true, canCreate: true, canEdit: true, canDelete: true }
        ]
      }
    ]
  },
  {
    id: 'role-hr-admin',
    name: 'Admin / HR Manager',
    description: 'Full employee data management, document verification, leave policy control, paid leave allocation & monthly payslip batch generation',
    createdDate: '2026-01-05',
    permissions: [
      {
        module: 'tasks',
        moduleLabel: 'Tasks & Timer Engine',
        subFunctions: [
          { key: 'tasks.board', label: 'Kanban & List Board', canView: true, canCreate: true, canEdit: true, canDelete: false },
          { key: 'tasks.timer', label: 'Live Worklog Timer', canView: true, canCreate: true, canEdit: true, canDelete: false },
          { key: 'tasks.worklog', label: 'Worklog Session History', canView: true, canCreate: false, canEdit: false, canDelete: false }
        ]
      },
      {
        module: 'leaves',
        moduleLabel: 'Leaves & Comp-Off System',
        subFunctions: [
          { key: 'leaves.applications', label: 'Leave Applications', canView: true, canCreate: true, canEdit: true, canDelete: false },
          { key: 'leaves.approvals', label: 'Hierarchy Approvals Queue', canView: true, canCreate: true, canEdit: true, canDelete: true },
          { key: 'leaves.comp_off', label: 'Comp-Off Overtime Claims', canView: true, canCreate: true, canEdit: true, canDelete: false },
          { key: 'leaves.rules', label: 'Policy Rules Configuration', canView: true, canCreate: true, canEdit: true, canDelete: true }
        ]
      }
    ]
  }
];

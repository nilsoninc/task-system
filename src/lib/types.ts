export type UserRole = 'SUPER_ADMIN' | 'ADMIN_HR' | 'TEAM_LEADER' | 'EMPLOYEE';

export type UserStatus = 'ONLINE' | 'OFFLINE' | 'IN_MEETING' | 'ON_LEAVE';

export type DocumentStatus = 'PENDING' | 'VERIFIED' | 'REJECTED';

export interface EmergencyContact {
  id: string;
  name: string;
  relationship: string;
  phone: string;
}

export interface UserDocument {
  id: string;
  name: string;
  type: string;
  url: string;
  uploadDate: string;
  status: DocumentStatus;
  verifiedBy?: string;
  notes?: string;
}

export interface SalaryIncrement {
  id: string;
  date: string;
  oldSalary: number;
  newSalary: number;
  percentage: number;
  approvedBy: string;
  notes: string;
}

export interface UserSalary {
  basic: number;
  hra: number;
  specialAllowance: number;
  effectiveDate: string;
  increments: SalaryIncrement[];
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  customRoleId?: string;
  title: string;
  avatar: string;
  joiningDate: string;
  birthDate: string;
  phone: string;
  address: string;
  teamId?: string;
  status: UserStatus;
  isLoggedIn: boolean;
  checkInTime?: string;
  checkOutTime?: string;
  lastActivityTimestamp?: number;
  documents: UserDocument[];
  salary: UserSalary;
  leaveBalance: {
    paid: number;
    sick: number;
    casual: number;
    compOff: number;
    used: number;
  };
  emergencyContacts?: EmergencyContact[];
}

export interface Team {
  id: string;
  name: string;
  code: string;
  leaderId: string;
  memberIds: string[];
  description: string;
}

export interface ProjectTypeMaster {
  id: string;
  name: string;
  code: string;
  description: string;
  color: string;
}

export interface TaskTypeMaster {
  id: string;
  name: string;
  code: string;
  description: string;
  color: string;
}

export type ProjectStatus = 'NOT_STARTED' | 'PENDING' | 'IN_PROGRESS' | 'ON_HOLD' | 'DELAYED' | 'COMPLETED';

export interface ProjectDocument {
  id: string;
  name: string;
  size: string;
  type: string;
  dataUrl?: string;
  uploadDate: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  typeId: string;
  estimatedHours: number;
  assignmentType: 'TEAM' | 'INDIVIDUAL';
  teamId?: string;
  assignedUserIds?: string[];
  documents?: ProjectDocument[];
  startDate?: string;
  endDate?: string;
  completionDate?: string;
  clientName?: string;
  deadline?: string;
  budget?: number;
  status: ProjectStatus;
  progress?: number;
}

export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'COMPLETED';

export interface TaskWorklog {
  id: string;
  userId: string;
  userName: string;
  startTime: string;
  endTime?: string;
  durationSeconds: number;
  notes?: string;
}

export interface TaskAttachment {
  id: string;
  name: string;
  size: string;
  type: string;
  url?: string;
  uploadDate: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  projectId: string;
  typeId: string;
  priority: TaskPriority;
  status: TaskStatus;
  assigneeId: string;
  creatorId: string;
  estimatedHours: number;
  loggedHours: number;
  startDate?: string;
  dueDate: string;
  createdAt: string;
  isTimerRunning?: boolean;
  activeTimerStart?: string;
  worklogs: TaskWorklog[];
  attachments?: TaskAttachment[];
  isSoftDeleted?: boolean;
  softDeletedBy?: string;
  softDeletedRole?: string;
}

export interface AttendanceRecord {
  id: string;
  userId: string;
  date: string;
  checkIn: string;
  checkOut?: string;
  workHours: number;
  isLate: boolean;
  status: 'PRESENT' | 'ABSENT' | 'HALF_DAY' | 'ON_LEAVE';
  notes?: string;
}

export type LeaveType = 'PAID' | 'SICK' | 'CASUAL' | 'UNPAID' | 'COMP_OFF';
export type LeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface LeaveApplication {
  id: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  workInAbsence?: string;
  attachmentName?: string;
  status: LeaveStatus;
  appliedOn: string;
  approverId?: string;
  approverName?: string;
  rejectionReason?: string;
  isSoftDeleted?: boolean;
  softDeletedBy?: string;
}

export interface CompOffRequest {
  id: string;
  userId: string;
  userName: string;
  workDate: string;
  hoursWorked: number;
  reason: string;
  projectWorkedOn: string;
  status: 'PENDING' | 'APPROVED_BY_TL' | 'APPROVED' | 'REJECTED';
  verifiedBy?: string;
  convertedDays: number;
  requestedOn: string;
}

export interface LeaveRule {
  id: string;
  leaveType: LeaveType;
  title: string;
  maxDaysPerYear: number;
  noticePeriodDays: number;
  maxConsecutiveDays: number;
  allowCarryForward: boolean;
  description: string;
}

export interface AppNotification {
  id: string;
  userId: string; // Specific user ID or role ('SUPER_ADMIN' | 'TEAM_LEADER' | 'ALL')
  targetRole?: UserRole;
  teamId?: string;
  title: string;
  message: string;
  type: 'LEAVE_APPLIED' | 'LEAVE_STATUS' | 'COMP_OFF' | 'SYSTEM' | 'INFO';
  timestamp: string;
  isRead: boolean;
  linkUrl: string;
  referenceId?: string;
}

export interface CompanyEvent {
  id: string;
  title: string;
  date: string;
  type: 'EVENT' | 'HOLIDAY' | 'CELEBRATION';
  description: string;
  isHoliday: boolean;
}

export interface ProfTaxSlab {
  minSalary: number;
  taxAmount: number;
}

export interface PayslipConfig {
  earnings: {
    basicSalary: boolean;
    hra: boolean;
    specialAllowance: boolean;
    daAllowance: boolean;
    taAllowance: boolean;
    foodAllowance: boolean;
  };
  deductions: {
    providentFund: boolean;
    pfPercentage: number;
    incomeTax: boolean;
    taxPercentage: number;
    leaveDeduction: boolean;
    profTax: boolean;
    profTaxAmount: number;
    profTaxSlabs: ProfTaxSlab[];
  };
}

export const DEFAULT_PROF_TAX_SLABS: ProfTaxSlab[] = [
  { minSalary: 10000, taxAmount: 150 },
  { minSalary: 15000, taxAmount: 200 },
  { minSalary: 25000, taxAmount: 250 },
];

export const DEFAULT_PAYSLIP_CONFIG: PayslipConfig = {
  earnings: {
    basicSalary: true,
    hra: true,
    specialAllowance: true,
    daAllowance: false,
    taAllowance: false,
    foodAllowance: false,
  },
  deductions: {
    providentFund: true,
    pfPercentage: 12,
    incomeTax: true,
    taxPercentage: 10,
    leaveDeduction: true,
    profTax: false,
    profTaxAmount: 200,
    profTaxSlabs: DEFAULT_PROF_TAX_SLABS,
  }
};

export function normalizePayslipConfig(input?: Partial<PayslipConfig> | null): PayslipConfig {
  let slabs = input?.deductions?.profTaxSlabs;
  if (!Array.isArray(slabs) || slabs.length === 0) {
    slabs = DEFAULT_PROF_TAX_SLABS;
  }
  // Ensure exactly 3 slabs
  while (slabs.length < 3) {
    slabs.push({ minSalary: 0, taxAmount: 0 });
  }

  return {
    earnings: {
      basicSalary: true, // Basic Salary is always compulsory
      hra: input?.earnings?.hra ?? false,
      specialAllowance: input?.earnings?.specialAllowance ?? false,
      daAllowance: input?.earnings?.daAllowance ?? false,
      taAllowance: input?.earnings?.taAllowance ?? false,
      foodAllowance: input?.earnings?.foodAllowance ?? false,
    },
    deductions: {
      providentFund: input?.deductions?.providentFund ?? false,
      pfPercentage: input?.deductions?.pfPercentage ?? 12,
      incomeTax: input?.deductions?.incomeTax ?? false,
      taxPercentage: input?.deductions?.taxPercentage ?? 10,
      leaveDeduction: input?.deductions?.leaveDeduction ?? false,
      profTax: input?.deductions?.profTax ?? false,
      profTaxAmount: input?.deductions?.profTaxAmount ?? 200,
      profTaxSlabs: slabs.slice(0, 3),
    }
  };
}

export interface Payslip {
  id: string;
  userId: string;
  userName: string;
  userRole: string;
  month: string;
  year?: string;
  generationDate: string;
  basicSalary: number;
  hra: number;
  specialAllowance: number;
  daAllowance?: number;
  taAllowance?: number;
  foodAllowance?: number;
  grossSalary: number;
  pfDeduction: number;
  taxDeduction: number;
  unpaidLeaveDeduction: number;
  profTaxDeduction?: number;
  netPay: number;
  breakdown?: {
    earnings: Record<string, number>;
    deductions: Record<string, number>;
  };
  status: 'PAID' | 'GENERATED' | 'PROCESSING';
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  channelId?: string;
  recipientId?: string;
  text: string;
  timestamp: string;
  attachment?: {
    name: string;
    size: string;
    type: string;
  };
}

export interface ChatChannel {
  id: string;
  name: string;
  description: string;
  isPrivate: boolean;
  memberIds: string[];
}

export interface SubFunctionPermission {
  key: string;
  label: string;
  menuRoute?: string;
  canAccess?: boolean;
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

export interface CustomRolePermission {
  module: 'tasks' | 'leaves' | 'attendance' | 'teams' | 'projects' | 'payroll' | 'reports' | 'admin' | 'dashboard' | 'chat' | string;
  moduleLabel: string;
  key?: string;
  canAccess?: boolean;
  subFunctions: SubFunctionPermission[];
}

export interface CustomRole {
  id: string;
  name: string;
  description: string;
  permissions: CustomRolePermission[];
  createdDate: string;
}

export interface SystemSettings {
  morningPunchInThreshold: string;
  minDailyWorkingHours: string;
  lateArrivalFlagLimit: number;
  currencySymbol: string;
  currencyCode: string;
  totalPaidLeavePerYear: number;
  smtpConfig: {
    host: string;
    port: number;
    user: string;
    pass: string;
  };
  companyInfo: {
    name: string;
    logoUrl: string;
    email: string;
    phone: string;
  };
  themeConfig: {
    fontFamily: 'Inter' | 'Roboto' | 'Poppins' | 'Outfit' | 'system-ui';
    headingFontSize: 'sm' | 'md' | 'lg' | 'xl';
    bodyFontSize: 'xs' | 'sm' | 'base';
    primaryColor: string;
    accentColor: string;
    darkColor: string;
    headingColor: string;
    bodyColor: string;
    buttonPrimaryColor: string;
    buttonHoverColor: string;
    buttonTextColor: string;
  };
  dateFormat: string;
  timeFormat: string;
  maxConsecutiveLeaveGroup: number;
  sandwichRule: {
    enabled: boolean;
    conditionText: string;
  };
  payslipConfig?: PayslipConfig;
  probationPaidLeaveEligibilityMonths: 3 | 6 | 9 | 12;
  minNoticeDaysRequired: 3 | 5 | 10 | 15 | 25 | 30;
}

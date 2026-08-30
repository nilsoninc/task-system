import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import {
  INITIAL_USERS,
  INITIAL_TEAMS,
  INITIAL_PROJECT_TYPES,
  INITIAL_TASK_TYPES,
  INITIAL_PROJECTS,
  INITIAL_TASKS,
  INITIAL_ATTENDANCE,
  INITIAL_LEAVE_APPLICATIONS,
  INITIAL_COMP_OFF_REQUESTS,
  INITIAL_LEAVE_RULES,
  INITIAL_EVENTS,
  INITIAL_PAYSLIPS,
  INITIAL_CUSTOM_ROLES
} from '../src/lib/mock-data';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Database Seeding...');

  // 1. Seed System Settings
  await prisma.systemSettings.upsert({
    where: { id: 'global-settings' },
    update: {},
    create: {
      id: 'global-settings',
      morningPunchInThreshold: '09:30 AM',
      smtpJson: JSON.stringify({
        host: 'smtp.enterprise-mail.com',
        port: 587,
        user: 'notifications@enterprise-mail.com',
        pass: '••••••••••••'
      }),
      companyInfoJson: JSON.stringify({
        name: 'Penguin Peak Technologies Pvt Ltd.',
        logoUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&auto=format&fit=crop&q=80',
        email: 'contact@enterprise.com',
        phone: '+1 (800) 555-0199'
      }),
      themeConfigJson: JSON.stringify({
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
      }),
      dateFormat: 'YYYY-MM-DD',
      timeFormat: '12 Hours (AM/PM)',
      maxConsecutiveLeaveGroup: 10,
      sandwichRuleJson: JSON.stringify({
        enabled: true,
        conditionText: 'If a weekend/public holiday falls between approved leave start and end dates, those days will be counted as leave days.'
      }),
      probationPaidLeaveEligibilityMonths: 6,
      minNoticeDaysRequired: 3
    }
  });

  // 2. Seed Users with Bcrypt Hashed Passwords
  const salt = await bcrypt.genSalt(10);
  const defaultPasswordHash = await bcrypt.hash('admin123', salt);

  for (const user of INITIAL_USERS) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {},
      create: {
        id: user.id,
        name: user.name,
        email: user.email,
        passwordHash: defaultPasswordHash,
        role: user.role,
        customRoleId: user.customRoleId,
        title: user.title,
        avatar: user.avatar,
        joiningDate: user.joiningDate,
        birthDate: user.birthDate,
        phone: user.phone,
        address: user.address,
        teamId: user.teamId,
        status: user.status,
        isLoggedIn: user.isLoggedIn,
        checkInTime: user.checkInTime,
        checkOutTime: user.checkOutTime,
        documentsJson: JSON.stringify(user.documents || []),
        salaryJson: JSON.stringify(user.salary || {}),
        leaveBalanceJson: JSON.stringify(user.leaveBalance || {})
      }
    });
  }

  // 3. Seed Custom Roles
  for (const role of INITIAL_CUSTOM_ROLES) {
    await prisma.customRole.upsert({
      where: { id: role.id },
      update: {},
      create: {
        id: role.id,
        name: role.name,
        description: role.description,
        permissionsJson: JSON.stringify(role.permissions),
        createdDate: role.createdDate
      }
    });
  }

  // 4. Seed Teams
  for (const team of INITIAL_TEAMS) {
    await prisma.team.upsert({
      where: { code: team.code },
      update: {},
      create: {
        id: team.id,
        name: team.name,
        code: team.code,
        leaderId: team.leaderId,
        memberIds: JSON.stringify(team.memberIds),
        description: team.description
      }
    });
  }

  // 5. Seed Project Types & Task Types Masters
  for (const pt of INITIAL_PROJECT_TYPES) {
    await prisma.projectTypeMaster.upsert({
      where: { code: pt.code },
      update: {},
      create: { ...pt }
    });
  }

  for (const tt of INITIAL_TASK_TYPES) {
    await prisma.taskTypeMaster.upsert({
      where: { code: tt.code },
      update: {},
      create: { ...tt }
    });
  }

  // 6. Seed Projects
  for (const proj of INITIAL_PROJECTS) {
    await prisma.project.upsert({
      where: { id: proj.id },
      update: {},
      create: {
        id: proj.id,
        name: proj.name,
        description: proj.description || '',
        typeId: proj.typeId,
        estimatedHours: proj.estimatedHours || 0,
        assignmentType: proj.assignmentType || 'TEAM',
        teamId: proj.teamId || '',
        assignedUserIds: JSON.stringify(proj.assignedUserIds || []),
        documentsJson: JSON.stringify(proj.documents || []),
        startDate: proj.startDate || '',
        endDate: proj.endDate || proj.deadline || '',
        completionDate: proj.completionDate || '',
        clientName: proj.clientName || '',
        deadline: proj.deadline || proj.endDate || '',
        budget: proj.budget || 0,
        status: proj.status || 'NOT_STARTED',
        progress: proj.progress || 0,
      }
    });
  }

  // 7. Seed Tasks
  for (const task of INITIAL_TASKS) {
    await prisma.task.upsert({
      where: { id: task.id },
      update: {},
      create: {
        id: task.id,
        title: task.title,
        description: task.description,
        projectId: task.projectId,
        typeId: task.typeId,
        priority: task.priority,
        status: task.status,
        assigneeId: task.assigneeId,
        creatorId: task.creatorId,
        estimatedHours: task.estimatedHours,
        loggedHours: task.loggedHours,
        dueDate: task.dueDate,
        createdAt: task.createdAt,
        isTimerRunning: task.isTimerRunning || false,
        activeTimerStart: task.activeTimerStart,
        worklogsJson: JSON.stringify(task.worklogs || [])
      }
    });
  }

  // 8. Seed Attendance
  for (const att of INITIAL_ATTENDANCE) {
    await prisma.attendanceRecord.upsert({
      where: { id: att.id },
      update: {},
      create: { ...att }
    });
  }

  // 9. Seed Leave Applications & Rules
  for (const leave of INITIAL_LEAVE_APPLICATIONS) {
    await prisma.leaveApplication.upsert({
      where: { id: leave.id },
      update: {},
      create: { ...leave }
    });
  }

  for (const rule of INITIAL_LEAVE_RULES) {
    await prisma.leaveRule.upsert({
      where: { id: rule.id },
      update: {},
      create: { ...rule }
    });
  }

  // 10. Seed Events & Payslips
  for (const ev of INITIAL_EVENTS) {
    await prisma.companyEvent.upsert({
      where: { id: ev.id },
      update: {},
      create: { ...ev }
    });
  }

  for (const pay of INITIAL_PAYSLIPS) {
    await prisma.payslip.upsert({
      where: { id: pay.id },
      update: {},
      create: { ...pay }
    });
  }

  console.log('✅ Database Seeding Completed Successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Database Seeding Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

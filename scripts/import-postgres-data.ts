import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";

const prisma = new PrismaClient();

async function importAll() {
  const dumpPath = path.join(process.cwd(), "prisma", "sqlite-data-dump.json");
  if (!fs.existsSync(dumpPath)) {
    throw new Error(`Data dump file not found at: ${dumpPath}`);
  }

  const dump = JSON.parse(fs.readFileSync(dumpPath, "utf-8"));
  console.log("Starting import to PostgreSQL...");

  // 1. System Settings
  if (dump.systemSettings && dump.systemSettings.length > 0) {
    console.log(`Importing ${dump.systemSettings.length} SystemSettings...`);
    for (const setting of dump.systemSettings) {
      await prisma.systemSettings.upsert({
        where: { id: setting.id },
        update: setting,
        create: setting,
      });
    }
  }

  // 2. Custom Roles
  if (dump.customRoles && dump.customRoles.length > 0) {
    console.log(`Importing ${dump.customRoles.length} CustomRoles...`);
    for (const role of dump.customRoles) {
      await prisma.customRole.upsert({
        where: { id: role.id },
        update: role,
        create: role,
      });
    }
  }

  // 3. Teams
  if (dump.teams && dump.teams.length > 0) {
    console.log(`Importing ${dump.teams.length} Teams...`);
    for (const team of dump.teams) {
      await prisma.team.upsert({
        where: { id: team.id },
        update: team,
        create: team,
      });
    }
  }

  // 4. Project Type Master
  if (dump.projectTypeMasters && dump.projectTypeMasters.length > 0) {
    console.log(`Importing ${dump.projectTypeMasters.length} ProjectTypeMasters...`);
    for (const ptm of dump.projectTypeMasters) {
      await prisma.projectTypeMaster.upsert({
        where: { id: ptm.id },
        update: ptm,
        create: ptm,
      });
    }
  }

  // 5. Task Type Master
  if (dump.taskTypeMasters && dump.taskTypeMasters.length > 0) {
    console.log(`Importing ${dump.taskTypeMasters.length} TaskTypeMasters...`);
    for (const ttm of dump.taskTypeMasters) {
      await prisma.taskTypeMaster.upsert({
        where: { id: ttm.id },
        update: ttm,
        create: ttm,
      });
    }
  }

  // 6. Users
  if (dump.users && dump.users.length > 0) {
    console.log(`Importing ${dump.users.length} Users...`);
    for (const u of dump.users) {
      const userPayload = {
        ...u,
        lastActivityTimestamp: u.lastActivityTimestamp ? BigInt(u.lastActivityTimestamp) : null,
        createdAt: u.createdAt ? new Date(u.createdAt) : new Date(),
      };
      await prisma.user.upsert({
        where: { id: u.id },
        update: userPayload,
        create: userPayload,
      });
    }
  }

  // 7. Projects
  if (dump.projects && dump.projects.length > 0) {
    console.log(`Importing ${dump.projects.length} Projects...`);
    for (const project of dump.projects) {
      await prisma.project.upsert({
        where: { id: project.id },
        update: project,
        create: project,
      });
    }
  }

  // 8. Tasks
  if (dump.tasks && dump.tasks.length > 0) {
    console.log(`Importing ${dump.tasks.length} Tasks...`);
    for (const task of dump.tasks) {
      await prisma.task.upsert({
        where: { id: task.id },
        update: task,
        create: task,
      });
    }
  }

  // 9. Attendance Records
  if (dump.attendanceRecords && dump.attendanceRecords.length > 0) {
    console.log(`Importing ${dump.attendanceRecords.length} AttendanceRecords...`);
    for (const att of dump.attendanceRecords) {
      await prisma.attendanceRecord.upsert({
        where: { id: att.id },
        update: att,
        create: att,
      });
    }
  }

  // 10. Leave Applications
  if (dump.leaveApplications && dump.leaveApplications.length > 0) {
    console.log(`Importing ${dump.leaveApplications.length} LeaveApplications...`);
    for (const leave of dump.leaveApplications) {
      await prisma.leaveApplication.upsert({
        where: { id: leave.id },
        update: leave,
        create: leave,
      });
    }
  }

  // 11. CompOff Requests
  if (dump.compOffRequests && dump.compOffRequests.length > 0) {
    console.log(`Importing ${dump.compOffRequests.length} CompOffRequests...`);
    for (const comp of dump.compOffRequests) {
      await prisma.compOffRequest.upsert({
        where: { id: comp.id },
        update: comp,
        create: comp,
      });
    }
  }

  // 12. Leave Rules
  if (dump.leaveRules && dump.leaveRules.length > 0) {
    console.log(`Importing ${dump.leaveRules.length} LeaveRules...`);
    for (const rule of dump.leaveRules) {
      await prisma.leaveRule.upsert({
        where: { id: rule.id },
        update: rule,
        create: rule,
      });
    }
  }

  // 13. Company Events
  if (dump.companyEvents && dump.companyEvents.length > 0) {
    console.log(`Importing ${dump.companyEvents.length} CompanyEvents...`);
    for (const ev of dump.companyEvents) {
      await prisma.companyEvent.upsert({
        where: { id: ev.id },
        update: ev,
        create: ev,
      });
    }
  }

  // 14. Payslips
  if (dump.payslips && dump.payslips.length > 0) {
    console.log(`Importing ${dump.payslips.length} Payslips...`);
    for (const ps of dump.payslips) {
      await prisma.payslip.upsert({
        where: { id: ps.id },
        update: ps,
        create: ps,
      });
    }
  }

  console.log("\n==========================================");
  console.log("Migration to PostgreSQL completed successfully!");
  console.log("==========================================");
}

importAll()
  .catch((err) => {
    console.error("Import error:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

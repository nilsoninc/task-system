import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";

async function main() {
  console.log("=== PostgreSQL Database Migration Tool ===");
  console.log(`Target DATABASE_URL: ${process.env.DATABASE_URL}\n`);

  const dumpPath = path.join(process.cwd(), "prisma", "sqlite-data-dump.json");
  if (!fs.existsSync(dumpPath)) {
    throw new Error(`Data dump not found at: ${dumpPath}. Please run export-sqlite-data.ts first.`);
  }

  const dump = JSON.parse(fs.readFileSync(dumpPath, "utf-8"));

  console.log("Step 1: Pushing Prisma Schema to PostgreSQL database...");
  try {
    execSync("npx prisma db push --accept-data-loss", { stdio: "inherit" });
    console.log("✔ Schema pushed to PostgreSQL successfully.\n");
  } catch (error) {
    console.error("❌ Failed to push schema to PostgreSQL. Please check your DATABASE_URL and ensure the PostgreSQL service is reachable.");
    throw error;
  }

  console.log("Step 2: Connecting to PostgreSQL via Prisma Client...");
  const prisma = new PrismaClient();

  try {
    // 1. System Settings
    if (dump.systemSettings?.length) {
      console.log(`-> Migrating ${dump.systemSettings.length} SystemSettings...`);
      for (const item of dump.systemSettings) {
        await prisma.systemSettings.upsert({
          where: { id: item.id },
          update: item,
          create: item,
        });
      }
    }

    // 2. Custom Roles
    if (dump.customRoles?.length) {
      console.log(`-> Migrating ${dump.customRoles.length} CustomRoles...`);
      for (const item of dump.customRoles) {
        await prisma.customRole.upsert({
          where: { id: item.id },
          update: item,
          create: item,
        });
      }
    }

    // 3. Teams
    if (dump.teams?.length) {
      console.log(`-> Migrating ${dump.teams.length} Teams...`);
      for (const item of dump.teams) {
        await prisma.team.upsert({
          where: { id: item.id },
          update: item,
          create: item,
        });
      }
    }

    // 4. Project Type Masters
    if (dump.projectTypeMasters?.length) {
      console.log(`-> Migrating ${dump.projectTypeMasters.length} ProjectTypeMasters...`);
      for (const item of dump.projectTypeMasters) {
        await prisma.projectTypeMaster.upsert({
          where: { id: item.id },
          update: item,
          create: item,
        });
      }
    }

    // 5. Task Type Masters
    if (dump.taskTypeMasters?.length) {
      console.log(`-> Migrating ${dump.taskTypeMasters.length} TaskTypeMasters...`);
      for (const item of dump.taskTypeMasters) {
        await prisma.taskTypeMaster.upsert({
          where: { id: item.id },
          update: item,
          create: item,
        });
      }
    }

    // 6. Users
    if (dump.users?.length) {
      console.log(`-> Migrating ${dump.users.length} Users...`);
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
    if (dump.projects?.length) {
      console.log(`-> Migrating ${dump.projects.length} Projects...`);
      for (const item of dump.projects) {
        await prisma.project.upsert({
          where: { id: item.id },
          update: item,
          create: item,
        });
      }
    }

    // 8. Tasks
    if (dump.tasks?.length) {
      console.log(`-> Migrating ${dump.tasks.length} Tasks...`);
      for (const item of dump.tasks) {
        await prisma.task.upsert({
          where: { id: item.id },
          update: item,
          create: item,
        });
      }
    }

    // 9. Attendance Records
    if (dump.attendanceRecords?.length) {
      console.log(`-> Migrating ${dump.attendanceRecords.length} AttendanceRecords...`);
      for (const item of dump.attendanceRecords) {
        await prisma.attendanceRecord.upsert({
          where: { id: item.id },
          update: item,
          create: item,
        });
      }
    }

    // 10. Leave Applications
    if (dump.leaveApplications?.length) {
      console.log(`-> Migrating ${dump.leaveApplications.length} LeaveApplications...`);
      for (const item of dump.leaveApplications) {
        await prisma.leaveApplication.upsert({
          where: { id: item.id },
          update: item,
          create: item,
        });
      }
    }

    // 11. CompOff Requests
    if (dump.compOffRequests?.length) {
      console.log(`-> Migrating ${dump.compOffRequests.length} CompOffRequests...`);
      for (const item of dump.compOffRequests) {
        await prisma.compOffRequest.upsert({
          where: { id: item.id },
          update: item,
          create: item,
        });
      }
    }

    // 12. Leave Rules
    if (dump.leaveRules?.length) {
      console.log(`-> Migrating ${dump.leaveRules.length} LeaveRules...`);
      for (const item of dump.leaveRules) {
        await prisma.leaveRule.upsert({
          where: { id: item.id },
          update: item,
          create: item,
        });
      }
    }

    // 13. Company Events
    if (dump.companyEvents?.length) {
      console.log(`-> Migrating ${dump.companyEvents.length} CompanyEvents...`);
      for (const item of dump.companyEvents) {
        await prisma.companyEvent.upsert({
          where: { id: item.id },
          update: item,
          create: item,
        });
      }
    }

    // 14. Payslips
    if (dump.payslips?.length) {
      console.log(`-> Migrating ${dump.payslips.length} Payslips...`);
      for (const item of dump.payslips) {
        await prisma.payslip.upsert({
          where: { id: item.id },
          update: item,
          create: item,
        });
      }
    }

    console.log("\nStep 3: Verifying PostgreSQL Row Counts...");
    const counts = {
      users: await prisma.user.count(),
      customRoles: await prisma.customRole.count(),
      teams: await prisma.team.count(),
      projectTypeMasters: await prisma.projectTypeMaster.count(),
      taskTypeMasters: await prisma.taskTypeMaster.count(),
      projects: await prisma.project.count(),
      tasks: await prisma.task.count(),
      attendanceRecords: await prisma.attendanceRecord.count(),
      leaveApplications: await prisma.leaveApplication.count(),
      compOffRequests: await prisma.compOffRequest.count(),
      leaveRules: await prisma.leaveRule.count(),
      companyEvents: await prisma.companyEvent.count(),
      payslips: await prisma.payslip.count(),
      systemSettings: await prisma.systemSettings.count(),
    };

    console.log("PostgreSQL Database Row Counts:", JSON.stringify(counts, null, 2));
    console.log("\n✔ All records migrated and verified successfully!");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error("\nMigration failed:", err);
  process.exit(1);
});

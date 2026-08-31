import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";

const prisma = new PrismaClient();

async function exportAll() {
  console.log("Exporting all SQLite records...");
  
  const users = await prisma.user.findMany();
  // Handle BigInt serialization
  const serializedUsers = users.map(u => ({
    ...u,
    lastActivityTimestamp: u.lastActivityTimestamp !== null && u.lastActivityTimestamp !== undefined 
      ? u.lastActivityTimestamp.toString() 
      : null
  }));

  const customRoles = await prisma.customRole.findMany();
  const teams = await prisma.team.findMany();
  const projectTypeMasters = await prisma.projectTypeMaster.findMany();
  const taskTypeMasters = await prisma.taskTypeMaster.findMany();
  const projects = await prisma.project.findMany();
  const tasks = await prisma.task.findMany();
  const attendanceRecords = await prisma.attendanceRecord.findMany();
  const leaveApplications = await prisma.leaveApplication.findMany();
  const compOffRequests = await prisma.compOffRequest.findMany();
  const leaveRules = await prisma.leaveRule.findMany();
  const companyEvents = await prisma.companyEvent.findMany();
  const payslips = await prisma.payslip.findMany();
  const systemSettings = await prisma.systemSettings.findMany();

  const dataDump = {
    users: serializedUsers,
    customRoles,
    teams,
    projectTypeMasters,
    taskTypeMasters,
    projects,
    tasks,
    attendanceRecords,
    leaveApplications,
    compOffRequests,
    leaveRules,
    companyEvents,
    payslips,
    systemSettings
  };

  const outputPath = path.join(process.cwd(), "prisma", "sqlite-data-dump.json");
  fs.writeFileSync(outputPath, JSON.stringify(dataDump, null, 2), "utf-8");

  console.log("Data successfully exported to:", outputPath);
  console.log("Summary of exported records:");
  Object.entries(dataDump).forEach(([model, records]) => {
    console.log(` - ${model}: ${(records as any[]).length} records`);
  });
}

exportAll()
  .catch((err) => {
    console.error("Export error:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

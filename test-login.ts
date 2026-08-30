import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany();
  console.log(`Found ${users.length} users:`);
  for (const u of users) {
    const match = await bcrypt.compare('admin123', u.passwordHash);
    console.log(`User: ${u.name} (${u.email}) | Role: ${u.role} | Password Match (admin123): ${match}`);
  }
}

main().finally(() => prisma.$disconnect());

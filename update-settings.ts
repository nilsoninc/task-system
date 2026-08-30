import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const settings = await prisma.systemSettings.findFirst();
  if (settings) {
    const info = JSON.parse(settings.companyInfoJson || '{}');
    info.name = 'Penguin Peak Technologies Pvt Ltd.';
    await prisma.systemSettings.update({
      where: { id: settings.id },
      data: {
        companyInfoJson: JSON.stringify(info)
      }
    });
    console.log('Successfully updated settings in DB');
  } else {
    console.log('No settings found in DB');
  }
}

main().finally(() => prisma.$disconnect());

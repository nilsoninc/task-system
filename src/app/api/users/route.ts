import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

// GET /api/users — list all users
export async function GET() {
  try {
    const users = await prisma.user.findMany({ orderBy: { createdAt: 'asc' } });
    const formatted = users.map(u => ({
      ...u,
      lastActivityTimestamp: u.lastActivityTimestamp ? Number(u.lastActivityTimestamp) : undefined,
      documents: JSON.parse(u.documentsJson || '[]'),
      salary: JSON.parse(u.salaryJson || '{}'),
      leaveBalance: JSON.parse(u.leaveBalanceJson || '{}'),
      emergencyContacts: JSON.parse(u.emergencyContactsJson || '[]'),
    }));
    return NextResponse.json({ users: formatted });
  } catch (error) {
    console.error('GET /api/users error:', error);
    return NextResponse.json({ error: 'Failed to load users' }, { status: 500 });
  }
}

// POST /api/users — create a new user
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const passwordHash = await bcrypt.hash(body.password || 'admin123', 10);

    const user = await prisma.user.create({
      data: {
        id: body.id,
        name: body.name,
        email: body.email.toLowerCase(),
        passwordHash,
        role: body.role,
        customRoleId: body.customRoleId,
        title: body.title,
        avatar: body.avatar,
        joiningDate: body.joiningDate,
        birthDate: body.birthDate,
        phone: body.phone,
        address: body.address,
        teamId: body.teamId,
        status: 'OFFLINE',
        isLoggedIn: false,
        documentsJson: '[]',
        salaryJson: JSON.stringify(body.salary || { basic: 0, hra: 0, specialAllowance: 0, effectiveDate: '', increments: [] }),
        leaveBalanceJson: JSON.stringify(body.leaveBalance || { paid: 18, sick: 10, casual: 6, compOff: 0, used: 0 }),
        emergencyContactsJson: JSON.stringify(body.emergencyContacts || []),
      },
    });

    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error('POST /api/users error:', error);
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    });

    if (!user) {
      console.log('Login failed: User not found for email', email.trim().toLowerCase());
      return NextResponse.json({ error: 'Invalid user credentials' }, { status: 401 });
    }

    const passwordMatch = await bcrypt.compare(password.trim(), user.passwordHash);
    if (!passwordMatch) {
      console.log('Login failed: Password mismatch for user', user.email);
      return NextResponse.json({ error: 'Invalid user credentials' }, { status: 401 });
    }

    // Parse JSON fields
    const formattedUser = {
      ...user,
      lastActivityTimestamp: user.lastActivityTimestamp ? Number(user.lastActivityTimestamp) : undefined,
      documents: JSON.parse(user.documentsJson || '[]'),
      salary: JSON.parse(user.salaryJson || '{}'),
      leaveBalance: JSON.parse(user.leaveBalanceJson || '{}'),
    };

    return NextResponse.json({ success: true, user: formattedUser });
  } catch (error: any) {
    console.error('Login Auth Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

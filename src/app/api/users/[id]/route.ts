import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

// PATCH /api/users/[id] — update a user's mutable fields
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const body = await req.json();

    // Build the update payload — only include fields that are present
    const data: Record<string, unknown> = {};

    if (body.status !== undefined) data.status = body.status;
    if (body.isLoggedIn !== undefined) data.isLoggedIn = body.isLoggedIn;
    if (body.checkInTime !== undefined) data.checkInTime = body.checkInTime;
    if (body.checkOutTime !== undefined) data.checkOutTime = body.checkOutTime;
    if (body.lastActivityTimestamp !== undefined) data.lastActivityTimestamp = BigInt(body.lastActivityTimestamp);
    if (body.teamId !== undefined) data.teamId = body.teamId;
    if (body.customRoleId !== undefined) data.customRoleId = body.customRoleId;

    // JSON blob fields
    if (body.documentsJson !== undefined) data.documentsJson = body.documentsJson;
    if (body.salaryJson !== undefined) data.salaryJson = body.salaryJson;
    if (body.leaveBalanceJson !== undefined) data.leaveBalanceJson = body.leaveBalanceJson;
    if (body.emergencyContactsJson !== undefined) data.emergencyContactsJson = body.emergencyContactsJson;
    // Allow updating core profile fields
    if (body.name !== undefined) data.name = body.name;
    if (body.title !== undefined) data.title = body.title;
    if (body.phone !== undefined) data.phone = body.phone;
    if (body.address !== undefined) data.address = body.address;
    if (body.role !== undefined) data.role = body.role;
    if (body.customRoleId !== undefined) data.customRoleId = body.customRoleId;
    if (body.birthDate !== undefined) data.birthDate = body.birthDate;
    if (body.joiningDate !== undefined) data.joiningDate = body.joiningDate;
    if (body.avatar !== undefined) data.avatar = body.avatar;

    // Hash password if provided
    if (body.password) {
      data.passwordHash = await bcrypt.hash(body.password, 10);
    }

    const user = await prisma.user.update({ where: { id }, data });

    return NextResponse.json({
      success: true,
      user: {
        ...user,
        lastActivityTimestamp: user.lastActivityTimestamp ? Number(user.lastActivityTimestamp) : undefined,
        documents: JSON.parse(user.documentsJson || '[]'),
        salary: JSON.parse(user.salaryJson || '{}'),
        leaveBalance: JSON.parse(user.leaveBalanceJson || '{}'),
        emergencyContacts: JSON.parse(user.emergencyContactsJson || '[]'),
      },
    });
  } catch (error) {
    console.error('PATCH /api/users/[id] error:', error);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}

// DELETE /api/users/[id]
export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    await prisma.user.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/users/[id] error:', error);
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
}

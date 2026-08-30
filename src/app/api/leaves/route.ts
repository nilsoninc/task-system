import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/leaves
export async function GET() {
  try {
    const leaves = await prisma.leaveApplication.findMany({ orderBy: { appliedOn: 'desc' } });
    return NextResponse.json({ leaveApplications: leaves });
  } catch (error) {
    console.error('GET /api/leaves error:', error);
    return NextResponse.json({ error: 'Failed to load leave applications' }, { status: 500 });
  }
}

// POST /api/leaves
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const leave = await prisma.leaveApplication.create({
      data: {
        id: body.id,
        userId: body.userId,
        userName: body.userName,
        userRole: body.userRole,
        leaveType: body.leaveType,
        startDate: body.startDate,
        endDate: body.endDate,
        days: body.days,
        reason: body.reason,
        attachmentName: body.attachmentName,
        status: 'PENDING',
        appliedOn: body.appliedOn,
        isSoftDeleted: false,
      },
    });
    return NextResponse.json({ success: true, leave });
  } catch (error) {
    console.error('POST /api/leaves error:', error);
    return NextResponse.json({ error: 'Failed to create leave application' }, { status: 500 });
  }
}

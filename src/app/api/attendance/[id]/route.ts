import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// PATCH /api/attendance/[id] — update checkOut and workHours
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const body = await req.json();

    const data: Record<string, unknown> = {};
    if (body.checkOut !== undefined) data.checkOut = body.checkOut;
    if (body.workHours !== undefined) data.workHours = body.workHours;
    if (body.status !== undefined) data.status = body.status;
    if (body.notes !== undefined) data.notes = body.notes;

    const record = await prisma.attendanceRecord.update({ where: { id }, data });
    return NextResponse.json({ success: true, record });
  } catch (error) {
    console.error('PATCH /api/attendance/[id] error:', error);
    return NextResponse.json({ error: 'Failed to update attendance record' }, { status: 500 });
  }
}

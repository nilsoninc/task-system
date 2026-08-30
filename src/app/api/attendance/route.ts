import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/attendance
export async function GET() {
  try {
    const records = await prisma.attendanceRecord.findMany({ orderBy: { date: 'desc' } });
    return NextResponse.json({ attendance: records });
  } catch (error) {
    console.error('GET /api/attendance error:', error);
    return NextResponse.json({ error: 'Failed to load attendance' }, { status: 500 });
  }
}

// POST /api/attendance — create a new check-in record
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const record = await prisma.attendanceRecord.create({
      data: {
        id: body.id,
        userId: body.userId,
        date: body.date,
        checkIn: body.checkIn,
        checkOut: body.checkOut,
        workHours: body.workHours ?? 0,
        isLate: body.isLate ?? false,
        status: body.status || 'PRESENT',
        notes: body.notes,
      },
    });
    return NextResponse.json({ success: true, record });
  } catch (error) {
    console.error('POST /api/attendance error:', error);
    return NextResponse.json({ error: 'Failed to create attendance record' }, { status: 500 });
  }
}

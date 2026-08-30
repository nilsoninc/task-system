import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/comp-off
export async function GET() {
  try {
    const requests = await prisma.compOffRequest.findMany({ orderBy: { requestedOn: 'desc' } });
    return NextResponse.json({ compOffRequests: requests });
  } catch (error) {
    console.error('GET /api/comp-off error:', error);
    return NextResponse.json({ error: 'Failed to load comp-off requests' }, { status: 500 });
  }
}

// POST /api/comp-off
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const request = await prisma.compOffRequest.create({
      data: {
        id: body.id,
        userId: body.userId,
        userName: body.userName,
        workDate: body.workDate,
        hoursWorked: body.hoursWorked,
        reason: body.reason,
        projectWorkedOn: body.projectWorkedOn,
        status: 'PENDING',
        convertedDays: body.convertedDays ?? 1,
        requestedOn: body.requestedOn,
      },
    });
    return NextResponse.json({ success: true, request });
  } catch (error) {
    console.error('POST /api/comp-off error:', error);
    return NextResponse.json({ error: 'Failed to create comp-off request' }, { status: 500 });
  }
}

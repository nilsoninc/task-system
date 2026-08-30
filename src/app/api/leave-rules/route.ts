import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/leave-rules
export async function GET() {
  try {
    const rules = await prisma.leaveRule.findMany();
    return NextResponse.json({ leaveRules: rules });
  } catch (error) {
    console.error('GET /api/leave-rules error:', error);
    return NextResponse.json({ error: 'Failed to load leave rules' }, { status: 500 });
  }
}

// POST /api/leave-rules
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const rule = await prisma.leaveRule.create({
      data: {
        id: body.id,
        leaveType: body.leaveType,
        title: body.title,
        maxDaysPerYear: body.maxDaysPerYear,
        noticePeriodDays: body.noticePeriodDays,
        maxConsecutiveDays: body.maxConsecutiveDays,
        allowCarryForward: body.allowCarryForward ?? true,
        description: body.description,
      },
    });
    return NextResponse.json({ success: true, rule });
  } catch (error) {
    console.error('POST /api/leave-rules error:', error);
    return NextResponse.json({ error: 'Failed to create leave rule' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/task-types
export async function GET() {
  try {
    const types = await prisma.taskTypeMaster.findMany();
    return NextResponse.json({ taskTypes: types });
  } catch (error) {
    console.error('GET /api/task-types error:', error);
    return NextResponse.json({ error: 'Failed to load task types' }, { status: 500 });
  }
}

// POST /api/task-types
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const type = await prisma.taskTypeMaster.create({
      data: {
        id: body.id,
        name: body.name,
        code: body.code,
        description: body.description,
        color: body.color,
      },
    });
    return NextResponse.json({ success: true, type });
  } catch (error) {
    console.error('POST /api/task-types error:', error);
    return NextResponse.json({ error: 'Failed to create task type' }, { status: 500 });
  }
}

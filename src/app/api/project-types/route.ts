import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/project-types
export async function GET() {
  try {
    const types = await prisma.projectTypeMaster.findMany();
    return NextResponse.json({ projectTypes: types });
  } catch (error) {
    console.error('GET /api/project-types error:', error);
    return NextResponse.json({ error: 'Failed to load project types' }, { status: 500 });
  }
}

// POST /api/project-types
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const type = await prisma.projectTypeMaster.create({
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
    console.error('POST /api/project-types error:', error);
    return NextResponse.json({ error: 'Failed to create project type' }, { status: 500 });
  }
}

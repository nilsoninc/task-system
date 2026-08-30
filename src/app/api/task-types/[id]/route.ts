import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// PATCH /api/task-types/[id]
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const body = await req.json();

    const data: Record<string, any> = {};
    if (body.name !== undefined) data.name = body.name;
    if (body.code !== undefined) data.code = body.code;
    if (body.description !== undefined) data.description = body.description;
    if (body.color !== undefined) data.color = body.color;

    const type = await prisma.taskTypeMaster.update({
      where: { id },
      data,
    });

    return NextResponse.json({ success: true, type });
  } catch (error) {
    console.error('PATCH /api/task-types/[id] error:', error);
    return NextResponse.json({ error: 'Failed to update task type' }, { status: 500 });
  }
}

// DELETE /api/task-types/[id]
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    await prisma.taskTypeMaster.delete({
      where: { id },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/task-types/[id] error:', error);
    return NextResponse.json({ error: 'Failed to delete task type' }, { status: 500 });
  }
}

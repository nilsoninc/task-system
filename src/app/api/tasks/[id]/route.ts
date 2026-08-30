import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// PATCH /api/tasks/[id]
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const body = await req.json();

    const data: Record<string, unknown> = {};
    if (body.title !== undefined) data.title = body.title;
    if (body.description !== undefined) data.description = body.description;
    if (body.projectId !== undefined) data.projectId = body.projectId;
    if (body.typeId !== undefined) data.typeId = body.typeId;
    if (body.priority !== undefined) data.priority = body.priority;
    if (body.status !== undefined) data.status = body.status;
    if (body.assigneeId !== undefined) data.assigneeId = body.assigneeId;
    if (body.estimatedHours !== undefined) data.estimatedHours = body.estimatedHours;
    if (body.startDate !== undefined) data.startDate = body.startDate;
    if (body.dueDate !== undefined) data.dueDate = body.dueDate;
    if (body.isTimerRunning !== undefined) data.isTimerRunning = body.isTimerRunning;
    if (body.activeTimerStart !== undefined) data.activeTimerStart = body.activeTimerStart;
    if (body.loggedHours !== undefined) data.loggedHours = body.loggedHours;
    if (body.worklogsJson !== undefined) {
      data.worklogsJson = typeof body.worklogsJson === 'string' ? body.worklogsJson : JSON.stringify(body.worklogsJson);
    }
    if (body.attachmentsJson !== undefined) {
      data.attachmentsJson = typeof body.attachmentsJson === 'string' ? body.attachmentsJson : JSON.stringify(body.attachmentsJson);
    }
    if (body.isSoftDeleted !== undefined) data.isSoftDeleted = body.isSoftDeleted;
    if (body.softDeletedBy !== undefined) data.softDeletedBy = body.softDeletedBy;
    if (body.softDeletedRole !== undefined) data.softDeletedRole = body.softDeletedRole;

    const task = await prisma.task.update({ where: { id }, data });

    return NextResponse.json({
      success: true,
      task: {
        ...task,
        startDate: task.startDate ?? undefined,
        worklogs: JSON.parse(task.worklogsJson || '[]'),
        attachments: JSON.parse(task.attachmentsJson || '[]'),
        isSoftDeleted: Boolean(task.isSoftDeleted),
        softDeletedBy: task.softDeletedBy ?? undefined,
        softDeletedRole: task.softDeletedRole ?? undefined,
      },
    });
  } catch (error) {
    console.error('PATCH /api/tasks/[id] error:', error);
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 });
  }
}

// DELETE /api/tasks/[id]
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    await prisma.task.delete({ where: { id } });
    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error('DELETE /api/tasks/[id] error:', error);
    return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 });
  }
}

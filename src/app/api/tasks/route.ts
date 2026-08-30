import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

function formatTask(task: {
  id: string;
  title: string;
  description: string;
  projectId: string;
  typeId: string;
  priority: string;
  status: string;
  assigneeId: string;
  creatorId: string;
  estimatedHours: number;
  loggedHours: number;
  startDate?: string | null;
  dueDate: string;
  createdAt: string;
  isTimerRunning: boolean;
  activeTimerStart: string | null;
  worklogsJson: string;
  attachmentsJson?: string | null;
  isSoftDeleted?: boolean | null;
  softDeletedBy?: string | null;
  softDeletedRole?: string | null;
}) {
  return {
    ...task,
    startDate: task.startDate ?? undefined,
    worklogs: JSON.parse(task.worklogsJson || '[]'),
    attachments: JSON.parse(task.attachmentsJson || '[]'),
    isSoftDeleted: Boolean(task.isSoftDeleted),
    softDeletedBy: task.softDeletedBy ?? undefined,
    softDeletedRole: task.softDeletedRole ?? undefined,
  };
}

// GET /api/tasks
export async function GET() {
  try {
    const tasks = await prisma.task.findMany({ orderBy: { createdAt: 'desc' } });
    return NextResponse.json({ tasks: tasks.map(formatTask) });
  } catch (error) {
    console.error('GET /api/tasks error:', error);
    return NextResponse.json({ error: 'Failed to load tasks' }, { status: 500 });
  }
}

// POST /api/tasks
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const task = await prisma.task.create({
      data: {
        id: body.id,
        title: body.title,
        description: body.description || '',
        projectId: body.projectId,
        typeId: body.typeId,
        priority: body.priority || 'MEDIUM',
        status: body.status || 'TODO',
        assigneeId: body.assigneeId,
        creatorId: body.creatorId,
        estimatedHours: body.estimatedHours,
        loggedHours: body.loggedHours ?? 0,
        startDate: body.startDate ?? null,
        dueDate: body.dueDate,
        createdAt: body.createdAt || new Date().toISOString().split('T')[0],
        isTimerRunning: Boolean(body.isTimerRunning),
        activeTimerStart: body.activeTimerStart ?? null,
        worklogsJson: typeof body.worklogs === 'string' ? body.worklogs : JSON.stringify(body.worklogs || []),
        attachmentsJson: typeof body.attachments === 'string' ? body.attachments : JSON.stringify(body.attachments || []),
        isSoftDeleted: Boolean(body.isSoftDeleted),
        softDeletedBy: body.softDeletedBy ?? null,
        softDeletedRole: body.softDeletedRole ?? null,
      },
    });
    return NextResponse.json({ success: true, task: formatTask(task) });
  } catch (error) {
    console.error('POST /api/tasks error:', error);
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 });
  }
}

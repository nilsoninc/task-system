import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// PATCH /api/projects/[id]
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const body = await req.json();

    const data: Record<string, any> = {};

    if (body.name !== undefined) data.name = body.name;
    if (body.description !== undefined) data.description = body.description;
    if (body.typeId !== undefined) data.typeId = body.typeId;
    if (body.estimatedHours !== undefined) data.estimatedHours = Number(body.estimatedHours) || 0;
    if (body.assignmentType !== undefined) data.assignmentType = body.assignmentType;
    if (body.teamId !== undefined) data.teamId = body.teamId;
    if (body.assignedUserIds !== undefined) {
      data.assignedUserIds = Array.isArray(body.assignedUserIds)
        ? JSON.stringify(body.assignedUserIds)
        : String(body.assignedUserIds);
    }
    if (body.documents !== undefined) {
      data.documentsJson = Array.isArray(body.documents)
        ? JSON.stringify(body.documents)
        : String(body.documents);
    } else if (body.documentsJson !== undefined) {
      data.documentsJson = String(body.documentsJson);
    }
    if (body.startDate !== undefined) data.startDate = body.startDate;
    if (body.endDate !== undefined) data.endDate = body.endDate;
    if (body.completionDate !== undefined) data.completionDate = body.completionDate;
    if (body.clientName !== undefined) data.clientName = body.clientName;
    if (body.deadline !== undefined) data.deadline = body.deadline;
    if (body.budget !== undefined) data.budget = Number(body.budget) || 0;
    if (body.status !== undefined) data.status = body.status;
    if (body.progress !== undefined) data.progress = Number(body.progress) || 0;

    const updated = await prisma.project.update({
      where: { id },
      data,
    });

    let assignedUserIds: string[] = [];
    let documents: any[] = [];
    try {
      assignedUserIds = JSON.parse(updated.assignedUserIds || '[]');
    } catch {
      assignedUserIds = [];
    }
    try {
      documents = JSON.parse(updated.documentsJson || '[]');
    } catch {
      documents = [];
    }

    return NextResponse.json({
      success: true,
      project: {
        ...updated,
        assignedUserIds,
        documents,
      },
    });
  } catch (error) {
    console.error('PATCH /api/projects/[id] error:', error);
    return NextResponse.json({ error: 'Failed to update project' }, { status: 500 });
  }
}

// DELETE /api/projects/[id]
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    await prisma.project.delete({
      where: { id },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/projects/[id] error:', error);
    return NextResponse.json({ error: 'Failed to delete project' }, { status: 500 });
  }
}

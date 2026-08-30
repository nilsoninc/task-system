import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// PATCH /api/leaves/[id]
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const body = await req.json();

    const data: Record<string, unknown> = {};
    if (body.status !== undefined) data.status = body.status;
    if (body.rejectionReason !== undefined) data.rejectionReason = body.rejectionReason;
    if (body.approverId !== undefined) data.approverId = body.approverId;
    if (body.approverName !== undefined) data.approverName = body.approverName;
    if (body.isSoftDeleted !== undefined) data.isSoftDeleted = body.isSoftDeleted;
    if (body.softDeletedBy !== undefined) data.softDeletedBy = body.softDeletedBy;
    if (body.leaveType !== undefined) data.leaveType = body.leaveType;
    if (body.startDate !== undefined) data.startDate = body.startDate;
    if (body.endDate !== undefined) data.endDate = body.endDate;
    if (body.days !== undefined) data.days = body.days;
    if (body.reason !== undefined) data.reason = body.reason;

    const leave = await prisma.leaveApplication.update({ where: { id }, data });
    return NextResponse.json({ success: true, leave });
  } catch (error) {
    console.error('PATCH /api/leaves/[id] error:', error);
    return NextResponse.json({ error: 'Failed to update leave' }, { status: 500 });
  }
}

// DELETE /api/leaves/[id] — hard delete
export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    await prisma.leaveApplication.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/leaves/[id] error:', error);
    return NextResponse.json({ error: 'Failed to delete leave' }, { status: 500 });
  }
}

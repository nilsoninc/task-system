import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// PATCH /api/comp-off/[id]
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const body = await req.json();

    const data: Record<string, unknown> = {};
    if (body.status !== undefined) data.status = body.status;
    if (body.verifiedBy !== undefined) data.verifiedBy = body.verifiedBy;
    if (body.workDate !== undefined) data.workDate = body.workDate;
    if (body.hoursWorked !== undefined) data.hoursWorked = Number(body.hoursWorked);
    if (body.convertedDays !== undefined) data.convertedDays = Number(body.convertedDays);
    if (body.reason !== undefined) data.reason = body.reason;
    if (body.projectWorkedOn !== undefined) data.projectWorkedOn = body.projectWorkedOn;

    const request = await prisma.compOffRequest.update({ where: { id }, data });
    return NextResponse.json({ success: true, request });
  } catch (error) {
    console.error('PATCH /api/comp-off/[id] error:', error);
    return NextResponse.json({ error: 'Failed to update comp-off request' }, { status: 500 });
  }
}

// DELETE /api/comp-off/[id]
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    await prisma.compOffRequest.delete({ where: { id } });
    return NextResponse.json({ success: true, message: 'Comp-off request deleted' });
  } catch (error) {
    console.error('DELETE /api/comp-off/[id] error:', error);
    return NextResponse.json({ error: 'Failed to delete comp-off request' }, { status: 500 });
  }
}

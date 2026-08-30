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

    const request = await prisma.compOffRequest.update({ where: { id }, data });
    return NextResponse.json({ success: true, request });
  } catch (error) {
    console.error('PATCH /api/comp-off/[id] error:', error);
    return NextResponse.json({ error: 'Failed to update comp-off request' }, { status: 500 });
  }
}

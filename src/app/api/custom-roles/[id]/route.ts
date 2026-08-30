import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// PATCH /api/custom-roles/[id]
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const body = await req.json();

    const role = await prisma.customRole.update({
      where: { id },
      data: {
        name: body.name,
        description: body.description,
        permissionsJson: JSON.stringify(body.permissions || []),
      },
    });

    return NextResponse.json({
      success: true,
      role: { ...role, permissions: JSON.parse(role.permissionsJson || '[]') },
    });
  } catch (error) {
    console.error('PATCH /api/custom-roles/[id] error:', error);
    return NextResponse.json({ error: 'Failed to update custom role' }, { status: 500 });
  }
}

// DELETE /api/custom-roles/[id]
export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    await prisma.customRole.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/custom-roles/[id] error:', error);
    return NextResponse.json({ error: 'Failed to delete custom role' }, { status: 500 });
  }
}

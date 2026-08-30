import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

function formatRole(role: { id: string; name: string; description: string; permissionsJson: string; createdDate: string }) {
  return {
    ...role,
    permissions: JSON.parse(role.permissionsJson || '[]'),
  };
}

// GET /api/custom-roles
export async function GET() {
  try {
    const roles = await prisma.customRole.findMany();
    return NextResponse.json({ customRoles: roles.map(formatRole) });
  } catch (error) {
    console.error('GET /api/custom-roles error:', error);
    return NextResponse.json({ error: 'Failed to load custom roles' }, { status: 500 });
  }
}

// POST /api/custom-roles
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const role = await prisma.customRole.create({
      data: {
        id: body.id,
        name: body.name,
        description: body.description,
        permissionsJson: JSON.stringify(body.permissions || []),
        createdDate: body.createdDate,
      },
    });
    return NextResponse.json({ success: true, role: formatRole(role) });
  } catch (error) {
    console.error('POST /api/custom-roles error:', error);
    return NextResponse.json({ error: 'Failed to create custom role' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const body = await req.json();

    const data: Record<string, any> = {};

    if (body.name !== undefined) data.name = body.name;
    if (body.code !== undefined) data.code = body.code;
    if (body.leaderId !== undefined) data.leaderId = body.leaderId;
    if (body.description !== undefined) data.description = body.description;
    
    // Member IDs are stored as JSON string array
    if (body.memberIds !== undefined) {
      data.memberIds = JSON.stringify(body.memberIds);
    }

    const team = await prisma.team.update({
      where: { id },
      data
    });

    return NextResponse.json({
      success: true,
      team: {
        ...team,
        memberIds: JSON.parse(team.memberIds || '[]')
      }
    });
  } catch (error) {
    console.error('PATCH /api/teams/[id] error:', error);
    return NextResponse.json({ error: 'Failed to update team' }, { status: 500 });
  }
}

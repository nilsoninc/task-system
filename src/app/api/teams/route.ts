import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/teams
export async function GET() {
  try {
    const teams = await prisma.team.findMany();
    const formatted = teams.map(t => ({
      ...t,
      memberIds: JSON.parse(t.memberIds || '[]'),
    }));
    return NextResponse.json({ teams: formatted });
  } catch (error) {
    console.error('GET /api/teams error:', error);
    return NextResponse.json({ error: 'Failed to load teams' }, { status: 500 });
  }
}

// POST /api/teams
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const team = await prisma.team.create({
      data: {
        id: body.id,
        name: body.name,
        code: body.code,
        leaderId: body.leaderId,
        memberIds: JSON.stringify(body.memberIds || []),
        description: body.description,
      },
    });
    return NextResponse.json({ success: true, team: { ...team, memberIds: JSON.parse(team.memberIds) } });
  } catch (error) {
    console.error('POST /api/teams error:', error);
    return NextResponse.json({ error: 'Failed to create team' }, { status: 500 });
  }
}

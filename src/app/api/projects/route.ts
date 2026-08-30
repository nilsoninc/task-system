import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/projects
export async function GET() {
  try {
    const rawProjects = await prisma.project.findMany();
    const projects = rawProjects.map((p) => {
      let assignedUserIds: string[] = [];
      let documents: any[] = [];
      try {
        assignedUserIds = JSON.parse(p.assignedUserIds || '[]');
      } catch {
        assignedUserIds = [];
      }
      try {
        documents = JSON.parse(p.documentsJson || '[]');
      } catch {
        documents = [];
      }
      return {
        ...p,
        assignedUserIds,
        documents,
      };
    });
    return NextResponse.json({ projects });
  } catch (error) {
    console.error('GET /api/projects error:', error);
    return NextResponse.json({ error: 'Failed to load projects' }, { status: 500 });
  }
}

// POST /api/projects
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const assignedUserIdsJson = Array.isArray(body.assignedUserIds)
      ? JSON.stringify(body.assignedUserIds)
      : typeof body.assignedUserIds === 'string'
      ? body.assignedUserIds
      : '[]';

    const documentsJson = Array.isArray(body.documents)
      ? JSON.stringify(body.documents)
      : typeof body.documentsJson === 'string'
      ? body.documentsJson
      : '[]';

    const project = await prisma.project.create({
      data: {
        id: body.id,
        name: body.name,
        description: body.description || '',
        typeId: body.typeId,
        estimatedHours: Number(body.estimatedHours) || 0,
        assignmentType: body.assignmentType || 'TEAM',
        teamId: body.teamId || '',
        assignedUserIds: assignedUserIdsJson,
        documentsJson: documentsJson,
        startDate: body.startDate || '',
        endDate: body.endDate || body.deadline || '',
        completionDate: body.completionDate || '',
        clientName: body.clientName || '',
        deadline: body.deadline || body.endDate || '',
        budget: Number(body.budget) || 0,
        status: body.status || 'NOT_STARTED',
        progress: body.progress ?? 0,
      },
    });

    return NextResponse.json({
      success: true,
      project: {
        ...project,
        assignedUserIds: Array.isArray(body.assignedUserIds) ? body.assignedUserIds : [],
        documents: Array.isArray(body.documents) ? body.documents : [],
      },
    });
  } catch (error) {
    console.error('POST /api/projects error:', error);
    return NextResponse.json({ error: 'Failed to create project' }, { status: 500 });
  }
}

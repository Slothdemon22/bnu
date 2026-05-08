import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const workspace = await prisma.workspace.findUnique({
      where: { slug },
      select: { id: true }
    })

    if (!workspace) return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })

    const body = await req.json()
    const { 
      title, 
      description, 
      priority, 
      dueDate, 
      tags, 
      assigneeIds, 
      milestones,
      attachments 
    } = body

    if (!title) return NextResponse.json({ error: 'Title is required' }, { status: 400 })

    const task = await prisma.task.create({
      data: {
        title,
        description,
        priority: priority || 'medium',
        dueDate: dueDate ? new Date(dueDate) : null,
        tags: tags || [],
        attachments: attachments || [],
        workspaceId: workspace.id,
        createdById: user.id,
        assignees: {
          connect: (assigneeIds || []).map((id: number) => ({ id }))
        },
        milestones: {
          create: (milestones || []).map((m: any) => ({
            name: m.name,
            description: m.description,
            status: m.status || 'pending',
            estimatedTime: m.estimatedTime,
            tags: m.tags || [],
            notes: m.notes,
            attachments: m.attachments || []
          }))
        }
      },
      include: {
        assignees: {
          select: { id: true, name: true, email: true, imageUrl: true }
        },
        milestones: true
      }
    })

    // Notify assignees
    const { notifyUser } = await import('@/lib/activity')
    for (const assigneeId of (assigneeIds || [])) {
      if (assigneeId === user.id) continue // Don't notify self
      await notifyUser({
        userId: assigneeId,
        title: 'New Task Assigned',
        message: `${user.name || user.email} assigned you a new task: ${title}`,
        type: 'task_assigned',
        entityType: 'task',
        entityId: task.id
      })
    }

    return NextResponse.json({ task })
  } catch (error: any) {
    console.error('[TASKS_POST] Error:', error)
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 })
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const workspace = await prisma.workspace.findUnique({
      where: { slug },
      select: { id: true }
    })

    if (!workspace) return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })

    const tasks = await prisma.task.findMany({
      where: { workspaceId: workspace.id },
      include: {
        assignees: {
          select: { id: true, name: true, email: true, imageUrl: true }
        },
        milestones: true,
        createdBy: {
          select: { id: true, name: true, imageUrl: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ tasks })
  } catch (error: any) {
    console.error('[TASKS_GET] Error:', error)
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 })
  }
}

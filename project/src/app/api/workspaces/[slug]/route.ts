import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

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
      include: {
        members: {
          select: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                imageUrl: true,
                points: true
              }
            },
            jobTitle: true,
            role: true,
            id: true
          }
        },
        invites: {
          where: { 
            acceptedAt: null,
            expiresAt: { gt: new Date() }
          },
          select: {
            id: true,
            email: true,
            role: true,
            department: true,
            jobTitle: true,
            createdAt: true
          }
        },
        _count: {
          select: { members: true }
        }
      }
    })

    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })
    }

    // Check if user is a member
    const membership = await prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId: user.id,
          workspaceId: workspace.id
        }
      }
    })

    if (!membership) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get task counts
    const taskCount = await prisma.task.count({
      where: { workspaceId: workspace.id }
    })

    // Get recent activity (from chat and tasks)
    const recentChat = await prisma.chatMessage.findMany({
      where: { workspaceId: workspace.id },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        author: { select: { name: true, email: true, imageUrl: true } }
      }
    })

    const recentTasks = await prisma.task.findMany({
      where: { workspaceId: workspace.id },
      orderBy: { updatedAt: 'desc' },
      take: 5,
      include: {
        createdBy: { select: { name: true, email: true, imageUrl: true } }
      }
    })

    // Combine and sort activity
    const activity = [
      ...recentChat.map(c => ({
        id: `chat-${c.id}`,
        type: 'chat',
        user: c.author.name || c.author.email,
        userImage: c.author.imageUrl,
        content: `sent a message: "${c.content.substring(0, 30)}${c.content.length > 30 ? '...' : ''}"`,
        time: c.createdAt
      })),
      ...recentTasks.map(t => ({
        id: `task-${t.id}`,
        type: 'task',
        user: t.createdBy.name || t.createdBy.email,
        userImage: t.createdBy.imageUrl,
        content: `updated task: ${t.title}`,
        time: t.updatedAt
      }))
    ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 10)

    return NextResponse.json({ 
      workspace: {
        ...workspace,
        role: membership.role,
        memberCount: workspace._count.members,
        taskCount,
        activity,
        members: workspace.members,
        invites: workspace.invites
      }
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch workspace' }, { status: 500 })
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const workspace = await prisma.workspace.findUnique({
      where: { slug },
      include: {
        members: {
          where: { userId: user.id }
        }
      }
    })

    if (!workspace) return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })

    const membership = workspace.members[0]
    if (!membership || (membership.role !== 'owner' && membership.role !== 'admin')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { name, description, imageUrl, useCase, teamSize } = await req.json()

    const updated = await prisma.workspace.update({
      where: { id: workspace.id },
      data: {
        name: name !== undefined ? name : undefined,
        description: description !== undefined ? description : undefined,
        imageUrl: imageUrl !== undefined ? imageUrl : undefined,
        useCase: useCase !== undefined ? useCase : undefined,
        teamSize: teamSize !== undefined ? teamSize : undefined,
      }
    })

    // Trigger Pusher for workspace updates (sidebar, navbar refresh)
    const { pusherServer } = await import('@/lib/pusher/server')
    if (pusherServer) {
      await pusherServer.trigger(`workspace-${slug}`, 'workspace-updated', { workspace: updated })
    }

    return NextResponse.json({ workspace: updated })
  } catch (error: any) {
    console.error('[WORKSPACE_PATCH] Error:', error)
    return NextResponse.json({ error: 'Failed to update workspace' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const workspace = await prisma.workspace.findUnique({
      where: { slug },
      include: {
        members: {
          where: { userId: user.id }
        }
      }
    })

    if (!workspace) return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })

    // Only owner can delete
    const membership = workspace.members[0]
    if (!membership || membership.role !== 'owner') {
      return NextResponse.json({ error: 'Only the workspace owner can delete it' }, { status: 403 })
    }

    // Use a transaction to ensure clean deletion
    await prisma.$transaction([
      prisma.workspaceInvite.deleteMany({ where: { workspaceId: workspace.id } }),
      prisma.workspaceMember.deleteMany({ where: { workspaceId: workspace.id } }),
      prisma.chatMessage.deleteMany({ where: { workspaceId: workspace.id } }),
      prisma.task.deleteMany({ where: { workspaceId: workspace.id } }),
      prisma.workspace.delete({ where: { id: workspace.id } })
    ])

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('[WORKSPACE_DELETE] Error:', error)
    return NextResponse.json({ error: 'Failed to delete workspace' }, { status: 500 })
  }
}

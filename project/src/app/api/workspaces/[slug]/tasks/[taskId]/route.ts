import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string; taskId: string }> }
) {
  const { slug, taskId } = await params
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const workspaceMember = await prisma.workspaceMember.findFirst({
      where: { userId: user.id, workspace: { slug } }
    })
    
    if (!workspaceMember) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const isAdmin = workspaceMember.role === 'admin' || workspaceMember.role === 'owner'

    const existingTask = await prisma.task.findUnique({
      where: { id: parseInt(taskId) },
      include: { assignees: true, milestones: true, createdBy: true }
    })

    if (!existingTask) return NextResponse.json({ error: 'Task not found' }, { status: 404 })

    const isAssignee = existingTask.assignees.some((a: any) => a.id === user.id)

    if (!isAdmin && !isAssignee) {
      return NextResponse.json({ error: 'Only assignees or admins can edit this task' }, { status: 403 })
    }

    const body = await req.json()
    const { title, description, status, priority, dueDate, tags, assigneeIds, milestones, attachments } = body

    const task = await prisma.task.update({
      where: { id: parseInt(taskId) },
      data: {
        title,
        description,
        status,
        priority,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        tags,
        attachments,
        assignees: assigneeIds ? {
          set: assigneeIds.map((id: number) => ({ id }))
        } : undefined,
        milestones: milestones ? {
          deleteMany: {},
          create: milestones.map((m: any) => ({
            name: m.name,
            description: m.description,
            status: m.status || 'pending',
            estimatedTime: m.estimatedTime,
            difficulty: m.difficulty || 'medium',
            tags: m.tags || [],
            notes: m.notes,
            attachments: m.attachments || []
          }))
        } : undefined
      },
      include: {
        assignees: true,
        milestones: true
      }
    })

    // Award points for newly completed milestones
    if (milestones) {
      let pointsToAward = 0
      const difficultyPoints: Record<string, number> = {
        easy: 10,
        medium: 20,
        hard: 50,
        expert: 100
      }

      for (const m of milestones) {
        if (m.status === 'completed') {
          const oldMilestone = existingTask.milestones.find((om: any) => om.name === m.name)
          if (!oldMilestone || oldMilestone.status !== 'completed') {
            pointsToAward += difficultyPoints[m.difficulty || 'medium'] || 20
          }
        }
      }

      if (pointsToAward > 0) {
        await prisma.user.update({
          where: { id: user.id },
          data: { points: { increment: pointsToAward } }
        })

        // Notify team about progress
        const { notifyUser } = await import('@/lib/activity')
        const teamIds = new Set([
          existingTask.createdById, 
          ...existingTask.assignees.map((a: any) => a.id)
        ])
        
        for (const targetId of Array.from(teamIds)) {
          if (targetId === user.id) continue // Don't notify the one who completed it
          await notifyUser({
            userId: targetId,
            title: 'Phase Accomplished! 🚀',
            message: `${user.name || user.email} completed a phase in "${existingTask.title}" and earned ${pointsToAward} XP!`,
            type: 'milestone_completed',
            entityType: 'task',
            entityId: existingTask.id
          })
        }
      }
    }

    // Notify new assignees
    if (assigneeIds && assigneeIds.length > 0) {
      const { notifyUser } = await import('@/lib/activity')
      for (const assigneeId of assigneeIds) {
        if (assigneeId === user.id) continue
        await notifyUser({
          userId: assigneeId,
          title: 'Task Updated',
          message: `${user.name || user.email} updated a task you are assigned to: ${task.title}`,
          type: 'task_updated',
          entityType: 'task',
          entityId: task.id
        })
      }
    }

    return NextResponse.json({ task })
  } catch (error: any) {
    console.error('[TASK_PATCH] Error:', error)
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string; taskId: string }> }
) {
  const { slug, taskId } = await params
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const workspaceMember = await prisma.workspaceMember.findFirst({
      where: { userId: user.id, workspace: { slug } }
    })
    
    if (!workspaceMember) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const isAdmin = workspaceMember.role === 'admin' || workspaceMember.role === 'owner'

    const existingTask = await prisma.task.findUnique({
      where: { id: parseInt(taskId) },
      include: { assignees: true }
    })

    if (!existingTask) return NextResponse.json({ error: 'Task not found' }, { status: 404 })

    if (!isAdmin) {
      return NextResponse.json({ error: 'Only admins can delete tasks' }, { status: 403 })
    }

    // Milestones are onDelete: Cascade, so deleting the task is enough
    await prisma.task.delete({
      where: { id: parseInt(taskId) }
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('[TASK_DELETE] Error:', error)
    return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 })
  }
}

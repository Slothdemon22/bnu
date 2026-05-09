import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

function withDueTime(baseDate: Date, dueTime?: string | null) {
  if (!dueTime) return baseDate
  const [hoursStr, minutesStr] = dueTime.split(':')
  const hours = Number(hoursStr)
  const minutes = Number(minutesStr)
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return baseDate
  const next = new Date(baseDate)
  next.setHours(hours, minutes, 0, 0)
  return next
}

function computeNextRecurringDate({
  currentDueDate,
  pattern,
  interval,
  recurringDays,
  recurringDueTime,
}: {
  currentDueDate?: Date | null
  pattern?: string | null
  interval: number
  recurringDays?: number[]
  recurringDueTime?: string | null
}) {
  const now = new Date()
  const base = currentDueDate ? new Date(currentDueDate) : new Date(now)
  const safeInterval = Math.max(1, interval || 1)

  if (pattern === 'weekly') {
    const weekdays = (recurringDays || [])
      .filter((d) => Number.isInteger(d) && d >= 0 && d <= 6)
      .sort((a, b) => a - b)

    if (weekdays.length > 0) {
      const today = base.getDay()
      const currentMinutes = base.getHours() * 60 + base.getMinutes()
      const dueMinutes = recurringDueTime
        ? (() => {
            const [h, m] = recurringDueTime.split(':').map(Number)
            return Number.isNaN(h) || Number.isNaN(m) ? currentMinutes : h * 60 + m
          })()
        : currentMinutes

      let dayOffset = -1
      for (const wd of weekdays) {
        const diff = wd - today
        if (diff > 0 || (diff === 0 && dueMinutes > currentMinutes)) {
          dayOffset = diff
          break
        }
      }
      if (dayOffset === -1) {
        dayOffset = (7 * safeInterval) - today + weekdays[0]
      }

      const next = new Date(base)
      next.setDate(base.getDate() + dayOffset)
      return withDueTime(next, recurringDueTime)
    }

    const next = new Date(base)
    next.setDate(base.getDate() + (7 * safeInterval))
    return withDueTime(next, recurringDueTime)
  }

  if (pattern === 'monthly') {
    const next = new Date(base)
    next.setMonth(base.getMonth() + safeInterval)
    return withDueTime(next, recurringDueTime)
  }

  const next = new Date(base)
  next.setDate(base.getDate() + safeInterval)
  return withDueTime(next, recurringDueTime)
}

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
    const { title, description, status, priority, dueDate, tags, assigneeIds, milestones, attachments, isRecurring, recurringPattern, recurringInterval, recurringDays, recurringDueTime, recurrenceEndDate } = body
    const statusChangedToDone = status === 'done' && existingTask.status !== 'done'

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
        isRecurring: typeof isRecurring === 'boolean' ? isRecurring : undefined,
        recurringPattern: typeof isRecurring === 'boolean'
          ? (isRecurring ? recurringPattern || null : null)
          : undefined,
        recurringInterval: typeof isRecurring === 'boolean'
          ? (isRecurring ? Math.max(1, Number(recurringInterval || 1)) : 1)
          : undefined,
        recurringDays: typeof isRecurring === 'boolean'
          ? (isRecurring && Array.isArray(recurringDays) ? recurringDays : [])
          : undefined,
        recurringDueTime: typeof isRecurring === 'boolean'
          ? (isRecurring ? recurringDueTime || null : null)
          : undefined,
        recurrenceEndDate: typeof isRecurring === 'boolean'
          ? (isRecurring && recurrenceEndDate ? new Date(recurrenceEndDate) : null)
          : undefined,
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

    let recurringGeneratedTask: any = null
    if (statusChangedToDone && task.isRecurring && task.recurringPattern) {
      const nextDueDate = computeNextRecurringDate({
        currentDueDate: task.dueDate,
        pattern: task.recurringPattern,
        interval: task.recurringInterval || 1,
        recurringDays: task.recurringDays || [],
        recurringDueTime: task.recurringDueTime,
      })

      const endDate = task.recurrenceEndDate ? new Date(task.recurrenceEndDate) : null
      if (!endDate || nextDueDate <= endDate) {
        const nextTitle = task.title
        recurringGeneratedTask = await prisma.task.create({
          data: {
            title: nextTitle,
            description: task.description,
            status: 'todo',
            priority: task.priority,
            dueDate: nextDueDate,
            tags: task.tags,
            attachments: task.attachments,
            isRecurring: true,
            recurringPattern: task.recurringPattern,
            recurringInterval: task.recurringInterval || 1,
            recurringDays: task.recurringDays || [],
            recurringDueTime: task.recurringDueTime,
            recurrenceEndDate: task.recurrenceEndDate,
            parentTaskId: task.parentTaskId || task.id,
            workspaceId: task.workspaceId,
            createdById: task.createdById,
            assignees: {
              connect: task.assignees.map((a: any) => ({ id: a.id })),
            },
            milestones: {
              create: task.milestones.map((m: any) => ({
                name: m.name,
                description: m.description,
                status: 'pending',
                estimatedTime: m.estimatedTime,
                difficulty: m.difficulty || 'medium',
                tags: m.tags || [],
                notes: m.notes,
                attachments: m.attachments || [],
              })),
            },
          },
          include: {
            assignees: true,
            milestones: true,
          },
        })

        const { notifyUser } = await import('@/lib/activity')
        for (const assignee of task.assignees) {
          if (assignee.id === user.id) continue
          await notifyUser({
            userId: assignee.id,
            title: 'Recurring Task Regenerated',
            message: `AI regenerated recurring task: ${task.title}`,
            type: 'task_recurring_regenerated',
            entityType: 'task',
            entityId: recurringGeneratedTask.id,
          })
        }
      }
    }

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

    return NextResponse.json({ task, recurringGeneratedTask })
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

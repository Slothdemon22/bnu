import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const userId = user.id

    // Aggregate pending tasks (not done) assigned to the user
    const pendingCount = await prisma.task.count({
      where: {
        assignees: { some: { id: userId } },
        status: { not: 'done' }
      }
    })

    // Aggregate completed tasks assigned to the user
    const completedCount = await prisma.task.count({
      where: {
        assignees: { some: { id: userId } },
        status: 'done'
      }
    })

    // Get upcoming tasks (dueDate is in the future) assigned to the user
    const upcomingTasks = await prisma.task.findMany({
      where: {
        assignees: { some: { id: userId } },
        status: { not: 'done' },
        dueDate: {
          gt: new Date()
        }
      },
      orderBy: { dueDate: 'asc' },
      take: 5,
      select: {
        id: true,
        title: true,
        dueDate: true,
        workspace: {
          select: { name: true }
        }
      }
    })

    // Get tasks due today for AI summary
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const todaysTasks = await prisma.task.findMany({
      where: {
        assignees: { some: { id: userId } },
        dueDate: {
          gte: today,
          lt: tomorrow
        }
      },
      select: {
        title: true,
        status: true,
        workspace: { select: { name: true } }
      }
    })

    // Get all assigned tasks for the schedule view
    const allTasks = await prisma.task.findMany({
      where: {
        assignees: { some: { id: userId } }
      },
      select: {
        id: true,
        title: true,
        dueDate: true,
        priority: true,
        status: true,
        workspace: {
          select: { name: true }
        }
      }
    })

    return NextResponse.json({
      pendingCount,
      completedCount,
      upcomingTasks,
      todaysTasks,
      allTasks
    })

  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

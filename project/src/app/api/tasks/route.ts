import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    // Get all tasks for workspaces the user belongs to
    // or just tasks assigned to the user
    const { searchParams } = new URL(request.url)
    const filter = searchParams.get('filter') || 'all' // 'all', 'assigned_to_me'

    let whereClause: any = {
      workspace: {
        members: {
          some: {
            userId: user.id
          }
        }
      }
    }

    if (filter === 'assigned_to_me') {
      whereClause.assignees = {
        some: {
          id: user.id
        }
      }
    }

    const tasks = await prisma.task.findMany({
      where: whereClause,
      include: {
        workspace: {
          select: {
            name: true,
            slug: true,
            imageUrl: true
          }
        },
        assignees: {
          select: {
            id: true,
            name: true,
            email: true,
            imageUrl: true
          }
        },
      },
      orderBy: {
        updatedAt: 'desc'
      }
    })

    return NextResponse.json({ tasks })
  } catch (error) {
    console.error('[GLOBAL_TASKS_GET] Error:', error)
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 })
  }
}

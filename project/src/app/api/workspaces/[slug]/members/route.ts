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
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                imageUrl: true
              }
            }
          }
        }
      }
    })

    if (!workspace) return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })

    return NextResponse.json({ members: workspace.members })
  } catch (error: any) {
    console.error('[MEMBERS_GET] Error:', error)
    return NextResponse.json({ error: 'Failed to fetch members' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ user: null }, { status: 401 })

  let memberships = await prisma.workspaceMember.findMany({
    where: { userId: user.id },
    include: {
      workspace: {
        include: {
          _count: {
            select: { members: true }
          }
        }
      }
    }
  })

  // Fallback: If user has no workspaces (e.g. onboarding skip or error), create a default one
  if (memberships.length === 0) {
    const dbUser = await prisma.user.findUnique({ where: { id: user.id } })
    const name = dbUser?.workspaceName || `${user.name || 'My'}'s Workspace`
    const slug = name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]/g, '') + '-' + Math.random().toString(36).substring(2, 5)
    
    const newWs = await prisma.workspace.create({
      data: {
        name,
        slug,
        members: {
          create: {
            userId: user.id,
            role: 'owner'
          }
        }
      },
      include: {
        _count: {
          select: { members: true }
        }
      }
    })

    return NextResponse.json({ 
      workspaces: [{
        id: newWs.id,
        name: newWs.name,
        slug: newWs.slug,
        role: 'owner',
        memberCount: 1,
        imageUrl: newWs.imageUrl,
        useCase: newWs.useCase
      }]
    })
  }

  const workspaces = memberships.map(m => ({
    id: m.workspace.id,
    name: m.workspace.name,
    slug: m.workspace.slug,
    role: m.role,
    memberCount: m.workspace._count.members,
    imageUrl: m.workspace.imageUrl,
    useCase: m.workspace.useCase
  }))

  return NextResponse.json({ workspaces })
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { name, description, useCase, teamSize, imageUrl } = await req.json()
  if (!name) return NextResponse.json({ error: 'Workspace name is required' }, { status: 400 })

  const slug = name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]/g, '') + '-' + Math.random().toString(36).substring(2, 5)

  try {
    const workspace = await prisma.workspace.create({
      data: {
        name,
        slug,
        description,
        useCase,
        teamSize,
        imageUrl,
        members: {
          create: {
            userId: user.id,
            role: 'owner'
          }
        }
      }
    })

    return NextResponse.json({ workspace })
  } catch (error: any) {
    console.error('Create Workspace Error:', error)
    return NextResponse.json({ error: 'Failed to create workspace' }, { status: 500 })
  }
}

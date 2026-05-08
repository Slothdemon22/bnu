import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { notifyUser } from '@/lib/activity'

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

    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })
    }

    const messages = await prisma.chatMessage.findMany({
      where: { 
        workspaceId: workspace.id,
        parentId: null 
      },
      orderBy: { createdAt: 'asc' },
      include: {
        author: {
          select: { id: true, email: true, name: true, imageUrl: true, role: true },
        },
        replies: {
          orderBy: { createdAt: 'asc' },
          include: {
            author: {
              select: { id: true, email: true, name: true, imageUrl: true, role: true },
            },
            replies: {
              orderBy: { createdAt: 'asc' },
              include: {
                author: {
                  select: { id: true, email: true, name: true, imageUrl: true, role: true },
                },
              }
            }
          }
        },
      },
    })

    return NextResponse.json({ messages })
  } catch (error) {
    console.error('Error fetching workspace messages:', error)
    return NextResponse.json({ error: 'Failed to load messages' }, { status: 500 })
  }
}

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
      include: {
        members: {
          where: { userId: user.id }
        }
      }
    })

    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })
    }

    if (workspace.members.length === 0) {
      return NextResponse.json({ error: 'Not a member of this workspace' }, { status: 403 })
    }

    const { content, parentId } = await req.json()
    if (!content?.trim()) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 })
    }

    const parentIdNum = parentId ? Number(parentId) : null

    const message = await prisma.chatMessage.create({
      data: {
        content: content.trim(),
        authorId: user.id,
        workspaceId: workspace.id,
        parentId: parentIdNum
      },
      include: {
        author: {
          select: { id: true, email: true, name: true, imageUrl: true, role: true },
        }
      }
    })

    // Trigger Pusher for real-time chat
    const { pusherServer } = await import('@/lib/pusher/server')
    if (pusherServer) {
      await pusherServer.trigger(
        `workspace-chat-${slug}`,
        'new-message',
        { message }
      )
    }

    // Notify parent author if reply
    if (parentIdNum) {
      const parent = await prisma.chatMessage.findUnique({
        where: { id: parentIdNum },
        select: { authorId: true }
      })
      if (parent && parent.authorId !== user.id) {
        await notifyUser({
          userId: parent.authorId,
          title: 'New reply in team board',
          message: `${user.name || user.email} replied to you in ${workspace.name}`,
          type: 'chat_reply',
          entityType: 'chat_message',
          entityId: message.id
        })
      }
    }

    return NextResponse.json({ message }, { status: 201 })
  } catch (error) {
    console.error('Error sending workspace message:', error)
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 })
  }
}

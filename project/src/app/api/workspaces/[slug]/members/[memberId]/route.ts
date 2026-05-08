import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string; memberId: string }> }
) {
  const { slug, memberId } = await params
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { role } = await req.json()
    if (!['admin', 'member'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    const workspace = await prisma.workspace.findUnique({
      where: { slug },
      include: { members: true }
    })

    if (!workspace) return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })

    const currentUserMember = workspace.members.find(m => m.userId === user.id)
    if (!currentUserMember || (currentUserMember.role !== 'owner' && currentUserMember.role !== 'admin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const targetMember = await prisma.workspaceMember.findUnique({
      where: { id: parseInt(memberId) }
    })

    if (!targetMember) return NextResponse.json({ error: 'Member not found' }, { status: 404 })
    if (targetMember.role === 'owner') return NextResponse.json({ error: 'Cannot change owner role' }, { status: 400 })

    const updatedMember = await prisma.workspaceMember.update({
      where: { id: parseInt(memberId) },
      data: { role }
    })

    return NextResponse.json({ member: updatedMember })
  } catch (error: any) {
    console.error('[MEMBER_PATCH] Error:', error)
    return NextResponse.json({ error: 'Failed to update member' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string; memberId: string }> }
) {
  const { slug, memberId } = await params
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const workspace = await prisma.workspace.findUnique({
      where: { slug },
      include: { members: true }
    })

    if (!workspace) return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })

    const currentUserMember = workspace.members.find(m => m.userId === user.id)
    if (!currentUserMember || (currentUserMember.role !== 'owner' && currentUserMember.role !== 'admin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const targetMember = await prisma.workspaceMember.findUnique({
      where: { id: parseInt(memberId) }
    })

    if (!targetMember) return NextResponse.json({ error: 'Member not found' }, { status: 404 })
    if (targetMember.role === 'owner') return NextResponse.json({ error: 'Cannot remove owner' }, { status: 400 })

    await prisma.workspaceMember.delete({
      where: { id: parseInt(memberId) }
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('[MEMBER_DELETE] Error:', error)
    return NextResponse.json({ error: 'Failed to remove member' }, { status: 500 })
  }
}

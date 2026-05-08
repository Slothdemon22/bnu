import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string; inviteId: string }> }
) {
  const { slug, inviteId } = await params
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

    await prisma.workspaceInvite.delete({
      where: { id: parseInt(inviteId) }
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('[INVITE_DELETE] Error:', error)
    return NextResponse.json({ error: 'Failed to revoke invite' }, { status: 500 })
  }
}

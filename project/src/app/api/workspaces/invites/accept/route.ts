import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser, hashPassword, setAuthCookie } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const { token } = await req.json()
  if (!token) return NextResponse.json({ error: 'Token is required' }, { status: 400 })

  try {
    const invite = await prisma.workspaceInvite.findUnique({
      where: { token },
      include: { workspace: true }
    })

    if (!invite) return NextResponse.json({ error: 'Invalid invitation' }, { status: 404 })
    if (invite.acceptedAt) return NextResponse.json({ error: 'Invitation already used' }, { status: 400 })
    if (new Date() > invite.expiresAt) return NextResponse.json({ error: 'Invitation expired' }, { status: 400 })

    const sessionUser = await getCurrentUser()
    if (sessionUser && sessionUser.email.toLowerCase() !== invite.email.toLowerCase()) {
      return NextResponse.json(
        { error: `This invite is for ${invite.email}. Please log out and open the invite link again.` },
        { status: 409 }
      )
    }

    let actingUser = sessionUser
    if (!actingUser) {
      const existingUser = await prisma.user.findUnique({
        where: { email: invite.email }
      })

      if (existingUser) {
        actingUser = {
          id: existingUser.id,
          email: existingUser.email,
          name: existingUser.name,
          role: existingUser.role ?? 'user',
        }
      } else {
        const tempPassword = Math.random().toString(36).slice(-12) + Date.now().toString(36)
        const hashedPassword = await hashPassword(tempPassword)

        const createdUser = await prisma.user.create({
          data: {
            email: invite.email,
            password: hashedPassword,
            name: invite.email.split('@')[0] || null,
            role: 'user',
          }
        })

        actingUser = {
          id: createdUser.id,
          email: createdUser.email,
          name: createdUser.name,
          role: createdUser.role ?? 'user',
        }
      }

      await setAuthCookie({
        id: actingUser.id,
        email: actingUser.email,
        name: actingUser.name,
        role: actingUser.role ?? 'user',
      })
    }

    if (!actingUser) {
      return NextResponse.json({ error: 'Failed to resolve invited user' }, { status: 500 })
    }

    const resolvedUser = await prisma.user.findUnique({
      where: { id: actingUser.id },
      select: { onboardingCompleted: true }
    })
    const onboardingCompleted = !!resolvedUser?.onboardingCompleted

    // Check if already a member
    const existingMember = await prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId: actingUser.id,
          workspaceId: invite.workspaceId
        }
      }
    })

    if (existingMember) {
      // If already a member, just mark invite as used and redirect
      await prisma.workspaceInvite.update({
        where: { id: invite.id },
        data: { acceptedAt: new Date() }
      })
      
      return NextResponse.json({ 
        message: 'You are already a member of this workspace',
        workspaceSlug: invite.workspace.slug,
        onboardingCompleted,
      })
    }

    // Use transaction to accept invite and create membership
    await prisma.$transaction([
      prisma.workspaceMember.create({
        data: {
          userId: actingUser.id,
          workspaceId: invite.workspaceId,
          role: invite.role,
          department: invite.department,
          jobTitle: invite.jobTitle
        }
      }),
      prisma.workspaceInvite.update({
        where: { id: invite.id },
        data: { acceptedAt: new Date() }
      })
    ])

    // Real-time Notification for the inviter
    try {
      const { notifyUser } = await import('@/lib/activity')
      await notifyUser({
        userId: invite.invitedById,
        title: 'Invitation Accepted',
        message: `${actingUser.name || actingUser.email} has joined ${invite.workspace.name}.`,
        type: 'invite_accepted',
        entityType: 'workspace',
        entityId: invite.workspaceId
      })
    } catch (notiErr) {
      console.error('[NOTI_ERR] Failed to send notification:', notiErr)
    }

    return NextResponse.json({ 
      message: 'Joined workspace successfully',
      workspaceSlug: invite.workspace.slug,
      onboardingCompleted,
    })
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Already a member' }, { status: 400 })
    }
    console.error('[ACCEPT_INVITE] Unexpected Error:', error)
    return NextResponse.json({ error: 'Failed to join workspace' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const token = searchParams.get('token')

  if (!token) return NextResponse.json({ error: 'Token is required' }, { status: 400 })

  const invite = await prisma.workspaceInvite.findUnique({
    where: { token },
    select: {
      email: true,
      role: true,
      workspace: {
        select: {
          name: true,
          slug: true
        }
      },
      acceptedAt: true,
      expiresAt: true
    }
  })

  if (!invite) return NextResponse.json({ error: 'Invalid invitation' }, { status: 404 })
  
  return NextResponse.json({ invite })
}

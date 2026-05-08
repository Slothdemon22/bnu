import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Resend } from 'resend'
import crypto from 'crypto'

const resend = new Resend(process.env.RESEND_SECRET_KEY)

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Find workspace by slug to get real ID
  console.log('[INVITE_API] Received invite request for slug:', slug)
  const workspace = await prisma.workspace.findUnique({
    where: { slug }
  })

  if (!workspace) {
    console.error('[INVITE_API] Workspace not found for slug:', slug)
    return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })
  }

  const workspaceId = workspace.id
  console.log('[INVITE_API] Found workspace:', { id: workspaceId, name: workspace.name })

  // Check if user is owner/admin of this workspace
  const membership = await prisma.workspaceMember.findUnique({
    where: {
      userId_workspaceId: {
        userId: user.id,
        workspaceId: workspaceId
      }
    }
  })

  if (!membership || !['owner', 'admin'].includes(membership.role)) {
    console.warn('[INVITE_API] Unauthorized invite attempt by user:', user.id, 'for workspace:', workspaceId)
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { email, role, department, jobTitle } = await req.json()
  console.log('[INVITE_API] Invite data payload:', { email, role, department, jobTitle })

  if (!email) {
    console.error('[INVITE_API] Missing email in payload')
    return NextResponse.json({ error: 'Email is required' }, { status: 400 })
  }

  const token = crypto.randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

  try {
    const invite = await prisma.workspaceInvite.create({
      data: {
        email,
        role: role || 'member',
        department,
        jobTitle,
        token,
        workspaceId,
        invitedById: user.id,
        expiresAt
      },
      include: {
        workspace: true
      }
    })
    console.log('[INVITE_API] DB Record created successfully:', invite.id)

    // Real-time Notification if user already exists
    try {
      const existingUser = await prisma.user.findUnique({ where: { email } })
      if (existingUser) {
        const { notifyUser } = await import('@/lib/activity')
        await notifyUser({
          userId: existingUser.id,
          title: 'New Workspace Invitation',
          message: `${user.name || user.email} has invited you to join ${invite.workspace.name}.`,
          type: 'workspace_invite',
          entityType: 'workspace',
          entityId: workspaceId
        })
      }
    } catch (err) {
      console.error('[NOTI_ERR] Failed to notify existing user:', err)
    }

    const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/invite?token=${token}`

    console.log('[INVITE_API] Attempting to send email via Resend to:', email)
    const resendResponse = await resend.emails.send({
      from: 'FlowSync <onboarding@zalnex.me>',
      to: email,
      subject: `You've been invited to join ${invite.workspace.name} on FlowSync`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; rounded: 12px;">
          <h1 style="color: #059669; font-size: 24px; font-weight: 800; margin-bottom: 16px;">Welcome to the Team!</h1>
            ${user.name || user.email} has invited you to join the <strong>${invite.workspace.name}</strong> workspace on FlowSync as a <strong>${invite.role}</strong>.
          </p>
          <div style="margin: 32px 0;">
            <a href="${inviteUrl}" style="background-color: #059669; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">
              Join Workspace
            </a>
          </div>
          <p style="color: #9ca3af; font-size: 12px;">
            This invitation expires in 7 days. If you weren't expecting this invitation, you can safely ignore this email.
          </p>
        </div>
      `
    })

    console.log('[INVITE_API] Resend API Response:', JSON.stringify(resendResponse, null, 2))

    if (resendResponse.error) {
      throw new Error(`Resend Error: ${resendResponse.error.message}`)
    }

    return NextResponse.json({ message: 'Invite sent successfully', resend: resendResponse })
  } catch (error: any) {
    console.error('[INVITE_API] Critical Error:', error)
    return NextResponse.json({ error: error.message || 'Failed to send invite' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { notifyUser } from '@/lib/activity'

const PRODUCTION_APP_URL = 'https://bnu-one.vercel.app'

export async function POST(
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
    
    if (!workspaceMember || (workspaceMember.role !== 'admin' && workspaceMember.role !== 'owner')) {
      return NextResponse.json({ error: 'Only admins can schedule meetings' }, { status: 403 })
    }

    const task = await prisma.task.findUnique({
      where: { id: parseInt(taskId) },
      include: { assignees: true }
    })

    if (!task) return NextResponse.json({ error: 'Task not found' }, { status: 404 })

    const body = await req.json()
    const { meetingTime } = body

    if (!process.env.MANAGEMENT_TOKEN || !process.env.TEMPLATE_ID) {
      return NextResponse.json({ error: '100ms Room creation not configured' }, { status: 500 })
    }

    // 1. Create Room via 100ms
    const roomName = `task-${task.id}-${Date.now()}`
    const roomRes = await fetch('https://api.100ms.live/v2/rooms', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.MANAGEMENT_TOKEN}`,
      },
      body: JSON.stringify({
        name: roomName,
        template_id: process.env.TEMPLATE_ID,
      }),
    })

    if (!roomRes.ok) {
      console.error('100ms API error:', await roomRes.text())
      return NextResponse.json({ error: 'Failed to create 100ms room' }, { status: 500 })
    }

    const roomData = await roomRes.json()
    const roomId = roomData.id || roomData.room_id

    // 2. Generate Room Code for Host Role (Optional but good for 100ms integration)
    let roomCode = null
    try {
      const codeRes = await fetch(`https://api.100ms.live/v2/room-codes/room/${roomId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.MANAGEMENT_TOKEN}`,
        },
        body: JSON.stringify({ role: "host" }),
      });
      if (codeRes.ok) {
        const codeData = await codeRes.json()
        roomCode = codeData.data?.[0]?.code || null
      }
    } catch (e) {
      console.error("Failed to generate room code", e)
    }

    const baseUrl =
      process.env.NODE_ENV === 'production'
        ? PRODUCTION_APP_URL
        : (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000')
    const roomUrl = `${baseUrl}/meeting?room=${roomId}`

    // 3. Update Task
    const updatedTask = await prisma.task.update({
      where: { id: task.id },
      data: {
        roomId: roomId.toString(),
        roomCode: roomCode?.toString() || null,
        roomUrl,
        meetingTime: meetingTime ? new Date(meetingTime) : new Date(),
      },
      include: { assignees: true }
    })

    // 4. Notify Assignees
    const { Resend } = await import('resend')
    let resend: any = null
    if (process.env.RESEND_SECRET_KEY) {
      resend = new Resend(process.env.RESEND_SECRET_KEY)
    }

    for (const assignee of task.assignees) {
      // In-app notification
      if (assignee.id !== user.id) {
        await notifyUser({
          userId: assignee.id,
          title: 'Task Meeting Scheduled 📹',
          message: `A video meeting has been scheduled for the task: ${task.title}. Join now!|||${roomUrl}`,
          type: 'meeting_scheduled',
          entityType: 'task',
          entityId: task.id
        })
      }

      // Email notification
      if (resend) {
        try {
          await resend.emails.send({
            from: process.env.RESEND_FROM_EMAIL || 'onboarding@zalnex.me',
            to: assignee.email,
            subject: `Meeting Scheduled: ${task.title}`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #10b981;">Video Meeting Scheduled</h2>
                <p>Hello ${assignee.name || assignee.email},</p>
                <p>A video meeting has been scheduled for your task: <strong>${task.title}</strong>.</p>
                ${meetingTime ? `<p>Scheduled for: <strong>${new Date(meetingTime).toLocaleString()}</strong></p>` : ''}
                <div style="margin: 30px 0;">
                  <a href="${roomUrl}" style="display: inline-block; padding: 14px 28px; background-color: #10b981; color: white; text-decoration: none; border-radius: 8px; font-weight: bold;">
                    Join Meeting Room
                  </a>
                </div>
                <p style="color: #6b7280; font-size: 14px;">
                  Or copy and paste this link: <br/> <a href="${roomUrl}">${roomUrl}</a>
                </p>
                <p style="margin-top: 24px; color: #6b7280; font-size: 12px;">
                  — Momentum Team
                </p>
              </div>
            `,
          })
        } catch (e) {
          console.error('Failed to send email to', assignee.email, e)
        }
      }
    }

    return NextResponse.json({ task: updatedTask })
  } catch (error: any) {
    console.error('[TASK_MEETING_POST] Error:', error)
    return NextResponse.json({ error: 'Failed to schedule meeting' }, { status: 500 })
  }
}

import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { google } from 'googleapis'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string; taskId: string }> }
) {
  try {
    const { slug, taskId } = await params;
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const dbUser = await prisma.user.findUnique({ where: { id: user.id } })
    if (!dbUser?.googleRefreshToken) {
      return NextResponse.json({ error: 'Google Calendar not connected', needsAuth: true }, { status: 403 })
    }

    const { date, startTime, endTime, timeZone } = await request.json()
    if (!date || !startTime || !endTime) {
      return NextResponse.json({ error: 'Date, start time, and end time are required' }, { status: 400 })
    }

    const task = await prisma.task.findUnique({
      where: { id: parseInt(taskId) },
      include: {
        workspace: true,
        assignees: true,
      }
    })

    if (!task) return NextResponse.json({ error: 'Task not found' }, { status: 404 })

    const protocol = request.headers.get('x-forwarded-proto') || (request.url.startsWith('https') ? 'https' : 'http')
    const host = request.headers.get('host') || 'localhost:3000'
    const redirectUri = `${protocol}://${host}/api/auth/google/calendar/callback`

    const oauth2Client = new google.auth.OAuth2(
      process.env['OAUTH-CLIENT_ID'] || process.env.OAUTH_CLIENT_ID,
      process.env.OAUTH_CLEINT_SECRET || process.env.OAUTH_CLIENT_SECRET,
      redirectUri
    )

    oauth2Client.setCredentials({
      refresh_token: dbUser.googleRefreshToken,
    })

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client })

    // Construct ISO string with timezone offset dynamically by not using server's local Date.
    // Google Calendar API accepts standard datetime string (YYYY-MM-DDTHH:mm:ss) + timeZone property
    // We can just pass the string as is and provide the timeZone string.
    
    const event = {
      summary: `📝 Task: ${task.title} (${task.workspace.name})`,
      description: `You have a scheduled task session.\n\n📌 Task: ${task.title}\n🏢 Workspace: ${task.workspace.name}\n\n📝 Details:\n${task.description || 'No additional details provided.'}\n${task.roomUrl ? `\n🎥 Meeting Room:\n${task.roomUrl}\n` : ''}\n---\nAutomated event created from your task board.`,
      start: {
        dateTime: `${date}T${startTime}:00`,
        timeZone: timeZone || 'UTC',
      },
      end: {
        dateTime: `${date}T${endTime}:00`,
        timeZone: timeZone || 'UTC',
      },
      attendees: task.assignees.map(a => ({ email: a.email })),
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 },
          { method: 'popup', minutes: 10 },
        ],
      },
    }

    console.log('Sending event to Google Calendar:', JSON.stringify(event, null, 2))

    const response = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: event,
      sendUpdates: 'all',
    })

    console.log('Google Calendar API response:', response.data)

    return NextResponse.json({ success: true, eventId: response.data.id, eventUrl: response.data.htmlLink })
  } catch (error: any) {
    console.error('Google Calendar error:', error)
    if (error.response?.data?.error === 'invalid_grant' || error.message?.includes('invalid_grant')) {
      // Refresh token expired or revoked
      return NextResponse.json({ error: 'Google Calendar access revoked or expired', needsAuth: true }, { status: 403 })
    }
    return NextResponse.json({ error: error.message || 'Failed to schedule calendar event' }, { status: 500 })
  }
}

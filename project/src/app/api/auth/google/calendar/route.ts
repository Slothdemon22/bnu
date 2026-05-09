import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'

import { google } from 'googleapis'

const PRODUCTION_APP_URL = 'https://bnu-one.vercel.app'

function getBaseAppUrl(request: Request) {
  if (process.env.NODE_ENV === 'production') {
    return PRODUCTION_APP_URL
  }
  const protocol = request.headers.get('x-forwarded-proto') || (request.url.startsWith('https') ? 'https' : 'http')
  const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || 'localhost:3000'
  return `${protocol}://${host}`
}

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const redirectUri = `${getBaseAppUrl(request)}/api/auth/google/calendar/callback`

    const oauth2Client = new google.auth.OAuth2(
      process.env.OAUTH_CLIENT_ID,
      process.env.OAUTH_CLEINT_SECRET || process.env.OAUTH_CLIENT_SECRET,
      redirectUri
    )

    const url = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: ['https://www.googleapis.com/auth/calendar.events'],
      prompt: 'consent',
      state: user.id.toString(), // pass user ID as state to identify them in callback
    })

    return NextResponse.redirect(url)
  } catch (error) {
    console.error('Failed to initiate Google OAuth:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

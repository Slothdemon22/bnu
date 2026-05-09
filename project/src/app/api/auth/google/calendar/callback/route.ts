import { NextResponse } from 'next/server'
import { google } from 'googleapis'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const userIdStr = url.searchParams.get('state')

  if (!code || !userIdStr) {
    return NextResponse.json({ error: 'Missing code or state' }, { status: 400 })
  }

  const userId = parseInt(userIdStr)

  try {
    const protocol = request.headers.get('x-forwarded-proto') || (request.url.startsWith('https') ? 'https' : 'http')
    const host = request.headers.get('host') || 'localhost:3000'
    const redirectUri = `${protocol}://${host}/api/auth/google/calendar/callback`

    const oauth2Client = new google.auth.OAuth2(
      process.env.OAUTH_CLIENT_ID,
      process.env.OAUTH_CLEINT_SECRET || process.env.OAUTH_CLIENT_SECRET,
      redirectUri
    )

    const { tokens } = await oauth2Client.getToken(code)
    
    if (tokens.refresh_token) {
      await prisma.user.update({
        where: { id: userId },
        data: { googleRefreshToken: tokens.refresh_token },
      })
    }

    // Redirect to the referring page or a generic success page
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/profile?tab=integrations&success=true`)
  } catch (error) {
    console.error('Failed to handle Google OAuth callback:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

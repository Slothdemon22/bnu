import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'

export async function POST(request: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { text } = await request.json()
    if (!text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 })
    }

    const apiKey = process.env.API_KEY || ''
    if (!apiKey) {
      return NextResponse.json({ error: 'Missing API key configuration' }, { status: 500 })
    }

    const response = await fetch('https://api.groq.com/openai/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'canopylabs/orpheus-v1-english',
        input: text,
        voice: 'austin',
        response_format: 'wav'
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      let errorPayload: any = null
      try {
        errorPayload = JSON.parse(errorText)
      } catch {
        errorPayload = null
      }

      const errorCode = errorPayload?.error?.code
      const errorMessage = errorPayload?.error?.message || 'Failed to generate speech'

      // Known non-fatal case: this model requires terms acceptance on Groq.
      // Frontend falls back to browser speech synthesis; avoid noisy server error logs.
      if (errorCode === 'model_terms_required') {
        return NextResponse.json(
          {
            error: errorMessage,
            code: errorCode,
            fallback: 'browser_tts',
          },
          { status: 412 }
        )
      }

      // Known non-fatal case: request text exceeds Groq model limit.
      if (errorMessage.toLowerCase().includes('less than 4000 characters')) {
        return NextResponse.json(
          {
            error: errorMessage,
            code: 'input_too_long',
            fallback: 'browser_tts',
          },
          { status: 413 }
        )
      }

      console.error('Groq TTS Error:', errorText)
      return NextResponse.json({ error: errorMessage }, { status: 500 })
    }

    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'audio/wav',
        'Content-Length': buffer.length.toString()
      }
    })
  } catch (error) {
    console.error('TTS Proxy Error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

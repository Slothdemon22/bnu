import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'

export async function POST(request: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const formData = await request.formData()
    const file = formData.get('file') as Blob

    if (!file) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 })
    }

    const apiKey = process.env.API_KEY || ''

    // Create new FormData for Groq API
    const groqFormData = new FormData()
    groqFormData.append('file', file, 'audio.webm')
    groqFormData.append('model', 'whisper-large-v3')

    const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`
      },
      body: groqFormData
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Groq STT Error:', errorText)
      return NextResponse.json({ error: 'Failed to transcribe audio' }, { status: 500 })
    }

    const data = await response.json()
    
    return NextResponse.json({ text: data.text })
  } catch (error) {
    console.error('STT Proxy Error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

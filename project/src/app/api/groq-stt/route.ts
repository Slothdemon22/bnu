import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'

export async function POST(request: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const formData = await request.formData()
    const fileEntry = formData.get('file')

    if (!(fileEntry instanceof Blob)) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 })
    }

    const apiKey = process.env.API_KEY || ''
    if (!apiKey) {
      return NextResponse.json({ error: 'Missing API key configuration' }, { status: 500 })
    }

    const file = fileEntry instanceof File
      ? fileEntry
      : new File([fileEntry], `audio-${Date.now()}.webm`, { type: fileEntry.type || 'audio/webm' })

    const modelsToTry = ['whisper-large-v3-turbo', 'whisper-large-v3']
    let lastError = 'Failed to transcribe audio'

    for (const model of modelsToTry) {
      const groqFormData = new FormData()
      groqFormData.append('file', file, file.name || 'audio.webm')
      groqFormData.append('model', model)

      const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`
        },
        body: groqFormData
      })

      if (response.ok) {
        const data = await response.json()
        return NextResponse.json({ text: data.text || '' })
      }

      const errorText = await response.text()
      lastError = `Model ${model}: ${errorText}`
      console.error('Groq STT Error:', lastError)
    }

    return NextResponse.json({ error: lastError }, { status: 500 })
  } catch (error) {
    console.error('STT Proxy Error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

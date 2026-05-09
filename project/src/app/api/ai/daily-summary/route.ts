import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { tasks } = await req.json()

    if (!tasks || tasks.length === 0) {
      return NextResponse.json({ summary: "You have no tasks scheduled for today. Enjoy your day or explore new missions!" })
    }

    const taskDescriptions = tasks.map((t: any) => `- [${t.workspace.name}] ${t.title} (${t.status})`).join('\n')

    const prompt = `
You are an elite AI executive assistant for Momentum, a premium gamified productivity platform.
The user "${user.name}" has the following tasks scheduled for today across their workspaces:
${taskDescriptions}

Your goal is to provide a highly expressive, premium, and engaging daily briefing. 
Do not be generic. Be punchy, sophisticated, and motivating. 
Highlight their specific tasks with flair, and remind them that completing these missions will earn them valuable XP and elevate their Rank.
Keep it to a concise but impactful 2-3 sentences. Do not use markdown formatting like bolding or bullet points.
`

    const apiKey = process.env.API_KEY || ''

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 150,
      })
    })

    if (!response.ok) {
      console.error('Groq JSON Error:', await response.text())
      return NextResponse.json({ error: 'Failed to generate summary' }, { status: 500 })
    }

    const data = await response.json()
    const summary = data.choices[0]?.message?.content || "Ready to tackle the day? Let's get to work!"

    return NextResponse.json({ summary: summary.trim() })
  } catch (error) {
    console.error('Error generating AI summary:', error)
    return NextResponse.json({ error: 'Failed to generate summary' }, { status: 500 })
  }
}

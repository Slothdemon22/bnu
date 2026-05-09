import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'

export async function POST(request: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { transcript } = await request.json()
    if (!transcript) {
      return NextResponse.json({ error: 'Transcript is required' }, { status: 400 })
    }

    const apiKey = process.env.API_KEY || ''

    const currentDate = new Date().toISOString().split('T')[0]
    const systemPrompt = `You are an AI that extracts task information from raw voice transcripts.
Today is ${currentDate}.
Output ONLY a valid JSON object matching this schema. If a value is not mentioned, omit it or use default. Do not include markdown code block syntax like \`\`\`json.
{
  "title": string,
  "description": string,
  "priority": "low" | "medium" | "high" | "urgent",
  "dueDate": string (YYYY-MM-DD),
  "tags": [string],
  "milestones": [
    {
      "name": string,
      "description": string,
      "estimatedTime": string (YYYY-MM-DD),
      "difficulty": "easy" | "medium" | "hard" | "expert",
      "notes": string
    }
  ]
}
Note: 
1. Assign "difficulty" based on the complexity of the milestone. 
2. Determine a reasonable "estimatedTime" (completion date) for each milestone based on today's date (${currentDate}) and the difficulty. For example, easy milestones might be due in 1-2 days, expert ones in 1-2 weeks. Ensure they are sequential and before the task "dueDate".`

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: transcript }
        ],
        temperature: 0.1,
        response_format: { type: 'json_object' }
      })
    })

    if (!response.ok) {
      console.error('Groq JSON Error:', await response.text())
      return NextResponse.json({ error: 'Failed to parse' }, { status: 500 })
    }

    const data = await response.json()
    const resultJson = JSON.parse(data.choices[0].message.content)

    return NextResponse.json({ parsed: resultJson })
  } catch (error) {
    console.error('Parse Proxy Error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

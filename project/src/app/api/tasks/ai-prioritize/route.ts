import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { tasks } = await request.json()
    if (!tasks || !Array.isArray(tasks)) {
      return NextResponse.json({ error: 'Tasks array is required' }, { status: 400 })
    }

    const apiKey = process.env.API_KEY || ''

    // Format tasks for AI
    const taskDetails = tasks.map((t: any) => ({
      id: t.id,
      title: t.title,
      description: t.description,
      currentPriority: t.priority
    }))

    const prompt = `You are an AI task manager. I will provide a list of tasks in JSON format. 
You need to analyze their titles and descriptions and determine their true priority (low, medium, or high).
Tasks that sound urgent, critical, or block other things should be high.
Return a raw JSON array of objects, each containing "id" and "newPriority" (must be strictly "low", "medium", or "high").
Do NOT wrap the JSON in markdown blocks. Return ONLY the JSON array.

Tasks:
${JSON.stringify(taskDetails, null, 2)}`

    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1,
      })
    })

    if (!groqResponse.ok) {
      console.error('Groq error:', await groqResponse.text())
      return NextResponse.json({ error: 'AI failed to process tasks' }, { status: 500 })
    }

    const data = await groqResponse.json()
    let reply = data.choices[0].message.content.trim()
    
    // Strip markdown if AI included it anyway
    if (reply.startsWith('```json')) reply = reply.replace(/```json/g, '').replace(/```/g, '').trim()
    if (reply.startsWith('```')) reply = reply.replace(/```/g, '').trim()

    let priorities = JSON.parse(reply)
    
    // Update tasks in DB
    const updatePromises = priorities.map((p: any) => {
      if (['low', 'medium', 'high'].includes(p.newPriority)) {
        return prisma.task.update({
          where: { id: p.id },
          data: { priority: p.newPriority }
        }).catch(() => null)
      }
      return Promise.resolve(null)
    })

    await Promise.all(updatePromises)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('AI Prioritize Error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

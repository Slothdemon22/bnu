import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

async function safeQuery<T>(query: Promise<T>, fallback: T, label: string): Promise<T> {
  try {
    return await query
  } catch (error) {
    console.error(`[AI_CHAT] ${label} query failed:`, error)
    return fallback
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { messages } = await request.json()
    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Messages are required' }, { status: 400 })
    }

    const workspace = await prisma.workspace.findUnique({
      where: { slug }
    })

    if (!workspace) return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })

    // Fetch context with safe fallbacks (prevents ETIMEDOUT from breaking chat)
    const [allWorkspaceTasks, allMembers, recentGlobalActivity] = await Promise.all([
      safeQuery(
        prisma.task.findMany({
          where: { workspaceId: workspace.id },
          orderBy: { updatedAt: 'desc' },
          take: 150,
          include: {
            assignees: { select: { name: true, email: true, id: true } },
            createdBy: { select: { name: true } },
            milestones: {
              select: {
                name: true,
                status: true,
                estimatedTime: true,
                description: true,
              }
            }
          }
        }),
        [],
        'workspace-tasks'
      ),
      safeQuery(
        prisma.workspaceMember.findMany({
          where: { workspaceId: workspace.id },
          include: { user: { select: { id: true, name: true, email: true } } }
        }),
        [],
        'workspace-members'
      ),
      safeQuery(
        prisma.activityLog.findMany({
          orderBy: { createdAt: 'desc' },
          take: 10
        }),
        [],
        'global-activity'
      )
    ])

    let baseContext = `\n### Comprehensive Workspace State:\n`
    baseContext += `**Members**:\n`
    if (allMembers.length > 0) {
      allMembers.forEach(m => {
        baseContext += `- ${m.user.name || m.user.email} (Role: ${m.role})\n`
      })
    }
    
    baseContext += `\n**All Workspace Tasks**:\n`
    if (allWorkspaceTasks.length > 0) {
      allWorkspaceTasks.forEach(t => {
        const assigns = t.assignees.map(a => a.name || a.email).join(', ') || 'Unassigned'
        baseContext += `- ID #${t.id}: "${t.title}" | Status: ${t.status} | Priority: ${t.priority} | Assignees: ${assigns} | Created By: ${t.createdBy?.name || 'Unknown'}\n`
        
        if (t.roomUrl || t.meetingTime) {
          baseContext += `  - Schedule/Meeting: ${t.meetingTime ? new Date(t.meetingTime).toLocaleString() : 'Anytime'} (Room: ${t.roomUrl || 'None'})\n`
        }
        
        if (t.milestones && t.milestones.length > 0) {
          baseContext += `  - Phases/Milestones:\n`
          t.milestones.forEach(m => {
            baseContext += `    * ${m.name} | Status: ${m.status} | Est. Time: ${m.estimatedTime || 'N/A'} | Desc: ${m.description || 'None'}\n`
          })
        }
      })
    } else {
      baseContext += `[SYSTEM NOTE: There are currently no tasks in this workspace. Do not invent any.]\n`
    }

    // Parse all mentions from the user's latest message to provide context
    const latestMessage = messages[messages.length - 1].content
    const taskMentionRegex = /\[@task:(\d+)\]/g
    const memberMentionRegex = /\[@member:([^\]]+)\]/g

    const taskIds = [...latestMessage.matchAll(taskMentionRegex)].map(m => parseInt(m[1]))
    const memberIds = [...latestMessage.matchAll(memberMentionRegex)].map(m => parseInt(m[1]))

    let contextText = baseContext

    if (taskIds.length > 0) {
      const tasks = await safeQuery(
        prisma.task.findMany({
          where: { id: { in: taskIds }, workspaceId: workspace.id },
          include: { assignees: true }
        }),
        [],
        'mentioned-tasks'
      )
      if (tasks.length > 0) {
        contextText += `\n\n### Task Context (User explicitly mentioned these tasks):\n`
        tasks.forEach(t => {
          contextText += `- Task: "${t.title}" (Status: ${t.status}, Priority: ${t.priority})\n  Description: ${t.description || 'N/A'}\n  Assignees: ${t.assignees.map(a => a.name || a.email).join(', ') || 'None'}\n`
        })
      }
    }

    if (memberIds.length > 0) {
      const members = await safeQuery(
        prisma.workspaceMember.findMany({
          where: { id: { in: memberIds }, workspaceId: workspace.id },
          include: { user: true }
        }),
        [],
        'mentioned-members'
      )
      if (members.length > 0) {
        contextText += `\n\n### Member Context (User explicitly mentioned these members):\n`
        for (const m of members) {
          contextText += `- Member: ${m.user.name || m.user.email} (Role: ${m.role})\n`
          
          const memberTasks = await safeQuery(
            prisma.task.findMany({
              where: { workspaceId: workspace.id, assignees: { some: { id: m.user.id } } },
              select: { title: true, status: true, updatedAt: true },
              take: 25,
              orderBy: { updatedAt: 'desc' },
            }),
            [],
            `member-tasks-${m.user.id}`
          )
          if (memberTasks.length > 0) {
            contextText += `  - Assigned Tasks:\n`
            memberTasks.forEach(t => {
              contextText += `    - ${t.title} (Status: ${t.status}, Last Updated: ${t.updatedAt.toISOString()})\n`
            })
          }

          const recentActivity = await safeQuery(
            prisma.activityLog.findMany({
              where: { userId: m.user.id },
              orderBy: { createdAt: 'desc' },
              take: 5
            }),
            [],
            `member-activity-${m.user.id}`
          )
          if (recentActivity.length > 0) {
            contextText += `  - Recent Activity History:\n`
            recentActivity.forEach(a => {
              contextText += `    - Action: ${a.action} on ${a.entityType || 'unknown'} (Date: ${a.createdAt.toISOString()})\n`
            })
          }
        }
      }
    }

    // Prepare Groq payload
    const systemMessage = {
      role: 'system',
      content: `You are a professional AI productivity assistant for a workspace called "${workspace.name}".
Your goal is to help users manage tasks, optimize workflows, and coordinate with team members.

FORMATTING RULES:
1. ALWAYS use clean, structured Markdown.
2. Use headings (##, ###) to organize different sections if the response is long.
3. Use bold text (**text**) to highlight key names, statuses, or priorities.
4. Use bullet points or numbered lists when listing items, tasks, or options.
5. Keep your responses concise but highly readable. Avoid giant walls of text.
6. CRITICAL: DO NOT hallucinate, invent, or make up ANY dummy data (e.g., "Marketing Campaign", "Brock", etc.). 
7. If the context says the user has no tasks, inform them they have no tasks. Base your entire answer ONLY on the provided context!

CONTEXT:
If the user specifically mentions tasks or members in their message, their live database details are injected below for you to reference.
${contextText}`
    }

    // Clean mentions from user message so the AI just sees normal text if they included it, or we can just send it as is since it's formatting.
    const groqMessages = [
      systemMessage,
      ...messages.map((m: any) => ({
        role: m.role,
        content: m.content
      }))
    ]

    const apiKey = process.env.API_KEY || ''

    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: groqMessages,
        temperature: 0.7,
      })
    })

    if (!groqResponse.ok) {
      const errorData = await groqResponse.json()
      console.error('Groq API Error:', errorData)
      return NextResponse.json({ error: 'Failed to communicate with AI' }, { status: 500 })
    }

    const data = await groqResponse.json()
    const reply = data.choices[0].message.content

    return NextResponse.json({ reply })
  } catch (error) {
    console.error('AI Chat Error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser, setAuthCookie } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const tokenUser = await getCurrentUser()

  if (!tokenUser) {
    return NextResponse.json({ user: null }, { status: 401 })
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: tokenUser.id },
    select: { 
      id: true, email: true, name: true, role: true, imageUrl: true, 
      onboardingCompleted: true, profession: true, workspaceName: true,
      teamSize: true, primaryGoal: true
    },
  })

  if (!dbUser) {
    return NextResponse.json({ user: null }, { status: 401 })
  }

  return NextResponse.json({
    user: {
      id: dbUser.id,
      email: dbUser.email,
      name: dbUser.name,
      role: dbUser.role ?? 'user',
      imageUrl: dbUser.imageUrl ?? null,
      onboardingCompleted: !!dbUser.onboardingCompleted,
      profession: dbUser.profession,
      workspaceName: dbUser.workspaceName,
      teamSize: dbUser.teamSize,
      primaryGoal: dbUser.primaryGoal,
    },
  })
}

export async function PATCH(req: NextRequest) {
  const tokenUser = await getCurrentUser()
  if (!tokenUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json().catch(() => ({}))
  const { name, imageUrl, onboardingCompleted, profession, workspaceName, teamSize, primaryGoal, workspaceImageUrl } = body

  const data: { 
    name?: string | null; 
    imageUrl?: string | null;
    onboardingCompleted?: boolean;
    profession?: string | null;
    workspaceName?: string | null;
    teamSize?: string | null;
    primaryGoal?: string | null;
  } = {}
  
  if (typeof name === 'string') data.name = name.trim() || undefined
  if (imageUrl !== undefined) data.imageUrl = imageUrl === null || imageUrl === '' ? null : String(imageUrl)
  if (typeof onboardingCompleted === 'boolean') data.onboardingCompleted = onboardingCompleted
  if (typeof profession === 'string') data.profession = profession.trim() || null
  if (typeof workspaceName === 'string') data.workspaceName = workspaceName.trim() || null
  if (typeof teamSize === 'string') data.teamSize = teamSize.trim() || null
  if (typeof primaryGoal === 'string') data.primaryGoal = primaryGoal.trim() || null

  if (Object.keys(data).length === 0 && !workspaceImageUrl) {
    return NextResponse.json(
      { error: 'Provide fields to update' },
      { status: 400 }
    )
  }

  // If completing onboarding, create default workspace if not exists
  if (onboardingCompleted === true) {
    const existingWorkspaces = await prisma.workspaceMember.count({
      where: { userId: tokenUser.id }
    })

    if (existingWorkspaces === 0) {
      const wsName = workspaceName || `${tokenUser.name || 'My'}'s Workspace`
      const slug = wsName.toLowerCase().replace(/ /g, '-').replace(/[^\w-]/g, '') + '-' + Math.random().toString(36).substring(2, 5)
      
      await prisma.workspace.create({
        data: {
          name: wsName,
          slug,
          imageUrl: workspaceImageUrl,
          members: {
            create: {
              userId: tokenUser.id,
              role: 'owner'
            }
          }
        }
      })
    }
  }

  const updated = await prisma.user.update({
    where: { id: tokenUser.id },
    data,
    select: { 
      id: true, email: true, name: true, role: true, imageUrl: true, 
      onboardingCompleted: true, profession: true, workspaceName: true,
      teamSize: true, primaryGoal: true
    },
  })

  await setAuthCookie({
    id: updated.id,
    email: updated.email,
    name: updated.name ?? undefined,
    role: updated.role ?? 'user',
  })

  return NextResponse.json({
    user: {
      id: updated.id,
      email: updated.email,
      name: updated.name,
      role: updated.role ?? 'user',
      imageUrl: updated.imageUrl ?? null,
      onboardingCompleted: !!updated.onboardingCompleted,
      profession: updated.profession,
      workspaceName: updated.workspaceName,
      teamSize: updated.teamSize,
      primaryGoal: updated.primaryGoal,
    },
  })
}


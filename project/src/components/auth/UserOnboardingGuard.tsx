'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'

export function UserOnboardingGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!loading && user) {
      if (!user.onboardingCompleted && pathname !== '/onboarding' && !pathname.startsWith('/api')) {
        router.push('/onboarding')
      }
    }
  }, [user, loading, pathname, router])

  // Prevent flash of content for users who need onboarding
  if (loading) {
    return null // or a loading spinner
  }

  if (user && !user.onboardingCompleted && pathname !== '/onboarding' && !pathname.startsWith('/api')) {
    return null
  }

  return <>{children}</>
}

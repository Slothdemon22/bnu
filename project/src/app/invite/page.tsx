'use client'

import React, { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  Users, 
  Briefcase, 
  Zap,
  ArrowRight
} from 'lucide-react'
import toast from 'react-hot-toast'
import Link from 'next/link'

export default function InvitePage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [invite, setInvite] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [accepting, setAccepting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const token = searchParams.get('token')

  useEffect(() => {
    if (!token) {
      setError('Missing invitation token')
      setLoading(false)
      return
    }

    fetch(`/api/workspaces/invites/accept?token=${token}`)
      .then(res => res.json())
      .then(data => {
        if (data.error) setError(data.error)
        else setInvite(data.invite)
        setLoading(false)
      })
      .catch(() => {
        setError('Failed to load invitation')
        setLoading(false)
      })
  }, [token])

  const handleAccept = async () => {
    if (!user) {
      // Redirect to login but save the current URL to come back
      router.push(`/login?callbackUrl=${encodeURIComponent(window.location.href)}`)
      return
    }

    setAccepting(true)
    try {
      const res = await fetch('/api/workspaces/invites/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      })
      const data = await res.json()

      if (data.error) throw new Error(data.error)

      toast.success('Welcome to the workspace!')
      router.push(`/workspaces/${data.workspaceSlug}`)
    } catch (err: any) {
      toast.error(err.message || 'Failed to join workspace')
      setAccepting(false)
    }
  }

  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50 dark:bg-gray-950 p-4">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-emerald-500 animate-spin" />
          <p className="font-bold text-stone-500 animate-pulse">Verifying Invitation...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50 dark:bg-gray-950 p-4">
        <div className="max-w-md w-full bg-white dark:bg-gray-900 border border-stone-200 dark:border-gray-800 rounded-[2.5rem] p-10 text-center shadow-2xl">
          <div className="w-20 h-20 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 mx-auto mb-6">
            <XCircle className="w-10 h-10" />
          </div>
          <h1 className="text-3xl font-black text-stone-900 dark:text-white mb-4">Invalid Invitation</h1>
          <p className="text-stone-500 dark:text-gray-400 mb-8 font-medium">{error}</p>
          <Link 
            href="/"
            className="block w-full py-4 bg-stone-900 dark:bg-white text-white dark:text-stone-900 rounded-2xl font-bold transition-all hover:scale-105 active:scale-95"
          >
            Return to Homepage
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50 dark:bg-gray-950 p-4">
      <div className="max-w-md w-full relative">
        <div className="absolute -top-24 -left-24 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl" />
        
        <div className="relative z-10 bg-white dark:bg-gray-900 border border-stone-200 dark:border-gray-800 rounded-[2.5rem] p-10 shadow-2xl">
          <div className="flex justify-center mb-8">
            <div className="relative">
              <div className="w-24 h-24 rounded-[2rem] bg-emerald-600 flex items-center justify-center text-white shadow-xl shadow-emerald-500/20 transform -rotate-6">
                <Briefcase className="w-12 h-12" />
              </div>
              <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-stone-900 dark:bg-white text-white dark:text-stone-900 flex items-center justify-center shadow-lg transform rotate-12">
                <Users className="w-6 h-6" />
              </div>
            </div>
          </div>

          <div className="text-center space-y-4 mb-10">
            <h1 className="text-4xl font-black text-stone-900 dark:text-white tracking-tight">
              You're <span className="text-emerald-500">Invited!</span>
            </h1>
            <p className="text-stone-500 dark:text-gray-400 font-medium">
              Join <span className="font-bold text-stone-900 dark:text-white">{invite.workspace.name}</span> as a <span className="font-bold text-emerald-500">{invite.role}</span>.
            </p>
          </div>

          <div className="bg-stone-50 dark:bg-gray-800/50 rounded-3xl p-6 mb-10 border border-stone-100 dark:border-gray-700/50">
            <div className="flex items-center gap-4 mb-4 pb-4 border-b border-stone-200 dark:border-gray-700">
              <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 font-bold">
                {invite.workspace.name[0]}
              </div>
              <div>
                <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest leading-none mb-1">Workspace</p>
                <p className="text-sm font-bold text-stone-900 dark:text-white">{invite.workspace.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-stone-200 dark:bg-gray-700 flex items-center justify-center text-stone-600 dark:text-gray-300">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest leading-none mb-1">Role</p>
                <p className="text-sm font-bold text-stone-900 dark:text-white capitalize">{invite.role}</p>
              </div>
            </div>
          </div>

          <button
            onClick={handleAccept}
            disabled={accepting}
            className="w-full py-5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-70 text-white rounded-[1.5rem] font-black text-xl shadow-xl shadow-emerald-500/20 transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-3"
          >
            {accepting ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <>
                {user ? 'Accept & Join Workspace' : 'Sign in to Join'}
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
          
          <p className="mt-6 text-center text-[10px] font-black text-stone-400 uppercase tracking-widest">
            Logged in as: <span className="text-stone-600 dark:text-stone-300">{user?.email || 'Guest'}</span>
          </p>
        </div>
      </div>
    </div>
  )
}

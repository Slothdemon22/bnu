'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { 
  Users, 
  Target, 
  MessageSquare, 
  Zap, 
  ArrowRight,
  TrendingUp,
  Clock,
  LayoutDashboard,
  Plus,
  Loader2
} from 'lucide-react'
import Link from 'next/link'
import { InviteUserModal } from '@/components/dashboard/InviteUserModal'
import gsap from 'gsap'

export default function WorkspaceDetailPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const [showInviteModal, setShowInviteModal] = useState(searchParams.get('invite') === 'true')
  const [workspace, setWorkspace] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const slug = params.slug as string

  useEffect(() => {
    const fetchWorkspace = async () => {
      try {
        const res = await fetch(`/api/workspaces/${slug}`)
        const data = await res.json()
        if (data.workspace) setWorkspace(data.workspace)
      } catch (err) {
        console.error('Error fetching workspace:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchWorkspace()

    // Real-time refresh
    const { createPusherClient } = require('@/lib/pusher/client')
    const pusher = createPusherClient()
    if (pusher) {
      const chatChannel = pusher.subscribe(`workspace-chat-${slug}`)
      const notiChannel = pusher.subscribe(`user-notifications-${user?.id}`)
      
      const handler = () => fetchWorkspace()
      chatChannel.bind('new-message', handler)
      notiChannel.bind('new-notification', handler)

      return () => {
        pusher.unsubscribe(`workspace-chat-${slug}`)
        pusher.unsubscribe(`user-notifications-${user?.id}`)
      }
    }
  }, [slug, user?.id || 'anonymous'])

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo('.stat-card', 
        { 
          opacity: 0, 
          y: 20 
        },
        {
          opacity: 1,
          y: 0,
          stagger: 0.1,
          duration: 0.8,
          ease: 'power3.out',
          clearProps: 'all'
        }
      )
    })
    return () => ctx.revert()
  }, [loading])

  if (loading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center gap-6">
        <div className="relative">
          <Loader2 className="w-16 h-16 text-emerald-500 animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Zap className="w-6 h-6 text-emerald-500 animate-pulse" />
          </div>
        </div>
        <div className="text-center space-y-2">
          <h2 className="text-xl font-black text-stone-900 dark:text-white uppercase tracking-tighter">Syncing Command Center</h2>
          <p className="text-xs font-bold text-stone-400 uppercase tracking-[0.3em] animate-pulse">Initializing Environment...</p>
        </div>
      </div>
    )
  }

  const stats = [
    { label: 'Active Tasks', value: workspace?.taskCount || '0', icon: <Target className="w-5 h-5" />, color: 'bg-emerald-500' },
    { label: 'Team Members', value: workspace?.memberCount || '0', icon: <Users className="w-5 h-5" />, color: 'bg-blue-500' },
    { label: 'Recent Messages', value: workspace?.activity?.filter((a: any) => a.type === 'chat').length || '0', icon: <MessageSquare className="w-5 h-5" />, color: 'bg-orange-500' },
    { label: 'Productivity', value: '+12%', icon: <TrendingUp className="w-5 h-5" />, color: 'bg-purple-500' },
  ]

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="flex items-start gap-6">
          <div className="w-20 h-20 rounded-[2rem] bg-emerald-600 flex items-center justify-center text-white text-4xl font-black shadow-2xl shadow-emerald-500/20 overflow-hidden shrink-0 border-4 border-white dark:border-gray-800">
            {workspace?.imageUrl ? (
              <img src={workspace.imageUrl} alt={workspace.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              workspace?.name?.[0].toUpperCase() || slug[0].toUpperCase()
            )}
          </div>
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="px-3 py-1 rounded-full bg-emerald-500 text-emerald-950 text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20">
                Live Workspace
              </div>
            </div>
            <h1 className="text-5xl font-black text-stone-900 dark:text-white tracking-tighter capitalize">
              {workspace?.name || slug.replace(/-/g, ' ')}
            </h1>
            <p className="text-stone-500 dark:text-gray-400 mt-2 font-medium">
              Welcome back to your team command center.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowInviteModal(true)}
            className="flex items-center gap-2 px-6 py-4 bg-emerald-600 text-white rounded-2xl font-black transition-all hover:scale-105 active:scale-95 shadow-xl shadow-emerald-500/20"
          >
            <Users className="w-5 h-5" />
            Invite Members
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="stat-card bg-white dark:bg-gray-900 border border-stone-100 dark:border-gray-800 p-6 rounded-[2rem] shadow-sm hover:shadow-xl transition-all border-b-4 border-b-transparent hover:border-b-emerald-500 group">
            <div className={`w-12 h-12 rounded-2xl ${stat.color} flex items-center justify-center text-white mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
              {stat.icon}
            </div>
            <p className="text-xs font-black text-stone-400 uppercase tracking-widest">{stat.label}</p>
            <p className="text-3xl font-black text-stone-900 dark:text-white mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-black text-stone-900 dark:text-white flex items-center gap-3">
              <Clock className="w-6 h-6 text-emerald-500" /> Recent Activity
            </h2>
          </div>
          <div className="space-y-4">
            {workspace?.activity?.length > 0 ? workspace.activity.map((act: any) => (
              <div key={act.id} className="flex items-center gap-4 p-5 bg-white dark:bg-gray-900 border border-stone-100 dark:border-gray-800 rounded-3xl hover:border-emerald-500/50 transition-all group">
                <div className="w-10 h-10 rounded-xl overflow-hidden bg-stone-100 dark:bg-gray-800 flex items-center justify-center font-bold text-xs shrink-0">
                  {act.userImage ? (
                    <img src={act.userImage} alt={act.user} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    act.user[0].toUpperCase()
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-stone-900 dark:text-white truncate">
                    {act.user} <span className="text-stone-400 font-medium">{act.content}</span>
                  </p>
                  <p className="text-xs text-stone-400 font-medium">
                    {new Date(act.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <ArrowRight className="w-5 h-5 text-stone-300 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
              </div>
            )) : (
              <div className="py-20 text-center bg-stone-50 dark:bg-gray-900/50 rounded-[3rem] border-2 border-dashed border-stone-100 dark:border-gray-800">
                <p className="text-stone-400 font-bold uppercase tracking-widest text-xs">No Recent Activity</p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <h2 className="text-2xl font-black text-stone-900 dark:text-white flex items-center gap-3">
            <Zap className="w-6 h-6 text-orange-500" /> Quick Launch
          </h2>
          <div className="grid gap-4">
            <button className="w-full p-6 bg-stone-900 dark:bg-white text-white dark:text-stone-900 rounded-[2rem] font-bold text-left hover:scale-[1.02] transition-transform shadow-xl shadow-stone-900/10 flex items-center justify-between group">
              <div>
                <p className="text-[10px] uppercase tracking-widest opacity-60">Meeting</p>
                <p className="text-lg">Start Video Sync</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-white/10 dark:bg-black/10 flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                <ArrowRight className="w-5 h-5" />
              </div>
            </button>
            <Link href={`/workspaces/${slug}/tasks`} className="w-full p-6 bg-emerald-600 text-white rounded-[2rem] font-bold text-left hover:scale-[1.02] transition-transform shadow-xl shadow-emerald-900/10 flex items-center justify-between group">
              <div>
                <p className="text-[10px] uppercase tracking-widest opacity-60">Board</p>
                <p className="text-lg">Open Kanban</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white group-hover:text-emerald-600 transition-colors">
                <ArrowRight className="w-5 h-5" />
              </div>
            </Link>
          </div>
        </div>
      </div>

      {showInviteModal && workspace && (
        <InviteUserModal 
          workspaceSlug={slug}
          workspaceName={workspace.name}
          onClose={() => setShowInviteModal(false)}
        />
      )}
    </div>
  )
}

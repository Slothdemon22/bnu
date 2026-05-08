'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname, useParams } from 'next/navigation'
import { 
  LayoutDashboard, 
  CheckSquare, 
  MessageSquare, 
  Video, 
  Settings, 
  Users, 
  Briefcase,
  ChevronLeft,
  ChevronRight,
  Plus,
  Search,
  Bell,
  PieChart,
  Target,
  UserPlus,
  FileText,
  Sparkles
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

export function WorkspaceSidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const pathname = usePathname()
  const params = useParams()
  const { user } = useAuth()
  const [workspace, setWorkspace] = useState<any>(null)
  const [activeMeeting, setActiveMeeting] = useState<any>(null)
  
  const workspaceSlug = params.slug as string || 'default'

  React.useEffect(() => {
    const fetchWorkspace = () => {
      if (params.slug) {
        fetch(`/api/workspaces/${params.slug}`)
          .then(res => res.json())
          .then(data => {
            if (data.workspace) setWorkspace(data.workspace)
          })
          .catch(err => console.error('Error fetching workspace for sidebar:', err))
      }
    }

    fetchWorkspace()

    // Real-time updates
    const { createPusherClient } = require('@/lib/pusher/client')
    const pusher = createPusherClient()
    if (pusher && params.slug) {
      const channel = pusher.subscribe(`workspace-${params.slug}`)
      channel.bind('workspace-updated', (data: { workspace: any }) => {
        setWorkspace(data.workspace)
      })
      return () => {
        pusher.unsubscribe(`workspace-${params.slug}`)
      }
    }
  }, [params.slug])

  React.useEffect(() => {
    if (!params.slug || !user) return
    const checkMeetings = async () => {
      try {
        const res = await fetch(`/api/workspaces/${params.slug}/tasks`)
        const data = await res.json()
        if (data.tasks) {
          const meetingTask = data.tasks.find((t: any) => 
            t.roomUrl && 
            t.assignees?.some((a: any) => a.id === user.id)
          )
          if (meetingTask) {
            setActiveMeeting({
              title: meetingTask.title,
              roomUrl: meetingTask.roomUrl
            })
          }
        }
      } catch (err) {
        console.error('Failed to check meetings:', err)
      }
    }
    checkMeetings()
  }, [params.slug, user])

  const isAdmin = workspace?.role === 'owner' || workspace?.role === 'admin'

  const menuItems = [
    { name: 'Workspace Home', href: `/workspaces/${workspaceSlug}`, icon: LayoutDashboard },
    { name: 'Tasks List', href: `/workspaces/${workspaceSlug}/tasks-list`, icon: CheckSquare },
    { name: 'Task Management', href: `/workspaces/${workspaceSlug}/tasks`, icon: Target },
    { name: 'Team Messaging', href: `/workspaces/${workspaceSlug}/chat`, icon: MessageSquare },
    { name: 'Analytics', href: `/workspaces/${workspaceSlug}/analytics`, icon: PieChart },
    { name: 'Reports', href: `/workspaces/${workspaceSlug}/reports`, icon: FileText },
  ]

  const actionItems = [
    { name: 'Invite Member', href: `/workspaces/${workspaceSlug}/members?invite=true`, icon: UserPlus, highlight: true },
    { name: 'Workspace Settings', href: `/workspaces/${workspaceSlug}/settings`, icon: Settings },
  ]

  return (
    <aside 
      className={`relative h-screen bg-white dark:bg-gray-950 border-r border-stone-200 dark:border-gray-800 transition-all duration-300 ease-in-out flex flex-col z-40 ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand / Logo */}
      <div className="p-6 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-emerald-500/20">
          <Briefcase className="w-5 h-5 text-white" />
        </div>
        {!isCollapsed && (
          <span className="font-bold text-xl tracking-tight text-stone-900 dark:text-white uppercase tracking-tighter">
            FlowSync
          </span>
        )}
      </div>

      {/* Active Workspace Info */}
      <div className="px-4 mb-6">
        <div className={`p-2 rounded-xl bg-stone-100 dark:bg-gray-900 border border-stone-200 dark:border-gray-800 flex items-center gap-3 ${isCollapsed ? 'justify-center' : ''}`}>
          <div className="w-10 h-10 rounded-xl bg-stone-900 dark:bg-white text-white dark:text-stone-900 flex items-center justify-center font-bold text-sm flex-shrink-0 shadow-lg overflow-hidden border border-stone-200 dark:border-gray-800">
            {workspace?.imageUrl ? (
              <img src={workspace.imageUrl} alt={workspace.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              workspace?.name?.[0]?.toUpperCase() || 'W'
            )}
          </div>
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Workspace</p>
              <p className="text-sm font-black text-stone-900 dark:text-white truncate">{workspace?.name || 'Loading...'}</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
        {!isCollapsed && (
          <p className="px-3 pb-3 text-[10px] font-black text-stone-400 dark:text-gray-600 uppercase tracking-[0.3em]">
            Operations
          </p>
        )}
        {menuItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all group ${
                isActive 
                  ? 'bg-emerald-600 text-white font-black shadow-lg shadow-emerald-500/20' 
                  : 'text-stone-600 dark:text-gray-400 hover:bg-stone-100 dark:hover:bg-gray-900'
              }`}
            >
              <item.icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-white' : 'group-hover:text-stone-900 dark:group-hover:text-white'}`} />
              {!isCollapsed && (
                <span className="text-sm font-bold uppercase tracking-tight">{item.name}</span>
              )}
            </Link>
          )
        })}

        {isAdmin && (
          <div className="pt-8">
            {!isCollapsed && (
              <p className="px-3 pb-3 text-[10px] font-black text-stone-400 dark:text-gray-600 uppercase tracking-[0.3em]">
                Administration
              </p>
            )}
            {actionItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all group ${
                    isActive 
                      ? 'bg-emerald-600 text-white font-black shadow-lg shadow-emerald-500/20' 
                      : item.highlight
                        ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 font-bold'
                        : 'text-stone-600 dark:text-gray-400 hover:bg-stone-100 dark:hover:bg-gray-900'
                  }`}
                >
                  <item.icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-white' : 'group-hover:text-stone-900 dark:group-hover:text-white'}`} />
                  {!isCollapsed && (
                    <span className="text-sm font-bold uppercase tracking-tight">{item.name}</span>
                  )}
                </Link>
              )
            })}
          </div>
        )}
      </nav>

      {/* Back to Global Nav */}
      <div className="p-4 border-t border-stone-100 dark:border-gray-900">
        <Link
          href="/workspaces"
          className="flex items-center gap-3 px-3 py-3 rounded-xl text-stone-500 dark:text-gray-500 hover:text-stone-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-gray-900 transition-all group"
        >
          <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          {!isCollapsed && <span className="text-sm font-bold uppercase tracking-tight">Exit Workspace</span>}
        </Link>
      </div>

      {/* Collapse Toggle */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-white dark:bg-gray-800 border border-stone-200 dark:border-gray-700 flex items-center justify-center shadow-md hover:scale-110 transition-transform z-50 text-stone-400"
      >
        {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>

      {/* Active Meeting Reminder */}
      {activeMeeting && (
        <div className={`fixed bottom-6 ${isCollapsed ? 'left-24' : 'left-72'} z-[100] bg-stone-900 dark:bg-gray-950 border border-emerald-500/50 shadow-2xl shadow-emerald-500/20 p-4 rounded-3xl w-64 animate-in slide-in-from-bottom-8 duration-500`}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-500 flex items-center justify-center animate-pulse shrink-0 border border-emerald-500/30">
              <Video className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[9px] font-black text-emerald-500 uppercase tracking-[0.2em] leading-none mb-1">Active Meeting</p>
              <p className="text-xs font-bold text-white truncate">{activeMeeting.title}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setActiveMeeting(null)}
              className="px-3 py-2.5 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors"
            >
              Skip
            </button>
            <a 
              href={activeMeeting.roomUrl}
              target="_blank"
              onClick={() => setActiveMeeting(null)}
              className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
            >
              Join Now
            </a>
          </div>
        </div>
      )}
    </aside>
  )
}

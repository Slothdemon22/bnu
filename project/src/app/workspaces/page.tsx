'use client'

import React, { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { 
  Plus, 
  Briefcase, 
  Settings, 
  ExternalLink, 
  Users,
  Search,
  ArrowRight,
  Loader2,
  Building
} from 'lucide-react'
import Link from 'next/link'
import gsap from 'gsap'

interface Workspace {
  id: number
  name: string
  slug: string
  role: string
  memberCount: number
  imageUrl?: string | null
  useCase?: string | null
}

import { WorkspaceCreateModal } from '@/components/dashboard/WorkspaceCreateModal'

export default function WorkspacesPage() {
  const { user } = useAuth()
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)

  const fetchWorkspaces = async () => {
    try {
      console.log('Fetching workspaces for user:', user?.id)
      const res = await fetch('/api/workspaces')
      const data = await res.json()
      console.log('Workspaces API Response:', data)
      if (data.workspaces) setWorkspaces(data.workspaces)
      setLoading(false)
    } catch (err) {
      console.error('Fetch Workspaces Error:', err)
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user) {
      fetchWorkspaces()
    }
  }, [user])

  useEffect(() => {
    if (!loading && workspaces.length > 0) {
      const ctx = gsap.context(() => {
        gsap.fromTo('.workspace-card', 
          { 
            opacity: 0, 
            y: 30 
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
    }
  }, [loading, workspaces.length])

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-stone-900 dark:text-white tracking-tight">
            Your <span className="text-emerald-500">Workspaces</span>
          </h1>
          <p className="text-stone-600 dark:text-gray-400 mt-2 font-medium">
            Manage and switch between your team environments.
          </p>
        </div>
        <button 
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-6 py-3 bg-stone-900 dark:bg-white text-white dark:text-stone-900 rounded-2xl font-bold transition-transform hover:scale-105 active:scale-95 shadow-xl"
        >
          <Plus className="w-5 h-5" />
          Create New Workspace
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
        <input 
          type="text" 
          placeholder="Search workspaces..." 
          className="w-full pl-12 pr-6 py-4 rounded-2xl border-2 border-stone-200 dark:border-gray-800 bg-white dark:bg-gray-900 focus:border-emerald-500 outline-none transition-all font-medium"
        />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2].map((i) => (
            <div key={i} className="h-64 rounded-[2.5rem] bg-stone-200 dark:bg-gray-900 animate-pulse" />
          ))}
        </div>
      ) : workspaces.length === 0 ? (
        <div className="py-20 text-center space-y-6 bg-white dark:bg-gray-900 rounded-[3rem] border-2 border-dashed border-stone-100 dark:border-gray-800">
          <div className="w-20 h-20 rounded-full bg-stone-50 dark:bg-gray-800 flex items-center justify-center mx-auto text-stone-300">
            <Building className="w-10 h-10" />
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-black text-stone-900 dark:text-white">No workspaces found</h3>
            <p className="text-stone-500 dark:text-gray-400 max-w-xs mx-auto">Create your first workspace to start collaborating with your team.</p>
          </div>
          <button 
            onClick={() => setShowCreateModal(true)}
            className="px-8 py-4 bg-emerald-600 text-white rounded-2xl font-black shadow-lg shadow-emerald-500/20 hover:scale-105 active:scale-95 transition-all"
          >
            Create Workspace
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {workspaces.map((ws) => (
            <div 
              key={ws.id}
              className="workspace-card group relative bg-white dark:bg-gray-950 border border-stone-200 dark:border-gray-800 rounded-[2.5rem] p-8 transition-all hover:shadow-2xl hover:shadow-emerald-500/10 hover:-translate-y-1"
            >
              <div className="flex items-start justify-between mb-8">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 overflow-hidden ${!ws.imageUrl ? 'bg-emerald-600' : 'bg-transparent'}`}>
                  {ws.imageUrl ? (
                    <img src={ws.imageUrl} alt={ws.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl font-black uppercase">{ws.name[0]}</span>
                  )}
                </div>
                <span className="px-3 py-1 rounded-full bg-stone-100 dark:bg-gray-800 text-[10px] font-bold uppercase tracking-widest text-stone-500">
                  {ws.role}
                </span>
              </div>
              
              <div className="space-y-1 mb-8">
                <h3 className="text-2xl font-bold text-stone-900 dark:text-white group-hover:text-emerald-500 transition-colors truncate">
                  {ws.name}
                </h3>
                <div className="flex flex-col gap-1">
                  <p className="text-stone-500 dark:text-gray-400 text-xs font-bold flex items-center gap-2">
                    <Users className="w-3 h-3" />
                    {ws.memberCount} {ws.memberCount === 1 ? 'member' : 'members'}
                  </p>
                  {ws.useCase && (
                    <p className="text-[10px] text-emerald-600 dark:text-emerald-500 font-black uppercase tracking-widest">{ws.useCase}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 pt-6 border-t border-stone-100 dark:border-gray-800">
                <Link 
                  href={`/workspaces/${ws.slug}`}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-emerald-600 text-white rounded-xl font-bold transition-all hover:bg-emerald-700 active:scale-95 shadow-lg shadow-emerald-500/10"
                >
                  Enter <ArrowRight className="w-4 h-4" />
                </Link>
                <button className="p-3 rounded-xl bg-stone-100 dark:bg-gray-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-gray-700 transition-all">
                  <Settings className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreateModal && (
        <WorkspaceCreateModal 
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false)
            fetchWorkspaces()
          }}
        />
      )}
    </div>
  )
}

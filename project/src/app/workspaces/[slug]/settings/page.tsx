'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { 
  Settings, 
  Target, 
  Users, 
  Shield, 
  Bell, 
  Trash2, 
  Save,
  Plus,
  Layout,
  CheckCircle2,
  Clock,
  ChevronRight,
  Loader2
} from 'lucide-react'
import { TaskCreateModal } from '@/components/tasks/TaskCreateModal'
import toast from 'react-hot-toast'

type SettingTab = 'general' | 'members' | 'notifications'

export default function WorkspaceSettingsPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const slug = params.slug as string
  const [activeTab, setActiveTab] = useState<SettingTab>((searchParams.get('tab') as SettingTab) || 'general')
  const [workspace, setWorkspace] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [workspaceName, setWorkspaceName] = useState('')
  const [updatingLogo, setUpdatingLogo] = useState(false)
  const [updatingName, setUpdatingName] = useState(false)

  useEffect(() => {
    fetchWorkspace()
  }, [slug])

  const fetchWorkspace = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/workspaces/${slug}`)
      const data = await res.json()
      if (data.workspace) {
        setWorkspace(data.workspace)
        setWorkspaceName(data.workspace.name)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteWorkspace = async () => {
    if (confirm('Are you absolutely sure you want to delete this workspace? All data including tasks and messages will be permanently lost.')) {
      try {
        const res = await fetch(`/api/workspaces/${slug}`, { method: 'DELETE' })
        if (res.ok) {
          toast.success('Workspace deleted successfully')
          window.location.href = '/workspaces'
        } else {
          const d = await res.json()
          toast.error(d.error || 'Failed to delete workspace')
        }
      } catch (err) {
        toast.error('An error occurred')
      }
    }
  }

  const isAdmin = workspace?.role === 'owner' || workspace?.role === 'admin'

  if (loading) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
      <Loader2 className="w-12 h-12 text-emerald-500 animate-spin" />
      <p className="font-black text-stone-400 uppercase tracking-widest animate-pulse">Syncing Environment...</p>
    </div>
  )

  if (!isAdmin) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-6 p-8 text-center">
        <div className="w-20 h-20 bg-red-50 dark:bg-red-950/20 rounded-full flex items-center justify-center">
          <Shield className="w-10 h-10 text-red-500" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-black text-stone-900 dark:text-white uppercase tracking-tighter">ACCESS DENIED</h2>
          <p className="text-stone-500 max-w-sm mx-auto font-medium">You do not have administrative privileges to modify this workspace's configurations.</p>
        </div>
        <button 
          onClick={() => window.location.href = `/workspaces/${slug}`}
          className="px-8 py-3 bg-stone-900 dark:bg-white text-white dark:text-stone-900 rounded-xl font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all"
        >
          Return to Dashboard
        </button>
      </div>
    )
  }

  const sidebarItems = [
    { id: 'general', name: 'General', icon: Settings },
    { id: 'members', name: 'Team Members', icon: Users },
    { id: 'notifications', name: 'Notifications', icon: Bell },
  ]

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-8">
      <div className="mb-10">
        <h1 className="text-4xl font-black text-stone-900 dark:text-white tracking-tighter uppercase">Workspace Settings</h1>
        <p className="text-stone-500 font-medium font-mono text-sm uppercase opacity-60">Control Center / {activeTab}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Settings Sidebar */}
        <div className="lg:col-span-1 space-y-2">
          {sidebarItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as SettingTab)}
              className={`w-full flex items-center gap-3 px-5 py-4 rounded-2xl font-bold transition-all ${
                activeTab === item.id 
                  ? 'bg-stone-900 dark:bg-white text-white dark:text-stone-900 shadow-xl scale-[1.02]' 
                  : 'text-stone-500 hover:bg-stone-100 dark:hover:bg-gray-900'
              }`}
            >
              <item.icon className="w-5 h-5" />
              {item.name}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="lg:col-span-3 bg-white dark:bg-gray-950 rounded-[2.5rem] border border-stone-100 dark:border-gray-800 p-8 shadow-sm">
          {activeTab === 'general' && (
            <div className="space-y-8 animate-in fade-in duration-500">
              <div className="space-y-2">
                <h2 className="text-2xl font-black text-stone-900 dark:text-white uppercase tracking-tight">General Configuration</h2>
                <p className="text-sm text-stone-500">Basic details about your workspace.</p>
              </div>
              
              <div className="space-y-6">
                {/* Logo Management */}
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Workspace Identity</label>
                  <div className="flex items-center gap-8 p-6 bg-stone-50 dark:bg-gray-900 rounded-3xl border border-stone-100 dark:border-gray-800">
                    <div className="w-24 h-24 rounded-[2rem] bg-white dark:bg-gray-950 border-2 border-dashed border-stone-200 dark:border-gray-800 flex items-center justify-center overflow-hidden shrink-0 shadow-inner relative group/logo">
                      {workspace?.imageUrl ? (
                        <img src={workspace.imageUrl} alt="Logo" className="w-full h-full object-cover" />
                      ) : (
                        <Target className="w-8 h-8 text-stone-200" />
                      )}
                      {updatingLogo && (
                        <div className="absolute inset-0 bg-white/60 dark:bg-black/60 flex items-center justify-center">
                          <Loader2 className="w-6 h-6 text-emerald-500 animate-spin" />
                        </div>
                      )}
                    </div>
                    <div className="space-y-3">
                      <p className="text-sm font-bold text-stone-900 dark:text-white">Workspace Logo</p>
                      <div className="flex items-center gap-3">
                        <input 
                          type="file" 
                          id="workspace-logo-upload"
                          className="hidden" 
                          accept="image/*"
                          onChange={async (e) => {
                            const file = e.target.files?.[0]
                            if (!file) return
                            setUpdatingLogo(true)
                            const toastId = toast.loading('Uploading logo...')
                            try {
                              const { supabase } = await import('@/lib/supabase')
                              const fileExt = file.name.split('.').pop()
                              const fileName = `${slug}-${Math.random()}.${fileExt}`
                              const filePath = `workspace-logos/${fileName}`
                              const { error } = await supabase.storage.from('takra-bucket').upload(filePath, file)
                              if (error) throw error
                              const { data } = supabase.storage.from('takra-bucket').getPublicUrl(filePath)
                              
                              const res = await fetch(`/api/workspaces/${slug}`, {
                                method: 'PATCH',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ imageUrl: data.publicUrl })
                              })
                              if (!res.ok) throw new Error('Failed to update workspace logo')
                              
                              toast.success('Logo updated successfully!', { id: toastId })
                              setWorkspace((prev: any) => ({ ...prev, imageUrl: data.publicUrl }))
                            } catch (err: any) {
                              toast.error(err.message || 'Upload failed', { id: toastId })
                            } finally {
                              setUpdatingLogo(false)
                            }
                          }}
                        />
                        <button 
                          disabled={updatingLogo}
                          onClick={() => document.getElementById('workspace-logo-upload')?.click()}
                          className="px-5 py-2.5 bg-stone-900 dark:bg-white text-white dark:text-stone-900 rounded-xl font-bold text-xs hover:scale-105 active:scale-95 transition-all shadow-lg disabled:opacity-50"
                        >
                          Change Logo
                        </button>
                        {workspace?.imageUrl && (
                          <button 
                            disabled={updatingLogo}
                            onClick={async () => {
                              setUpdatingLogo(true)
                              const toastId = toast.loading('Removing logo...')
                              try {
                                const res = await fetch(`/api/workspaces/${slug}`, {
                                  method: 'PATCH',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ imageUrl: null })
                                })
                                if (!res.ok) throw new Error('Failed to remove logo')
                                toast.success('Logo removed', { id: toastId })
                                setWorkspace((prev: any) => ({ ...prev, imageUrl: null }))
                              } catch (err: any) {
                                toast.error(err.message, { id: toastId })
                              } finally {
                                setUpdatingLogo(false)
                              }
                            }}
                            className="px-5 py-2.5 border border-stone-200 dark:border-gray-800 rounded-xl font-bold text-xs hover:bg-stone-50 dark:hover:bg-gray-800 transition-all disabled:opacity-50"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                      <p className="text-[10px] text-stone-400 font-bold">Square images (PNG/JPG) work best.</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Workspace Name</label>
                  <input 
                    value={workspaceName}
                    onChange={(e) => setWorkspaceName(e.target.value)}
                    placeholder="Workspace Name"
                    className="w-full px-5 py-3 rounded-xl border border-stone-200 dark:border-gray-800 bg-stone-50 dark:bg-gray-900 outline-none focus:border-emerald-500 transition-all font-bold"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Workspace Slug</label>
                  <input 
                    disabled
                    value={workspace?.slug}
                    className="w-full px-5 py-3 rounded-xl border border-stone-200 dark:border-gray-800 bg-stone-100 dark:bg-gray-800 outline-none font-bold text-stone-400 cursor-not-allowed"
                  />
                </div>
                <button 
                  disabled={updatingName || workspaceName === workspace?.name}
                  onClick={async () => {
                    setUpdatingName(true)
                    const toastId = toast.loading('Updating workspace...')
                    try {
                      const res = await fetch(`/api/workspaces/${slug}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ name: workspaceName })
                      })
                      if (!res.ok) throw new Error('Failed to update workspace')
                      toast.success('Workspace updated!', { id: toastId })
                      setWorkspace((prev: any) => ({ ...prev, name: workspaceName }))
                    } catch (err: any) {
                      toast.error(err.message, { id: toastId })
                    } finally {
                      setUpdatingName(false)
                    }
                  }}
                  className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-500/20 group disabled:opacity-50"
                >
                  {updatingName ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 group-hover:rotate-12 transition-transform" />}
                  Update Workspace
                </button>
              </div>

              <div className="pt-10 border-t border-stone-100 dark:border-gray-800">
                <h3 className="text-lg font-black text-red-600 uppercase tracking-tight">Danger Zone</h3>
                <p className="text-sm text-stone-500 mb-4">Deleting this workspace is permanent and cannot be undone.</p>
                {workspace?.role === 'owner' ? (
                  <button 
                    onClick={handleDeleteWorkspace}
                    className="flex items-center gap-2 px-6 py-3 border-2 border-red-100 text-red-600 rounded-xl font-bold hover:bg-red-50 transition-all active:scale-95"
                  >
                    <Trash2 className="w-4 h-4" /> Delete Workspace
                  </button>
                ) : (
                  <p className="text-xs font-bold text-stone-400 italic">Only the workspace owner can delete this environment.</p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'members' && (
            <div className="space-y-8 animate-in fade-in duration-500">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <h2 className="text-2xl font-black text-stone-900 dark:text-white uppercase tracking-tight">Access Control</h2>
                  <p className="text-sm text-stone-500">Manage team members and their permission levels.</p>
                </div>
                <button 
                  onClick={() => window.location.href = `/workspaces/${slug}/members?invite=true`}
                  className="flex items-center gap-2 px-5 py-3 bg-stone-900 dark:bg-white text-white dark:text-stone-900 rounded-xl font-bold hover:scale-105 active:scale-95 transition-all shadow-xl"
                >
                  <Plus className="w-4 h-4" /> Invite Member
                </button>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {workspace?.members?.map((member: any) => (
                  <div key={member.user.id} className="flex items-center justify-between p-6 bg-stone-50 dark:bg-gray-900 rounded-[2rem] border border-stone-100 dark:border-gray-800 group hover:border-emerald-500/30 transition-all">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-white dark:bg-gray-800 border border-stone-200 dark:border-gray-700 overflow-hidden flex items-center justify-center font-black text-stone-400 shadow-sm">
                        {member.user.imageUrl ? (
                          <img src={member.user.imageUrl} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          member.user.name?.[0] || member.user.email[0]
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-black text-stone-900 dark:text-white uppercase tracking-tight">
                          {member.user.name || member.user.email.split('@')[0]}
                          {member.user.id === workspace.createdById && (
                            <span className="ml-2 text-[8px] px-1.5 py-0.5 bg-emerald-100 text-emerald-600 rounded font-black align-middle">OWNER</span>
                          )}
                        </p>
                        <p className="text-[10px] font-bold text-stone-400">{member.user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Permission</p>
                        <p className={`text-xs font-black uppercase ${member.role === 'admin' ? 'text-emerald-500' : 'text-stone-600 dark:text-stone-300'}`}>
                          {member.role}
                        </p>
                      </div>
                      {workspace.role === 'owner' && member.user.id !== workspace.createdById && (
                        <button className="p-2 text-stone-300 hover:text-red-500 transition-all hover:rotate-90">
                          <MoreHorizontal className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-8 animate-in fade-in duration-500">
              <div className="space-y-2">
                <h2 className="text-2xl font-black text-stone-900 dark:text-white uppercase tracking-tight">Event Notifications</h2>
                <p className="text-sm text-stone-500">Configure how team members receive updates.</p>
              </div>
              <div className="py-20 flex flex-col items-center justify-center gap-4 bg-stone-50 dark:bg-gray-900 rounded-[2rem] border border-dashed border-stone-200 dark:border-gray-800">
                <Bell className="w-12 h-12 text-stone-200" />
                <p className="font-bold text-stone-400 italic">Notification preferences coming soon.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

import { MoreHorizontal } from 'lucide-react'

'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { 
  Users, 
  UserPlus, 
  Mail, 
  Shield, 
  Building, 
  MoreHorizontal,
  Search,
  CheckCircle2,
  Clock,
  Briefcase
} from 'lucide-react'
import { InviteUserModal } from '@/components/dashboard/InviteUserModal'
import { UserAvatar } from '@/components/chat/UserAvatar'
import gsap from 'gsap'
import toast from 'react-hot-toast'

export default function WorkspaceMembersPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const [showInviteModal, setShowInviteModal] = useState(searchParams.get('invite') === 'true')
  const slug = params.slug as string
  const [workspace, setWorkspace] = useState<any>(null)
  const [members, setMembers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [actionMenuId, setActionMenuId] = useState<string | null>(null)

  const handleUpdateRole = async (memberId: string, role: string) => {
    const isPending = memberId.startsWith('i-')
    if (isPending) return
    const id = parseInt(memberId.split('-')[1])
    const toastId = toast.loading('Updating role...')
    try {
      const res = await fetch(`/api/workspaces/${slug}/members/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role })
      })
      if (!res.ok) throw new Error('Failed to update')
      toast.success('Role updated', { id: toastId })
      setMembers(prev => prev.map(m => m.id === memberId ? { ...m, role } : m))
    } catch (err: any) {
      toast.error('Failed to update role', { id: toastId })
    }
  }

  const handleRemove = async (memberId: string) => {
    if (!confirm('Are you sure you want to remove this member?')) return
    const isPending = memberId.startsWith('i-')
    const id = parseInt(memberId.split('-')[1])
    const toastId = toast.loading('Removing...')
    try {
      const url = isPending 
        ? `/api/workspaces/${slug}/invites/${id}`
        : `/api/workspaces/${slug}/members/${id}`
      const res = await fetch(url, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to remove')
      toast.success('Removed successfully', { id: toastId })
      setMembers(prev => prev.filter(m => m.id !== memberId))
    } catch (err: any) {
      toast.error('Failed to remove', { id: toastId })
    }
  }

  useEffect(() => {
    const fetchWorkspace = async () => {
      try {
        const res = await fetch(`/api/workspaces/${slug}`)
        const data = await res.json()
        if (data.workspace) {
          setWorkspace(data.workspace)
          
          // Combine members and pending invites
          const activeMembers = data.workspace.members.map((m: any) => ({
            id: `m-${m.id}`,
            name: m.user.name || m.user.email.split('@')[0],
            email: m.user.email,
            role: m.role,
            department: m.department || 'General',
            jobTitle: m.jobTitle || 'Team Member',
            status: 'active',
            imageUrl: m.user.imageUrl
          }))

          const pendingInvites = data.workspace.invites.map((i: any) => ({
            id: `i-${i.id}`,
            name: 'Pending Invite',
            email: i.email,
            role: i.role,
            department: i.department || 'N/A',
            jobTitle: i.jobTitle || 'Pending',
            status: 'pending',
            imageUrl: null
          }))

          setMembers([...activeMembers, ...pendingInvites])
        }
        setLoading(false)
      } catch (err) {
        console.error('Error fetching workspace:', err)
        setLoading(false)
      }
    }
    fetchWorkspace()
  }, [slug])

  useEffect(() => {
    if (!loading && members.length > 0) {
      const ctx = gsap.context(() => {
        gsap.fromTo('.member-row', 
          { 
            opacity: 0, 
            x: -20 
          },
          { 
            opacity: 1, 
            x: 0, 
            stagger: 0.05, 
            duration: 0.6, 
            ease: 'power2.out',
            clearProps: 'all'
          }
        )
      })
      return () => ctx.revert()
    }
  }, [loading, members.length])

  if (loading && !workspace) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Users className="w-6 h-6 text-emerald-500 animate-pulse" />
          </div>
        </div>
        <div className="text-center space-y-2">
          <h2 className="text-xl font-black text-stone-900 dark:text-white uppercase tracking-tighter">Loading Directory</h2>
          <p className="text-xs font-bold text-stone-400 uppercase tracking-[0.3em] animate-pulse">Syncing Members...</p>
        </div>
      </div>
    )
  }

  const isAdmin = workspace?.role === 'owner' || workspace?.role === 'admin'

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-stone-900 dark:text-white tracking-tight">
            Team <span className="text-emerald-500">Members</span>
          </h1>
          <p className="text-stone-500 dark:text-gray-400 mt-2 font-medium">
            Manage collaborators for <span className="text-stone-900 dark:text-white font-bold">{workspace?.name || slug}</span>.
          </p>
        </div>
        {isAdmin && (
          <button 
            onClick={() => setShowInviteModal(true)}
            className="flex items-center gap-2 px-6 py-4 bg-emerald-600 text-white rounded-2xl font-black transition-all hover:scale-105 active:scale-95 shadow-xl shadow-emerald-500/20"
          >
            <UserPlus className="w-5 h-5" />
            Invite New Member
          </button>
        )}
      </div>

      <div className="bg-white dark:bg-gray-900 border border-stone-100 dark:border-gray-800 rounded-[2.5rem] overflow-hidden shadow-sm">
        <div className="p-6 border-b border-stone-100 dark:border-gray-800 bg-stone-50/50 dark:bg-gray-800/50 flex items-center justify-between">
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <input 
              type="text" 
              placeholder="Search members..." 
              className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-900 border-none rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 transition-all font-bold shadow-sm"
            />
          </div>
          <div className="flex items-center gap-6">
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest leading-none mb-1">Total Strength</span>
              <span className="text-lg font-black text-stone-900 dark:text-white leading-none">{members.length}</span>
            </div>
            <div className="w-px h-8 bg-stone-100 dark:border-gray-800" />
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Sort:</span>
              <select className="bg-transparent border-none text-xs font-bold text-stone-600 dark:text-stone-300 focus:ring-0 cursor-pointer">
                <option>Active First</option>
                <option>Role</option>
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-stone-100 dark:border-gray-800 text-[10px] font-black text-stone-400 uppercase tracking-[0.2em]">
                <th className="px-8 py-5">Member</th>
                <th className="px-8 py-5">Role & Dept</th>
                <th className="px-8 py-5">Status</th>
                <th className="px-8 py-5 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [1, 2, 3].map(i => (
                  <tr key={i} className="animate-pulse border-b border-stone-50 dark:border-gray-800/50">
                    <td colSpan={4} className="px-8 py-8 h-20 bg-stone-50/30 dark:bg-gray-800/20" />
                  </tr>
                ))
              ) : members.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-8 py-20 text-center text-stone-400 font-bold italic">
                    No members found in this workspace yet.
                  </td>
                </tr>
              ) : (
                members.map((member) => (
                  <tr key={member.id} className="member-row group border-b border-stone-50 dark:border-gray-800/50 hover:bg-emerald-50/30 dark:hover:bg-emerald-900/5 transition-colors">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <UserAvatar 
                          userId={member.status === 'active' ? parseInt(member.id.split('-')[1]) : 0}
                          name={member.name}
                          email={member.email}
                          imageUrl={member.imageUrl}
                          size="lg"
                          showTooltip={true}
                        />
                        <div>
                          <p className="font-black text-stone-900 dark:text-white">{member.name}</p>
                          <p className="text-xs text-stone-400 font-medium">{member.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          <Shield className="w-3 h-3 text-emerald-500" />
                          <span className="text-sm font-black text-stone-900 dark:text-white capitalize">{member.role}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-stone-400">
                          <Building className="w-3 h-3" />
                          <span className="text-[10px] font-bold uppercase tracking-widest truncate max-w-[150px]">{member.department} • {member.jobTitle}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                        member.status === 'active' ? 'bg-emerald-100 text-emerald-600' : 'bg-orange-100 text-orange-600'
                      }`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${member.status === 'active' ? 'bg-emerald-500' : 'bg-orange-500'} ${member.status === 'pending' ? 'animate-pulse' : ''}`} />
                        {member.status}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-right relative">
                      {isAdmin && member.role !== 'owner' && (
                        <div className="relative">
                          <button 
                            onClick={() => setActionMenuId(actionMenuId === member.id ? null : member.id)}
                            className="p-2 rounded-xl hover:bg-white dark:hover:bg-gray-800 transition-colors shadow-sm border border-transparent hover:border-stone-200 dark:hover:border-gray-700 text-stone-400 hover:text-stone-600"
                          >
                            <MoreHorizontal className="w-5 h-5" />
                          </button>
                          {actionMenuId === member.id && (
                            <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-gray-900 border border-stone-200 dark:border-gray-800 rounded-xl shadow-xl z-50 py-2">
                              {!member.id.startsWith('i-') && (
                                <>
                                  {member.role !== 'admin' && (
                                    <button onClick={() => { handleUpdateRole(member.id, 'admin'); setActionMenuId(null); }} className="w-full text-left px-4 py-2 text-sm font-bold text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-gray-800">
                                      Make Admin
                                    </button>
                                  )}
                                  {member.role === 'admin' && (
                                    <button onClick={() => { handleUpdateRole(member.id, 'member'); setActionMenuId(null); }} className="w-full text-left px-4 py-2 text-sm font-bold text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-gray-800">
                                      Make Member
                                    </button>
                                  )}
                                </>
                              )}
                              <button onClick={() => { handleRemove(member.id); setActionMenuId(null); }} className="w-full text-left px-4 py-2 text-sm font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20">
                                {member.id.startsWith('i-') ? 'Revoke Invite' : 'Remove from Workspace'}
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isAdmin && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-8 bg-stone-900 text-white rounded-[2.5rem] shadow-xl shadow-stone-900/20 flex flex-col justify-between">
            <div>
              <h3 className="text-2xl font-black mb-2 flex items-center gap-3">
                <UserPlus className="text-emerald-500" /> Quick Invite
              </h3>
              <p className="text-emerald-100/40 font-medium mb-6">Need more firepower? Add team members to this workspace instantly.</p>
            </div>
            <button 
              onClick={() => setShowInviteModal(true)}
              className="w-full py-4 bg-emerald-500 text-emerald-950 rounded-2xl font-black text-lg hover:bg-emerald-400 transition-colors"
            >
              Open Invite Portal
            </button>
          </div>
          <div className="p-8 bg-white dark:bg-gray-900 border border-stone-100 dark:border-gray-800 rounded-[2.5rem] shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="text-2xl font-black text-stone-900 dark:text-white mb-2 flex items-center gap-3">
                <Shield className="text-blue-500" /> Permissions
              </h3>
              <p className="text-stone-400 font-medium mb-6">Review and manage role definitions for {slug.replace(/-/g, ' ')}.</p>
            </div>
            <button className="w-full py-4 bg-stone-100 dark:bg-gray-800 text-stone-900 dark:text-white rounded-2xl font-black text-lg hover:bg-stone-200 dark:hover:bg-gray-700 transition-colors">
              Manage Roles
            </button>
          </div>
        </div>
      )}

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

'use client'

import React, { useState } from 'react'
import { 
  X, 
  Mail, 
  Briefcase, 
  UserPlus, 
  Loader2, 
  ChevronRight,
  Sparkles,
  ShieldCheck,
  Building
} from 'lucide-react'
import toast from 'react-hot-toast'

interface InviteUserModalProps {
  workspaceSlug: string
  workspaceName: string
  onClose: () => void
}

export function InviteUserModal({ workspaceSlug, workspaceName, onClose }: InviteUserModalProps) {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('member')
  const [department, setDepartment] = useState('')
  const [jobTitle, setJobTitle] = useState('')
  const [loading, setLoading] = useState(false)

  const roles = [
    { id: 'member', label: 'Member', description: 'Can view and edit tasks' },
    { id: 'admin', label: 'Admin', description: 'Can manage team and settings' },
    { id: 'guest', label: 'Guest', description: 'Limited access to specific tasks' },
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      console.log(`[INVITE_MODAL] Sending invitation to ${email} for workspace ${workspaceSlug}`)
      const res = await fetch(`/api/workspaces/${workspaceSlug}/invites`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, role, department, jobTitle })
      })

      const data = await res.json()
      console.log('[INVITE_MODAL] API Response:', data)
      
      if (!res.ok || data.error) {
        throw new Error(data.error || `Server responded with ${res.status}`)
      }

      toast.success(`Invite sent successfully to ${email}`)
      onClose()
    } catch (err: any) {
      console.error('[INVITE_MODAL] Catch error:', err)
      toast.error(err.message || 'Failed to send invitation')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 w-full max-w-xl rounded-[2.5rem] shadow-2xl overflow-hidden border border-stone-200 dark:border-gray-800">
        <div className="p-8 border-b border-stone-100 dark:border-gray-800 flex items-center justify-between bg-emerald-50/50 dark:bg-emerald-900/10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-lg">
              <UserPlus className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-stone-900 dark:text-white">Invite to {workspaceName}</h2>
              <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest">New Team Member</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-white dark:hover:bg-gray-800 transition-colors shadow-sm">
            <X className="w-6 h-6 text-stone-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-black text-stone-400 uppercase tracking-widest flex items-center gap-2">
              <Mail className="w-3 h-3" /> Email Address *
            </label>
            <input 
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="colleague@company.com"
              className="w-full px-5 py-4 rounded-2xl border-2 border-stone-100 dark:border-gray-800 bg-stone-50 dark:bg-gray-800/50 focus:border-emerald-500 focus:ring-8 focus:ring-emerald-500/5 outline-none transition-all font-bold"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-black text-stone-400 uppercase tracking-widest flex items-center gap-2">
                <Building className="w-3 h-3" /> Department
              </label>
              <input 
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="Engineering"
                className="w-full px-5 py-4 rounded-2xl border-2 border-stone-100 dark:border-gray-800 bg-stone-50 dark:bg-gray-800/50 focus:border-emerald-500 outline-none transition-all font-bold text-sm"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black text-stone-400 uppercase tracking-widest flex items-center gap-2">
                <Briefcase className="w-3 h-3" /> Job Title
              </label>
              <input 
                type="text"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="Senior Dev"
                className="w-full px-5 py-4 rounded-2xl border-2 border-stone-100 dark:border-gray-800 bg-stone-50 dark:bg-gray-800/50 focus:border-emerald-500 outline-none transition-all font-bold text-sm"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black text-stone-400 uppercase tracking-widest flex items-center gap-2">
              <ShieldCheck className="w-3 h-3" /> Role *
            </label>
            <div className="grid grid-cols-1 gap-2">
              {roles.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setRole(r.id)}
                  className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all group ${
                    role === r.id 
                      ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-900/20' 
                      : 'border-stone-100 dark:border-gray-800 hover:border-emerald-500/50'
                  }`}
                >
                  <div className="text-left">
                    <p className={`font-black text-sm ${role === r.id ? 'text-emerald-600' : 'text-stone-900 dark:text-white'}`}>{r.label}</p>
                    <p className="text-[10px] text-stone-400 font-bold">{r.description}</p>
                  </div>
                  {role === r.id && <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-4">
            <button
              disabled={loading}
              className="w-full py-5 bg-stone-900 dark:bg-white text-white dark:text-stone-900 rounded-2xl font-black text-lg shadow-xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
            >
              {loading ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <>
                  Send Invitation <ChevronRight className="w-5 h-5" />
                </>
              )}
            </button>
            <p className="text-center text-[10px] font-black text-stone-400 uppercase tracking-widest mt-4 flex items-center justify-center gap-2">
              <Sparkles className="w-3 h-3 text-emerald-500" /> Powered by Resend Email Engine
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}

'use client'

import React, { useState, useRef } from 'react'
import { 
  X, 
  Building, 
  Users, 
  Image as ImageIcon, 
  Mail, 
  UserPlus, 
  Loader2, 
  ChevronRight, 
  ChevronLeft,
  Sparkles,
  Upload,
  CheckCircle2,
  Rocket,
  Briefcase
} from 'lucide-react'
import toast from 'react-hot-toast'
import { supabase } from '@/lib/supabase'

interface WorkspaceCreateModalProps {
  onClose: () => void
  onSuccess: () => void
}

export function WorkspaceCreateModal({ onClose, onSuccess }: WorkspaceCreateModalProps) {
  const [step, setStep] = useState(1)
  const [name, setName] = useState('')
  const [useCase, setUseCase] = useState('')
  const [teamSize, setTeamSize] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [uploading, setUploading] = useState(false)
  const [loading, setLoading] = useState(false)
  
  // Invites
  const [invites, setInvites] = useState<{ email: string; role: string }[]>([])
  const [currentEmail, setCurrentEmail] = useState('')

  const fileInputRef = useRef<HTMLInputElement>(null)

  const useCases = [
    "Project Management", "Team Collaboration", "Personal Productivity", "Client Work", "Software Development", "Creative Studio"
  ]

  const teamSizes = [
    "1-5 members", "6-20 members", "21-100 members", "100+ members"
  ]

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random()}.${fileExt}`
      const filePath = `workspace-logos/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('takra-bucket')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data } = supabase.storage.from('takra-bucket').getPublicUrl(filePath)
      console.log('[UPLOAD] Generated Public URL:', data.publicUrl)
      setImageUrl(data.publicUrl)
      toast.success('Logo uploaded!')
    } catch (err: any) {
      console.error('[UPLOAD] Error:', err)
      toast.error('Failed to upload logo: ' + err.message)
    } finally {
      setUploading(false)
    }
  }

  const addInvite = () => {
    if (!currentEmail || !currentEmail.includes('@')) {
      toast.error('Please enter a valid email')
      return
    }
    setInvites([...invites, { email: currentEmail, role: 'member' }])
    setCurrentEmail('')
  }

  const handleSubmit = async () => {
    setLoading(true)
    try {
      // 1. Create Workspace
      console.log('Attempting to create workspace:', { name, useCase, teamSize })
      const res = await fetch('/api/workspaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, useCase, teamSize, imageUrl })
      })
      const data = await res.json()
      console.log('Workspace creation response:', data)
      if (data.error) throw new Error(data.error)

      // 2. Send Invites if any
      if (invites.length > 0) {
        console.log(`[CREATE_WS] Sending ${invites.length} invitations for workspace slug:`, data.workspace.slug)
        for (const invite of invites) {
          try {
            const inviteRes = await fetch(`/api/workspaces/${data.workspace.slug}/invites`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email: invite.email, role: invite.role })
            })
            const inviteData = await inviteRes.json()
            console.log(`[CREATE_WS] Invitation response for ${invite.email}:`, inviteData)
            
            if (!inviteRes.ok || inviteData.error) {
              toast.error(`Could not invite ${invite.email}: ${inviteData.error || 'Unknown error'}`)
            }
          } catch (invErr) {
            console.error(`[CREATE_WS] Failed to send invite to ${invite.email}:`, invErr)
          }
        }
      }

      toast.success('Workspace created successfully!')
      onSuccess()
    } catch (err: any) {
      toast.error(err.message || 'Failed to create workspace')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-950 w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden border border-stone-200 dark:border-gray-800 flex flex-col h-[700px]">
        
        {/* Header */}
        <div className="p-8 border-b border-stone-100 dark:border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-lg">
              <Rocket className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-stone-900 dark:text-white">Assemble New Team</h2>
              <div className="flex items-center gap-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className={`h-1 rounded-full transition-all ${step >= i ? 'w-4 bg-emerald-500' : 'w-2 bg-stone-200 dark:bg-gray-800'}`} />
                ))}
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-stone-100 dark:hover:bg-gray-900 transition-colors">
            <X className="w-6 h-6 text-stone-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8">
          {step === 1 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="space-y-3">
                <h3 className="text-3xl font-black text-stone-900 dark:text-white tracking-tight">The Basics</h3>
                <p className="text-stone-500 dark:text-gray-400 font-medium text-sm leading-relaxed">Every great project starts with a name and a vision. Tell us what you're building.</p>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest flex items-center gap-2">
                    <Building className="w-3 h-3" /> Workspace Name *
                  </label>
                  <input 
                    autoFocus
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Acme Design, Engineering Hub, etc."
                    className="w-full px-6 py-4 rounded-2xl border-2 border-stone-100 dark:border-gray-800 bg-stone-50 dark:bg-gray-900 focus:border-emerald-500 focus:ring-8 focus:ring-emerald-500/5 outline-none transition-all font-bold"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest flex items-center gap-2">
                    <Briefcase className="w-3 h-3" /> What are you using this for?
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {useCases.map(uc => (
                      <button
                        key={uc}
                        onClick={() => setUseCase(uc)}
                        className={`text-left p-4 rounded-xl border-2 text-sm font-bold transition-all ${
                          useCase === uc 
                            ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-900/20 text-emerald-600' 
                            : 'border-stone-100 dark:border-gray-800 text-stone-600 dark:text-gray-400 hover:border-emerald-500/50'
                        }`}
                      >
                        {uc}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="space-y-3">
                <h3 className="text-3xl font-black text-stone-900 dark:text-white tracking-tight">Identity & Scale</h3>
                <p className="text-stone-500 dark:text-gray-400 font-medium text-sm leading-relaxed">Customize your workspace's visual identity and help us optimize your team's scale.</p>
              </div>

              <div className="space-y-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest flex items-center gap-2">
                    <ImageIcon className="w-3 h-3" /> Workspace Logo
                  </label>
                  <div className="flex items-center gap-6">
                    <div className="w-24 h-24 rounded-[2rem] bg-stone-100 dark:bg-gray-900 border-2 border-dashed border-stone-200 dark:border-gray-800 flex items-center justify-center overflow-hidden">
                      {imageUrl ? (
                        <img src={imageUrl} alt="Logo" className="w-full h-full object-cover" />
                      ) : (
                        <ImageIcon className="w-8 h-8 text-stone-300" />
                      )}
                    </div>
                    <div className="flex-1 space-y-2">
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleFileUpload} 
                        className="hidden" 
                        accept="image/*"
                      />
                      <button 
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="px-6 py-3 bg-stone-900 dark:bg-white text-white dark:text-stone-900 rounded-xl font-bold text-sm flex items-center gap-2 hover:scale-105 active:scale-95 transition-all"
                      >
                        {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                        Upload Image
                      </button>
                      <p className="text-[10px] text-stone-400 font-bold">PNG, JPG or SVG. Max 2MB.</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest flex items-center gap-2">
                    <Users className="w-3 h-3" /> Estimated Team Size
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {teamSizes.map(ts => (
                      <button
                        key={ts}
                        onClick={() => setTeamSize(ts)}
                        className={`text-left p-4 rounded-xl border-2 text-sm font-bold transition-all ${
                          teamSize === ts 
                            ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-900/20 text-emerald-600' 
                            : 'border-stone-100 dark:border-gray-800 text-stone-600 dark:text-gray-400 hover:border-emerald-500/50'
                        }`}
                      >
                        {ts}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="space-y-3">
                <h3 className="text-3xl font-black text-stone-900 dark:text-white tracking-tight">Expand the Team</h3>
                <p className="text-stone-500 dark:text-gray-400 font-medium text-sm leading-relaxed">Work is better together. Invite your colleagues now or skip this step.</p>
              </div>

              <div className="space-y-6">
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <input 
                      type="email"
                      value={currentEmail}
                      onChange={(e) => setCurrentEmail(e.target.value)}
                      placeholder="teammate@company.com"
                      className="flex-1 px-5 py-4 rounded-2xl border-2 border-stone-100 dark:border-gray-800 bg-stone-50 dark:bg-gray-900 focus:border-emerald-500 outline-none transition-all font-bold"
                    />
                    <button 
                      onClick={addInvite}
                      className="px-6 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-500/20"
                    >
                      Add
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Pending Invites ({invites.length})</p>
                  <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2">
                    {invites.length === 0 ? (
                      <div className="py-8 text-center border-2 border-dashed border-stone-100 dark:border-gray-800 rounded-2xl text-stone-400 font-bold text-sm italic">
                        No team members added yet
                      </div>
                    ) : (
                      invites.map((inv, idx) => (
                        <div key={idx} className="flex items-center justify-between p-4 bg-stone-50 dark:bg-gray-900 rounded-xl border border-stone-100 dark:border-gray-800">
                          <div className="flex items-center gap-3">
                            <Mail className="w-4 h-4 text-stone-400" />
                            <span className="text-sm font-bold text-stone-900 dark:text-white">{inv.email}</span>
                          </div>
                          <button 
                            onClick={() => setInvites(invites.filter((_, i) => i !== idx))}
                            className="p-1 hover:text-red-500 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-8 border-t border-stone-100 dark:border-gray-800 bg-stone-50/50 dark:bg-gray-900/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {step > 1 ? (
              <button 
                onClick={() => setStep(step - 1)}
                className="flex items-center gap-2 text-stone-500 hover:text-stone-900 dark:hover:text-white font-bold transition-colors"
              >
                <ChevronLeft className="w-5 h-5" /> Back
              </button>
            ) : (
              <button 
                onClick={onClose}
                className="text-stone-500 hover:text-stone-900 dark:hover:text-white font-bold transition-colors"
              >
                Cancel
              </button>
            )}
          </div>
          <div className="flex items-center gap-3">
            {step < 3 ? (
              <button 
                onClick={() => {
                  if (step === 1 && !name) {
                    toast.error('Workspace name is required')
                    return
                  }
                  setStep(step + 1)
                }}
                className="px-8 py-4 bg-stone-900 dark:bg-white text-white dark:text-stone-900 rounded-2xl font-black shadow-xl flex items-center gap-2 hover:scale-105 active:scale-95 transition-all"
              >
                Continue <ChevronRight className="w-5 h-5" />
              </button>
            ) : (
              <button 
                onClick={handleSubmit}
                disabled={loading}
                className="px-8 py-4 bg-emerald-600 text-white rounded-2xl font-black shadow-xl shadow-emerald-500/20 flex items-center gap-2 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Sparkles className="w-5 h-5 fill-current" /> Finalize Setup</>}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

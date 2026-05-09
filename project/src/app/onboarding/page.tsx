'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { toast } from '@/components/ui/ToasterProvider'
import gsap from 'gsap'
import { 
  Briefcase, 
  Users, 
  Target, 
  Rocket, 
  ArrowRight, 
  ChevronLeft,
  CheckCircle2,
  Sparkles,
  Zap,
  Image as ImageIcon,
  Upload,
  Loader2
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

type Step = 'welcome' | 'profession' | 'team' | 'goal' | 'workspace' | 'finish'

export default function OnboardingPage() {
  const { user, checkAuth, loading: authLoading } = useAuth()
  const router = useRouter()
  const [step, setStep] = useState<Step>('welcome')
  const [profession, setProfession] = useState('')
  const [teamSize, setTeamSize] = useState('')
  const [primaryGoal, setPrimaryGoal] = useState('')
  const [workspaceName, setWorkspaceName] = useState('')
  const [wsImageUrl, setWsImageUrl] = useState('')
  const [uploadingWS, setUploadingWS] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  
  const containerRef = useRef<HTMLDivElement>(null)
  const wsFileInputRef = useRef<HTMLInputElement>(null)
  const stepsOrder: Step[] = ['welcome', 'profession', 'team', 'goal', 'workspace', 'finish']
  const currentStepIndex = stepsOrder.indexOf(step)
  const progress = (currentStepIndex / (stepsOrder.length - 1)) * 100

  useEffect(() => {
    if (!authLoading && user?.onboardingCompleted) {
      router.replace('/')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (containerRef.current) {
      gsap.fromTo(
        containerRef.current.children,
        { opacity: 0, y: 30, scale: 0.95 },
        { 
          opacity: 1, 
          y: 0, 
          scale: 1, 
          duration: 0.6, 
          stagger: 0.1, 
          ease: 'back.out(1.2)' 
        }
      )
    }
  }, [step])

  const professions = [
    { id: 'engineer', label: 'Software Engineer', icon: '💻', color: 'bg-blue-500' },
    { id: 'manager', label: 'Product Manager', icon: '📊', color: 'bg-emerald-500' },
    { id: 'designer', label: 'Designer', icon: '🎨', color: 'bg-purple-500' },
    { id: 'founder', label: 'Founder / Executive', icon: '🚀', color: 'bg-orange-500' },
    { id: 'marketing', label: 'Marketing / Sales', icon: '📈', color: 'bg-pink-500' },
    { id: 'other', label: 'Other professional', icon: '✨', color: 'bg-gray-500' },
  ]

  const teamSizes = [
    { id: 'solo', label: 'Just me', icon: '👤' },
    { id: 'small', label: '2-10 people', icon: '👥' },
    { id: 'medium', label: '11-50 people', icon: '🏢' },
    { id: 'large', label: '50+ people', icon: '🌎' },
  ]

  const goals = [
    { id: 'productivity', label: 'Boost Productivity', icon: <Zap className="w-5 h-5" /> },
    { id: 'remote', label: 'Better Remote Work', icon: <Users className="w-5 h-5" /> },
    { id: 'tracking', label: 'Track Complex Tasks', icon: <Target className="w-5 h-5" /> },
    { id: 'automation', label: 'AI Automation', icon: <Sparkles className="w-5 h-5" /> },
  ]

  const nextStep = () => {
    const nextIdx = currentStepIndex + 1
    if (nextIdx < stepsOrder.length) {
      setStep(stepsOrder[nextIdx])
    }
  }

  const prevStep = () => {
    const prevIdx = currentStepIndex - 1
    if (prevIdx >= 0) {
      setStep(stepsOrder[prevIdx])
    }
  }

  const handleWSImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingWS(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random()}.${fileExt}`
      const filePath = `workspace-logos/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('takra-bucket')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data } = supabase.storage.from('takra-bucket').getPublicUrl(filePath)
      setWsImageUrl(data.publicUrl)
      toast.success('Logo uploaded!')
    } catch (err: any) {
      toast.error('Failed to upload logo: ' + err.message)
    } finally {
      setUploadingWS(false)
    }
  }

  const handleComplete = async () => {
    setSubmitting(true)
    try {
      const res = await fetch('/api/auth/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profession,
          teamSize,
          primaryGoal,
          workspaceName: workspaceName || `${user?.name || 'My'}'s Workspace`,
          onboardingCompleted: true,
          workspaceImageUrl: wsImageUrl
        }),
      })

      if (!res.ok) throw new Error('Failed to save onboarding info')
      
      await checkAuth()
      toast.success('Your workspace is ready!')
      router.push('/')
    } catch (error) {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (authLoading) return null

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-gray-950 flex flex-col items-center justify-center p-4 selection:bg-emerald-500/30 overflow-hidden">
      {/* Progress Bar */}
      <div className="fixed top-0 left-0 w-full h-1.5 bg-stone-200 dark:bg-gray-900 z-50">
        <div 
          className="h-full bg-emerald-500 transition-all duration-500 ease-out shadow-[0_0_15px_rgba(16,185,129,0.5)]"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="w-full max-w-4xl relative">
        {/* Background Decorative Elements */}
        <div className="absolute -top-24 -left-24 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl animate-pulse delay-700" />

        <div className="relative z-10 bg-white dark:bg-gray-900 border border-stone-200 dark:border-gray-800 rounded-[2.5rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] dark:shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] overflow-hidden min-h-[600px] flex flex-col">
          <div className="flex-1 flex flex-col items-center justify-center p-8 sm:p-12" ref={containerRef}>
        {step === 'welcome' && (
          <div className="space-y-8 text-center py-10">
            <div className="relative inline-block">
              <div className="w-24 h-24 rounded-[2rem] bg-emerald-600/10 flex items-center justify-center text-5xl animate-pulse">
                👋
              </div>
              <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-emerald-500 border-4 border-stone-50 dark:border-gray-950 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
            </div>
            <div className="space-y-4">
              <h1 className="text-5xl sm:text-6xl font-black tracking-tight text-stone-900 dark:text-white leading-tight">
                Design your <span className="text-emerald-500">Sync.</span>
              </h1>
              <p className="text-xl text-stone-600 dark:text-gray-400 max-w-md mx-auto leading-relaxed font-medium">
                Momentum adapts to how you work. Let's create an environment built for high-performance teams.
              </p>
            </div>
            <button
              onClick={nextStep}
              className="group relative px-10 py-5 bg-stone-900 dark:bg-white dark:text-stone-950 text-white rounded-2xl font-bold text-xl shadow-2xl transition-all hover:scale-105 active:scale-95 flex items-center gap-3 mx-auto overflow-hidden"
            >
              <div className="absolute inset-0 bg-emerald-500 translate-y-full group-hover:translate-y-0 transition-transform duration-300 -z-0 opacity-10" />
              <span className="relative z-10">Initialize Flow</span>
              <ArrowRight className="w-6 h-6 relative z-10 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        )}

        {step === 'profession' && (
          <div className="space-y-8">
            <div className="flex items-center gap-4">
              <button onClick={prevStep} className="p-2 rounded-xl hover:bg-stone-200 dark:hover:bg-gray-800 transition-colors">
                <ChevronLeft className="w-6 h-6" />
              </button>
              <h2 className="text-3xl font-bold text-stone-900 dark:text-white">What's your primary focus?</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {professions.map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    setProfession(p.label)
                    nextStep()
                  }}
                  className={`group flex items-center gap-4 p-6 rounded-3xl border-2 text-left transition-all hover:shadow-xl ${
                    profession === p.label
                      ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-900/20'
                      : 'border-stone-200 dark:border-gray-800 bg-white dark:bg-gray-900'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-2xl ${p.color} bg-opacity-10 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform`}>
                    {p.icon}
                  </div>
                  <span className="font-bold text-stone-900 dark:text-white text-lg">{p.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 'team' && (
          <div className="space-y-8">
            <div className="flex items-center gap-4">
              <button onClick={prevStep} className="p-2 rounded-xl hover:bg-stone-200 dark:hover:bg-gray-800 transition-colors">
                <ChevronLeft className="w-6 h-6" />
              </button>
              <h2 className="text-3xl font-bold text-stone-900 dark:text-white">How big is your team?</h2>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {teamSizes.map((t) => (
                <button
                  key={t.id}
                  onClick={() => {
                    setTeamSize(t.label)
                    nextStep()
                  }}
                  className={`flex flex-col items-center gap-4 p-8 rounded-3xl border-2 text-center transition-all hover:border-emerald-500/50 ${
                    teamSize === t.label
                      ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-900/20'
                      : 'border-stone-200 dark:border-gray-800 bg-white dark:bg-gray-900'
                  }`}
                >
                  <span className="text-4xl">{t.icon}</span>
                  <span className="font-bold text-stone-900 dark:text-white">{t.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 'goal' && (
          <div className="space-y-8">
            <div className="flex items-center gap-4">
              <button onClick={prevStep} className="p-2 rounded-xl hover:bg-stone-200 dark:hover:bg-gray-800 transition-colors">
                <ChevronLeft className="w-6 h-6" />
              </button>
              <h2 className="text-3xl font-bold text-stone-900 dark:text-white">What's your main objective?</h2>
            </div>
            <div className="space-y-3">
              {goals.map((g) => (
                <button
                  key={g.id}
                  onClick={() => {
                    setPrimaryGoal(g.label)
                    nextStep()
                  }}
                  className={`w-full flex items-center justify-between p-6 rounded-3xl border-2 transition-all group ${
                    primaryGoal === g.label
                      ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-900/20'
                      : 'border-stone-200 dark:border-gray-800 bg-white dark:bg-gray-900'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-stone-100 dark:bg-gray-800 group-hover:bg-emerald-500/10 transition-colors">
                      {g.icon}
                    </div>
                    <span className="font-bold text-stone-900 dark:text-white text-lg">{g.label}</span>
                  </div>
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                    primaryGoal === g.label ? 'border-emerald-500 bg-emerald-500' : 'border-stone-300 dark:border-gray-700'
                  }`}>
                    {primaryGoal === g.label && <CheckCircle2 className="w-4 h-4 text-white" />}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 'workspace' && (
          <div className="space-y-10">
            <div className="flex items-center gap-4">
              <button onClick={prevStep} className="p-2 rounded-xl hover:bg-stone-200 dark:hover:bg-gray-800 transition-colors">
                <ChevronLeft className="w-6 h-6" />
              </button>
              <h2 className="text-3xl font-bold text-stone-900 dark:text-white">Define your Identity</h2>
            </div>
            
            <div className="space-y-8">
              <div className="flex items-center gap-6 p-8 bg-white dark:bg-gray-900 border-2 border-stone-100 dark:border-gray-800 rounded-[2.5rem]">
                <div className="w-24 h-24 rounded-[2rem] bg-emerald-500/10 border-2 border-dashed border-emerald-500/20 flex items-center justify-center overflow-hidden">
                  {wsImageUrl ? (
                    <img src={wsImageUrl} alt="Logo" className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon className="w-8 h-8 text-emerald-500/30" />
                  )}
                </div>
                <div className="flex-1 space-y-3">
                  <p className="text-sm font-bold text-stone-900 dark:text-white">Workspace Logo</p>
                  <input 
                    type="file" 
                    ref={wsFileInputRef} 
                    onChange={handleWSImageUpload} 
                    className="hidden" 
                    accept="image/*"
                  />
                  <button 
                    onClick={() => wsFileInputRef.current?.click()}
                    disabled={uploadingWS}
                    className="px-6 py-3 bg-stone-900 dark:bg-white text-white dark:text-stone-900 rounded-xl font-bold text-sm flex items-center gap-2 hover:scale-105 active:scale-95 transition-all"
                  >
                    {uploadingWS ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    Upload Logo
                  </button>
                </div>
              </div>

              <div className="space-y-6">
                <div className="relative">
                  <input
                    type="text"
                    value={workspaceName}
                    onChange={(e) => setWorkspaceName(e.target.value)}
                    placeholder="Acme Engineering, Design Co, etc."
                    className="w-full px-8 py-6 rounded-3xl border-2 border-stone-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-stone-900 dark:text-white focus:border-emerald-500 focus:ring-8 focus:ring-emerald-500/5 transition-all text-2xl font-bold outline-none placeholder:text-stone-300 dark:placeholder:text-gray-700"
                    autoFocus
                  />
                </div>
                <button
                  onClick={nextStep}
                  disabled={!workspaceName.trim() || uploadingWS}
                  className="w-full py-6 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-3xl font-bold text-2xl shadow-xl shadow-emerald-900/20 transition-all active:scale-95 flex items-center justify-center gap-3"
                >
                  Assemble Team <ArrowRight className="w-6 h-6" />
                </button>
              </div>
            </div>
          </div>
        )}

        {step === 'finish' && (
          <div className="space-y-10 text-center py-6">
            <div className="relative inline-block">
              <div className="w-32 h-32 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-[0_0_50px_rgba(16,185,129,0.3)]">
                <CheckCircle2 className="w-16 h-16" />
              </div>
              <div className="absolute -top-4 -right-4 animate-bounce">
                <Sparkles className="w-10 h-10 text-emerald-500" />
              </div>
            </div>
            
            <div className="space-y-3">
              <h2 className="text-5xl font-black text-stone-900 dark:text-white tracking-tight">Sync Established.</h2>
              <p className="text-stone-500 dark:text-gray-400 font-medium">Your enterprise workflow has been optimized.</p>
            </div>

            <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
              <div className="p-4 rounded-2xl bg-white dark:bg-gray-900 border border-stone-200 dark:border-gray-800 text-left">
                <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mb-1">Role</p>
                <p className="font-bold text-stone-900 dark:text-white truncate">{profession}</p>
              </div>
              <div className="p-4 rounded-2xl bg-white dark:bg-gray-900 border border-stone-200 dark:border-gray-800 text-left">
                <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mb-1">Team</p>
                <p className="font-bold text-stone-900 dark:text-white truncate">{teamSize}</p>
              </div>
              <div className="col-span-2 p-4 rounded-2xl bg-stone-900 dark:bg-white text-white dark:text-stone-950 text-left">
                <p className="text-[10px] font-bold opacity-60 uppercase tracking-widest mb-1">Workspace</p>
                <p className="font-black text-xl truncate">{workspaceName}</p>
              </div>
            </div>

            <button
              onClick={handleComplete}
              disabled={submitting}
              className="w-full max-w-sm py-6 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-70 text-white rounded-3xl font-black text-2xl shadow-2xl transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-4 mx-auto"
            >
              {submitting ? (
                <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>Enter Workspace <Zap className="w-6 h-6 fill-current" /></>
              )}
            </button>
          </div>
        )}
          </div>
        </div>
      </div>
    </div>
  )
}

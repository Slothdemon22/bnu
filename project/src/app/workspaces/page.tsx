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
  Building,
  CheckCircle2,
  Clock,
  CalendarDays,
  Sparkles,
  Bot,
  Calendar,
  X
} from 'lucide-react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import gsap from 'gsap'
import toast from 'react-hot-toast'

interface Workspace {
  id: number
  name: string
  slug: string
  role: string
  memberCount: number
  imageUrl?: string | null
  useCase?: string | null
}

interface DashboardStats {
  pendingCount: number
  completedCount: number
  upcomingTasks: any[]
  todaysTasks: any[]
  allTasks: any[]
}

import { WorkspaceCreateModal } from '@/components/dashboard/WorkspaceCreateModal'

export default function WorkspacesPage() {
  const { user, checkAuth } = useAuth()
  const searchParams = useSearchParams()
  const router = useRouter()
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [generatingSummary, setGeneratingSummary] = useState(false)
  const [aiSummary, setAiSummary] = useState<string | null>(null)
  const [showScheduleSheet, setShowScheduleSheet] = useState(false)
  const [calendarView, setCalendarView] = useState<'week' | 'month'>('week')
  const [currentDate, setCurrentDate] = useState(new Date())

  const getCalendarDays = () => {
    const days = []
    const start = new Date(currentDate)
    
    if (calendarView === 'week') {
      start.setDate(start.getDate() - start.getDay()) // Start of week (Sunday)
      for (let i = 0; i < 7; i++) {
        days.push(new Date(start))
        start.setDate(start.getDate() + 1)
      }
    } else {
      start.setDate(1) // First day of month
      const startDay = start.getDay()
      start.setDate(start.getDate() - startDay) // Back to previous Sunday
      
      for (let i = 0; i < 42; i++) { // 6 weeks
        days.push(new Date(start))
        start.setDate(start.getDate() + 1)
      }
    }
    return days
  }

  const fetchData = async () => {
    try {
      setLoading(true)
      const [wsRes, statsRes] = await Promise.all([
        fetch('/api/workspaces'),
        fetch('/api/workspaces/dashboard-stats')
      ])
      
      const wsData = await wsRes.json()
      const statsData = await statsRes.json()
      
      if (wsData.workspaces) setWorkspaces(wsData.workspaces)
      if (!statsData.error) setStats(statsData)
        
    } catch (err) {
      console.error('Fetch Error:', err)
    } finally {
      setLoading(false)
    }
  }

  const generateDailySummary = async () => {
    if (!stats || generatingSummary) return
    
    setGeneratingSummary(true)
    try {
      const res = await fetch('/api/ai/daily-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tasks: stats.todaysTasks })
      })
      const data = await res.json()
      if (data.summary) {
        setAiSummary(data.summary)
      }
    } catch (err) {
      toast.error('Failed to generate summary')
    } finally {
      setGeneratingSummary(false)
    }
  }

  useEffect(() => {
    if (user) fetchData()
  }, [user])

  useEffect(() => {
    if (searchParams.get('stripe') === 'success') {
      const syncStatus = async () => {
        setIsSyncing(true)
        toast.loading('Verifying payment with Stripe...', { id: 'stripe-sync' })
        
        try {
          const verifyRes = await fetch('/api/stripe/verify-session')
          const verifyData = await verifyRes.json()
          
          if (verifyData.success) {
            await checkAuth()
            toast.success('Subscription verified! Welcome to Pro.', { id: 'stripe-sync' })
          } else {
            throw new Error('Verification failed')
          }
        } catch (err) {
          toast.error('Could not verify status automatically. Please try refreshing.', { id: 'stripe-sync' })
        } finally {
          setIsSyncing(false)
          router.replace('/workspaces')
        }
      }
      syncStatus()
    }
  }, [searchParams, checkAuth, router])

  useEffect(() => {
    if (!loading) {
      const ctx = gsap.context(() => {
        gsap.fromTo('.stagger-item', 
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, stagger: 0.1, duration: 0.6, ease: 'power3.out', clearProps: 'all' }
        )
      })
      return () => ctx.revert()
    }
  }, [loading, workspaces.length])

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 stagger-item">
        <div>
          <h1 className="text-4xl font-black text-stone-900 dark:text-white tracking-tight">
            Dashboard <span className="text-emerald-500">& Workspaces</span>
          </h1>
          <p className="text-stone-600 dark:text-gray-400 mt-2 font-medium">
            Your centralized hub for cross-workspace progress.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={generateDailySummary}
            disabled={generatingSummary || !stats}
            className="flex items-center gap-2 px-5 py-3 bg-stone-100 dark:bg-gray-800 text-stone-900 dark:text-white rounded-2xl font-bold transition-transform hover:scale-105 active:scale-95 disabled:opacity-50 border border-stone-200 dark:border-gray-700"
          >
            {generatingSummary ? <Loader2 className="w-5 h-5 animate-spin text-emerald-500" /> : <Bot className="w-5 h-5 text-emerald-500" />}
            AI Daily Briefing
          </button>
          <button 
            onClick={() => setShowScheduleSheet(true)}
            className="flex items-center gap-2 px-5 py-3 bg-stone-100 dark:bg-gray-800 text-stone-900 dark:text-white rounded-2xl font-bold transition-transform hover:scale-105 active:scale-95 border border-stone-200 dark:border-gray-700"
          >
            <Calendar className="w-5 h-5 text-blue-500" />
            Schedule View
          </button>
          <button 
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-stone-900 dark:bg-white text-white dark:text-stone-900 rounded-2xl font-bold transition-transform hover:scale-105 active:scale-95 shadow-xl"
          >
            <Plus className="w-5 h-5" />
            New Workspace
          </button>
        </div>
      </div>

      {aiSummary && (
        <div className="p-6 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-900 dark:text-emerald-100 relative overflow-hidden stagger-item">
          <div className="absolute -top-10 -right-10 opacity-10 blur-xl">
            <Sparkles className="w-40 h-40 text-emerald-500" />
          </div>
          <div className="relative z-10 flex gap-4">
            <div className="shrink-0 w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
              <Bot className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h3 className="font-bold text-emerald-800 dark:text-emerald-300 mb-1">Your AI Daily Briefing</h3>
              <p className="font-medium text-emerald-700/80 dark:text-emerald-200/80 text-sm">{aiSummary}</p>
            </div>
          </div>
        </div>
      )}

      {/* Dashboard Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 stagger-item">
        <div className="p-6 rounded-3xl bg-white dark:bg-gray-950 border border-stone-200 dark:border-gray-800 shadow-sm flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-orange-500/10 text-orange-500 flex items-center justify-center">
            <Clock className="w-7 h-7" />
          </div>
          <div>
            <p className="text-sm font-bold text-stone-500 uppercase tracking-widest">Pending Tasks</p>
            <p className="text-3xl font-black text-stone-900 dark:text-white">{stats?.pendingCount ?? '-'}</p>
          </div>
        </div>
        
        <div className="p-6 rounded-3xl bg-white dark:bg-gray-950 border border-stone-200 dark:border-gray-800 shadow-sm flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <div>
            <p className="text-sm font-bold text-stone-500 uppercase tracking-widest">Completed</p>
            <p className="text-3xl font-black text-stone-900 dark:text-white">{stats?.completedCount ?? '-'}</p>
          </div>
        </div>

        <div className="p-6 rounded-3xl bg-white dark:bg-gray-950 border border-stone-200 dark:border-gray-800 shadow-sm flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
            <CalendarDays className="w-7 h-7" />
          </div>
          <div>
            <p className="text-sm font-bold text-stone-500 uppercase tracking-widest">Upcoming Soon</p>
            <p className="text-3xl font-black text-stone-900 dark:text-white">{stats?.upcomingTasks?.length ?? '-'}</p>
          </div>
        </div>
      </div>

      <div className="relative stagger-item">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
        <input 
          type="text" 
          placeholder="Search workspaces..." 
          className="w-full pl-12 pr-6 py-4 rounded-2xl border-2 border-stone-200 dark:border-gray-800 bg-white dark:bg-gray-900 focus:border-emerald-500 outline-none transition-all font-medium"
        />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 stagger-item">
          {[1, 2].map((i) => (
            <div key={i} className="h-64 rounded-[2.5rem] bg-stone-200 dark:bg-gray-900 animate-pulse" />
          ))}
        </div>
      ) : workspaces.length === 0 ? (
        <div className="py-20 text-center space-y-6 bg-white dark:bg-gray-900 rounded-[3rem] border-2 border-dashed border-stone-100 dark:border-gray-800 stagger-item">
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 stagger-item">
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
            fetchData()
          }}
        />
      )}

      {/* Schedule View Sheet */}
      {showScheduleSheet && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity animate-in fade-in" onClick={() => setShowScheduleSheet(false)} />
          <div className="relative w-full max-w-4xl bg-white dark:bg-gray-950 h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300 border-l border-stone-200 dark:border-gray-800">
            <div className="p-6 border-b border-stone-100 dark:border-gray-800 flex flex-col sm:flex-row sm:items-center justify-between bg-stone-50/50 dark:bg-gray-900/50 gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500 shrink-0">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-stone-900 dark:text-white uppercase tracking-tighter">My Schedule</h2>
                  <p className="text-xs font-bold text-stone-400 uppercase tracking-widest">All Workspaces</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="bg-stone-200 dark:bg-gray-800 p-1 rounded-lg flex text-xs font-bold uppercase tracking-widest mr-2">
                  <button 
                    onClick={() => {
                      const newDate = new Date(currentDate)
                      if (calendarView === 'week') newDate.setDate(newDate.getDate() - 7)
                      else newDate.setMonth(newDate.getMonth() - 1)
                      setCurrentDate(newDate)
                    }}
                    className="p-1.5 hover:bg-white dark:hover:bg-gray-700 rounded transition-colors"
                  >
                    &lt;
                  </button>
                  <span className="px-3 py-1.5 flex items-center justify-center font-bold text-stone-900 dark:text-white min-w-[120px]">
                    {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                  </span>
                  <button 
                    onClick={() => {
                      const newDate = new Date(currentDate)
                      if (calendarView === 'week') newDate.setDate(newDate.getDate() + 7)
                      else newDate.setMonth(newDate.getMonth() + 1)
                      setCurrentDate(newDate)
                    }}
                    className="p-1.5 hover:bg-white dark:hover:bg-gray-700 rounded transition-colors"
                  >
                    &gt;
                  </button>
                </div>
                <div className="bg-stone-200 dark:bg-gray-800 p-1 rounded-lg flex text-xs font-bold uppercase tracking-widest">
                  <button 
                    onClick={() => setCalendarView('week')}
                    className={`px-3 py-1.5 rounded-md transition-colors ${calendarView === 'week' ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-stone-500 hover:text-stone-700 dark:text-gray-400 dark:hover:text-white'}`}
                  >
                    Weekly
                  </button>
                  <button 
                    onClick={() => setCalendarView('month')}
                    className={`px-3 py-1.5 rounded-md transition-colors ${calendarView === 'month' ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-stone-500 hover:text-stone-700 dark:text-gray-400 dark:hover:text-white'}`}
                  >
                    Monthly
                  </button>
                </div>
                <button 
                  onClick={() => setShowScheduleSheet(false)}
                  className="p-2 rounded-xl hover:bg-stone-200 dark:hover:bg-gray-800 transition-colors shrink-0 ml-2"
                >
                  <X className="w-5 h-5 text-stone-500" />
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 bg-stone-50 dark:bg-gray-950 custom-scrollbar">
              <div className="bg-white dark:bg-gray-900 border border-stone-200 dark:border-gray-800 rounded-3xl overflow-hidden shadow-sm">
                {/* Calendar Header */}
                <div className="grid grid-cols-7 border-b border-stone-200 dark:border-gray-800 bg-stone-100 dark:bg-gray-950">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="p-3 text-center text-xs font-black text-stone-500 uppercase tracking-widest border-r border-stone-200 dark:border-gray-800 last:border-0">
                      {day}
                    </div>
                  ))}
                </div>
                {/* Calendar Body */}
                <div className="grid grid-cols-7 bg-stone-200 dark:bg-gray-800 gap-px">
                  {getCalendarDays().map((date, i) => {
                    const dateStr = date.toISOString().split('T')[0]
                    const isToday = dateStr === new Date().toISOString().split('T')[0]
                    const isCurrentMonth = date.getMonth() === currentDate.getMonth()
                    
                    const dayTasks = stats?.allTasks?.filter(t => t.dueDate && new Date(t.dueDate).toISOString().split('T')[0] === dateStr) || []

                    return (
                      <div key={i} className={`min-h-[120px] bg-white dark:bg-gray-900 p-2 flex flex-col gap-1 transition-colors hover:bg-stone-50 dark:hover:bg-gray-800/50 ${!isCurrentMonth ? 'opacity-50' : ''}`}>
                        <span className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full ${isToday ? 'bg-blue-500 text-white' : 'text-stone-500'}`}>
                          {date.getDate()}
                        </span>
                        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1 pr-1">
                          {dayTasks.map(task => (
                            <div 
                              key={task.id} 
                              className={`p-1.5 rounded-lg text-[10px] font-bold truncate transition-transform hover:scale-105 cursor-pointer ${
                                task.status === 'done' ? 'opacity-50 line-through bg-stone-100 text-stone-500 dark:bg-gray-800' :
                                task.priority === 'high' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                                task.priority === 'medium' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                                'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                              }`}
                              title={`${task.title} (${task.workspace.name})`}
                            >
                              {task.title}
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
              
              {/* Legend */}
              <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-[10px] font-black uppercase tracking-widest text-stone-500">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500" /> High Priority
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-amber-500" /> Medium Priority
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-blue-500" /> Low Priority
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-stone-300 dark:bg-gray-700" /> Completed
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

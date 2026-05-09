'use client'

import React, { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { 
  BarChart3, 
  Target, 
  Users, 
  MessageSquare, 
  TrendingUp, 
  Clock, 
  Activity,
  Zap,
  CheckCircle2,
  Calendar
} from 'lucide-react'
import { toast } from 'react-hot-toast'

export default function WorkspaceAnalyticsPage() {
  const params = useParams()
  const slug = params.slug as string
  const [workspace, setWorkspace] = useState<any>(null)
  const [tasks, setTasks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const [wsRes, tasksRes] = await Promise.all([
          fetch(`/api/workspaces/${slug}`),
          fetch(`/api/workspaces/${slug}/tasks`)
        ])
        
        const wsData = await wsRes.json()
        const tasksData = await tasksRes.json()

        if (wsData.workspace) setWorkspace(wsData.workspace)
        if (tasksData.tasks) setTasks(tasksData.tasks)
      } catch (err) {
        toast.error('Failed to load analytics data')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [slug])

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <BarChart3 className="w-6 h-6 text-emerald-500 animate-pulse" />
          </div>
        </div>
        <div className="text-center space-y-2">
          <h2 className="text-xl font-black text-stone-900 dark:text-white uppercase tracking-tighter">Compiling Analytics</h2>
          <p className="text-xs font-bold text-stone-400 uppercase tracking-[0.3em] animate-pulse">Generating Report...</p>
        </div>
      </div>
    )
  }

  const completedTasks = tasks.filter(t => t.status === 'done').length
  const totalTasks = tasks.length
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  const stats = [
    { label: 'Completion Rate', value: `${completionRate}%`, icon: <TrendingUp className="w-5 h-5" />, color: 'bg-emerald-500' },
    { label: 'Total Tasks', value: totalTasks, icon: <Target className="w-5 h-5" />, color: 'bg-blue-500' },
    { label: 'Team Members', value: workspace?.memberCount || 0, icon: <Users className="w-5 h-5" />, color: 'bg-orange-500' },
    { label: 'Total Logs', value: workspace?.activity?.length || 0, icon: <Activity className="w-5 h-5" />, color: 'bg-purple-500' },
  ]

  // Group activity by date
  const groupedActivity = workspace?.activity?.reduce((acc: any, act: any) => {
    const date = new Date(act.time).toLocaleDateString()
    if (!acc[date]) acc[date] = []
    acc[date].push(act)
    return acc
  }, {})

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-8 space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-stone-900 dark:text-white tracking-tighter uppercase flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
              <BarChart3 className="w-6 h-6" />
            </div>
            Workspace Analytics
          </h1>
          <p className="text-stone-500 font-medium font-mono text-sm uppercase opacity-60 mt-1">Control Center / Insights</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white dark:bg-gray-950 border border-stone-100 dark:border-gray-800 p-6 rounded-[2rem] shadow-sm hover:shadow-xl transition-all group relative overflow-hidden">
            <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-150 transition-transform duration-500 pointer-events-none">
              {stat.icon}
            </div>
            <div className={`w-12 h-12 rounded-2xl ${stat.color} flex items-center justify-center text-white mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
              {stat.icon}
            </div>
            <p className="text-xs font-black text-stone-400 uppercase tracking-widest">{stat.label}</p>
            <p className="text-4xl font-black text-stone-900 dark:text-white mt-1 tracking-tighter">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Activity Graph */}
          <div className="bg-white dark:bg-gray-950 rounded-[2.5rem] border border-stone-100 dark:border-gray-800 p-8 shadow-sm">
            <h2 className="text-xl font-black text-stone-900 dark:text-white flex items-center gap-3 mb-6 uppercase tracking-tighter">
              <BarChart3 className="w-5 h-5 text-emerald-500" /> Activity Trend
            </h2>
            <div className="h-40 flex items-end justify-between gap-2">
              {Object.keys(groupedActivity || {}).length > 0 ? (
                Object.entries(groupedActivity).slice(-7).map(([date, acts]: [string, any], i) => {
                  const maxActs = Math.max(...Object.values(groupedActivity).map((a: any) => a.length));
                  const height = Math.max(10, (acts.length / maxActs) * 100);
                  return (
                    <div key={date} className="flex-1 flex flex-col items-center gap-2 group h-full">
                      <div className="w-full relative bg-stone-100 dark:bg-gray-900 rounded-t-xl h-full flex flex-col justify-end">
                        <div 
                          className="w-full bg-emerald-500 rounded-t-xl transition-all duration-1000 group-hover:bg-emerald-400" 
                          style={{ height: `${height}%` }}
                        />
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-stone-900 text-white text-[10px] font-black px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                          {acts.length}
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest truncate max-w-full">{new Date(date).getDate()} {new Date(date).toLocaleString('default', { month: 'short' })}</span>
                    </div>
                  )
                })
              ) : (
                <div className="w-full h-full flex items-center justify-center text-stone-400 text-xs font-bold uppercase tracking-widest">Not enough data</div>
              )}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-950 rounded-[2.5rem] border border-stone-100 dark:border-gray-800 p-8 shadow-sm">
            <h2 className="text-2xl font-black text-stone-900 dark:text-white flex items-center gap-3 mb-8 uppercase tracking-tighter">
              <Activity className="w-6 h-6 text-emerald-500" /> End-to-End Logs
            </h2>
            
            <div className="max-h-[600px] overflow-y-auto pr-4 custom-scrollbar">
              <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-stone-200 dark:before:via-gray-800 before:to-transparent">
                {Object.keys(groupedActivity || {}).length > 0 ? (
                  Object.entries(groupedActivity).map(([date, activities]: [string, any]) => (
                    <div key={date} className="relative z-10">
                      <div className="flex items-center justify-center mb-6">
                        <span className="px-4 py-1.5 rounded-full bg-stone-100 dark:bg-gray-900 text-[10px] font-black uppercase tracking-widest text-stone-500 shadow-sm border border-stone-200 dark:border-gray-800">
                          {date}
                        </span>
                      </div>
                      <div className="space-y-4">
                        {activities.map((act: any) => (
                          <div key={act.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                            <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white dark:border-gray-950 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-500 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm z-10">
                              {act.type === 'chat' ? <MessageSquare className="w-4 h-4" /> : 
                               act.type === 'task' ? <Target className="w-4 h-4" /> : 
                               <Zap className="w-4 h-4" />}
                            </div>
                            <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-5 rounded-2xl bg-white dark:bg-gray-900 border border-stone-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-shadow">
                              <div className="flex items-center gap-3 mb-2">
                                <div className="w-6 h-6 rounded-full bg-stone-100 dark:bg-gray-800 flex items-center justify-center overflow-hidden">
                                  {act.userImage ? (
                                    <img src={act.userImage} alt={act.user} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                  ) : (
                                    <span className="text-[10px] font-bold">{act.user[0]}</span>
                                  )}
                                </div>
                                <span className="text-sm font-bold text-stone-900 dark:text-white">{act.user}</span>
                                <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-auto">
                                  {new Date(act.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                              <p className="text-sm text-stone-500 dark:text-gray-400 font-medium">{act.content}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-20 text-center relative z-10 bg-white dark:bg-gray-950">
                    <div className="w-20 h-20 bg-stone-50 dark:bg-gray-900 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Activity className="w-10 h-10 text-stone-300" />
                    </div>
                    <p className="text-stone-400 font-bold uppercase tracking-widest text-xs">No activity logs found</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-emerald-600 text-white rounded-[2.5rem] p-8 shadow-xl shadow-emerald-500/20 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl translate-x-1/3 -translate-y-1/3 pointer-events-none" />
            <h3 className="text-xl font-black uppercase tracking-tighter mb-2">Task Progress</h3>
            <p className="text-emerald-100 text-sm font-medium mb-8">Current state of workspace deliverables.</p>
            
            <div className="space-y-6 relative z-10">
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-black uppercase tracking-widest">
                  <span>Completed</span>
                  <span>{completedTasks}</span>
                </div>
                <div className="h-2 w-full bg-black/20 rounded-full overflow-hidden">
                  <div className="h-full bg-white rounded-full transition-all duration-1000" style={{ width: `${completionRate}%` }} />
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-black uppercase tracking-widest">
                  <span>In Progress</span>
                  <span>{tasks.filter(t => t.status === 'in_progress' || t.status === 'review').length}</span>
                </div>
                <div className="h-2 w-full bg-black/20 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-300 rounded-full transition-all duration-1000" style={{ width: `${totalTasks > 0 ? (tasks.filter(t => t.status === 'in_progress' || t.status === 'review').length / totalTasks) * 100 : 0}%` }} />
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-black uppercase tracking-widest">
                  <span>To Do</span>
                  <span>{tasks.filter(t => t.status === 'todo').length}</span>
                </div>
                <div className="h-2 w-full bg-black/20 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-200 rounded-full transition-all duration-1000" style={{ width: `${totalTasks > 0 ? (tasks.filter(t => t.status === 'todo').length / totalTasks) * 100 : 0}%` }} />
                </div>
              </div>
            </div>
          </div>

          {/* Team Member Performance */}
          <div className="bg-white dark:bg-gray-950 rounded-[2.5rem] border border-stone-100 dark:border-gray-800 p-8 shadow-sm">
            <h3 className="text-xl font-black uppercase tracking-tighter text-stone-900 dark:text-white mb-6 flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-500" /> Team Performance
            </h3>
            <div className="space-y-6">
              {Array.from(
                tasks.reduce((acc, task) => {
                  task.assignees?.forEach((assignee: any) => {
                    if (!acc.has(assignee.id)) {
                      acc.set(assignee.id, { ...assignee, total: 0, completed: 0 })
                    }
                    const data = acc.get(assignee.id)!
                    data.total += 1
                    if (task.status === 'done') data.completed += 1
                  })
                  return acc
                }, new Map<number, any>())
                .values()
              ).map((member: any) => {
                const memberRate = member.total > 0 ? Math.round((member.completed / member.total) * 100) : 0
                return (
                  <div key={member.id} className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-stone-100 dark:bg-gray-800 overflow-hidden shrink-0">
                          {member.imageUrl ? (
                            <img src={member.imageUrl} alt={member.name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="flex items-center justify-center w-full h-full text-xs font-bold">{member.name?.[0] || '?'}</span>
                          )}
                        </div>
                        <span className="text-sm font-bold text-stone-900 dark:text-white truncate max-w-[120px]">{member.name}</span>
                      </div>
                      <span className="text-xs font-black text-stone-400 uppercase tracking-widest">{member.completed}/{member.total} Tasks</span>
                    </div>
                    <div className="h-1.5 w-full bg-stone-100 dark:bg-gray-900 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full transition-all duration-1000" style={{ width: `${memberRate}%` }} />
                    </div>
                  </div>
                )
              })}
              {tasks.length === 0 || !tasks.some(t => t.assignees?.length > 0) ? (
                 <p className="text-xs font-bold text-stone-400 uppercase tracking-widest text-center">No assigned tasks yet</p>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

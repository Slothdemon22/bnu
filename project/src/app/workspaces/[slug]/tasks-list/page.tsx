'use client'

import React, { useState, useEffect } from 'react'
import { 
  CheckSquare, 
  Clock, 
  Zap,
  Briefcase,
  Sparkles
} from 'lucide-react'
import gsap from 'gsap'
import Link from 'next/link'
import { useParams } from 'next/navigation'

type TaskStatus = 'todo' | 'in_progress' | 'done'

interface Assignee {
  id: string
  name: string
  email: string
  imageUrl?: string
}

interface Task {
  id: number
  title: string
  description: string
  status: TaskStatus
  priority: 'low' | 'medium' | 'high'
  assignees: Assignee[]
  dueDate?: string
}

export default function WorkspaceTasksListPage() {
  const params = useParams()
  const slug = params.slug as string
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'assigned_to_me'>('all')
  const [isPrioritizing, setIsPrioritizing] = useState(false)

  const fetchTasks = async (currentFilter: string) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/workspaces/${slug}/tasks?filter=${currentFilter}`)
      const data = await res.json()
      if (data.tasks) {
        setTasks(data.tasks)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleAIPrioritize = async () => {
    if (tasks.length === 0) return
    setIsPrioritizing(true)
    try {
      const res = await fetch('/api/tasks/ai-prioritize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tasks })
      })
      if (res.ok) {
        // Refetch to get new priorities
        await fetchTasks(filter)
        // Trigger a breathtaking re-sort animation
        const ctx = gsap.context(() => {
          gsap.fromTo('.task-card', 
            { opacity: 0, scale: 0.5, rotationX: 45, y: 50 },
            { 
              opacity: 1, 
              scale: 1, 
              rotationX: 0, 
              y: 0, 
              stagger: 0.15, 
              duration: 1.2, 
              ease: 'elastic.out(1, 0.4)', 
              clearProps: 'all' 
            }
          )
        })
        setTimeout(() => ctx.revert(), 2000)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setIsPrioritizing(false)
    }
  }

  useEffect(() => {
    fetchTasks(filter)
  }, [filter, slug])

  useEffect(() => {
    if (!loading && tasks.length > 0) {
      const ctx = gsap.context(() => {
        gsap.fromTo('.task-column', 
          { opacity: 0, x: 20 },
          { opacity: 1, x: 0, stagger: 0.1, duration: 0.8, ease: 'power4.out', clearProps: 'all' }
        )
      })
      return () => ctx.revert()
    }
  }, [loading, tasks])

  const columns: { title: string; status: TaskStatus; icon: React.ReactNode }[] = [
    { title: 'To Do', status: 'todo', icon: <Clock className="w-4 h-4 text-stone-500" /> },
    { title: 'In Progress', status: 'in_progress', icon: <Zap className="w-4 h-4 text-blue-500" /> },
    { title: 'Done', status: 'done', icon: <CheckSquare className="w-4 h-4 text-emerald-600" /> },
  ]

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-10 min-h-[calc(100vh-4rem)]">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-stone-900 dark:text-white tracking-tight uppercase">
            Workspace <span className="text-emerald-500">Tasks</span>
          </h1>
          <p className="text-stone-600 dark:text-gray-400 mt-2 font-medium">
            View all tasks in this workspace.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select 
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="p-3 rounded-2xl border border-stone-200 dark:border-gray-800 text-stone-600 dark:text-gray-400 bg-white dark:bg-gray-900 font-bold focus:ring-2 focus:ring-emerald-500/20 transition-all cursor-pointer"
          >
            <option value="all">All Tasks</option>
            <option value="assigned_to_me">Assigned Directly to Me</option>
          </select>
          <button 
            onClick={handleAIPrioritize}
            disabled={isPrioritizing || tasks.length === 0}
            className="flex items-center gap-2 px-6 py-3 bg-stone-900 dark:bg-white text-white dark:text-stone-900 rounded-2xl font-bold transition-transform hover:scale-105 active:scale-95 shadow-xl shadow-stone-900/20 dark:shadow-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPrioritizing ? <Sparkles className="w-5 h-5 animate-pulse" /> : <Sparkles className="w-5 h-5 text-emerald-400" />}
            {isPrioritizing ? 'Analyzing...' : 'AI Prioritize'}
          </button>
          <Link
            href={`/workspaces/${slug}/tasks`}
            className="px-6 py-3 bg-emerald-600 text-white rounded-2xl font-bold transition-transform hover:scale-105 active:scale-95 shadow-xl shadow-emerald-500/20"
          >
            Open Kanban Board
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="flex gap-6 overflow-x-auto pb-10 scrollbar-hide">
          {columns.map((col) => (
            <div key={col.status} className="task-column flex-shrink-0 w-80 space-y-4">
              <div className="flex items-center justify-between px-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-white dark:bg-gray-900 border border-stone-100 dark:border-gray-800 shadow-sm">
                    {col.icon}
                  </span>
                  <h2 className="font-bold text-stone-900 dark:text-white uppercase tracking-tight">{col.title}</h2>
                  <span className="text-xs font-bold text-stone-400 bg-stone-100 dark:bg-gray-900 px-2 py-0.5 rounded-full">
                    {tasks.filter(t => t.status === col.status).length}
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                {tasks
                  .filter((t) => t.status === col.status)
                  .sort((a, b) => {
                    const priorityWeight = { high: 3, medium: 2, low: 1 }
                    return (priorityWeight[b.priority] || 0) - (priorityWeight[a.priority] || 0)
                  })
                  .map((task) => (
                    <Link
                      href={`/workspaces/${slug}/tasks`}
                      key={task.id}
                      className="task-card block group bg-white dark:bg-gray-900 border border-stone-200 dark:border-gray-800 rounded-3xl p-5 shadow-sm hover:shadow-xl hover:shadow-emerald-500/5 transition-all active:scale-95 border-b-4 border-b-transparent hover:border-b-emerald-500"
                    >
                      <div className="flex items-start justify-between gap-3 mb-4">
                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                          task.priority === 'high' ? 'bg-red-100 text-red-600' : 
                          task.priority === 'medium' ? 'bg-blue-100 text-blue-600' : 
                          'bg-stone-100 text-stone-600'
                        }`}>
                          {task.priority || 'no priority'}
                        </span>
                      </div>
                      
                      <h3 className="font-bold text-stone-900 dark:text-white mb-2 leading-tight group-hover:text-emerald-500 transition-colors">
                        {task.title}
                      </h3>
                      <p className="text-sm text-stone-500 dark:text-gray-500 mb-6 line-clamp-2 leading-relaxed">
                        {task.description || 'No description'}
                      </p>

                      <div className="flex items-center justify-between pt-4 border-t border-stone-50 dark:border-gray-800">
                        <div className="flex items-center -space-x-2">
                          {task.assignees?.slice(0, 3).map((assignee) => (
                            <div key={assignee.id} className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-xs font-bold text-emerald-600 border-2 border-white dark:border-gray-900 z-10 overflow-hidden">
                              {assignee.imageUrl ? (
                                <img src={assignee.imageUrl} alt={assignee.name} className="w-full h-full object-cover" />
                              ) : (
                                (assignee.name?.[0] || '?').toUpperCase()
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </Link>
                  ))}
                {tasks.filter(t => t.status === col.status).length === 0 && (
                  <div className="w-full py-8 rounded-3xl border-2 border-dashed border-stone-200 dark:border-gray-800 flex items-center justify-center">
                     <p className="text-sm font-bold text-stone-400 uppercase tracking-widest">No tasks</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

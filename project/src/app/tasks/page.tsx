'use client'

import React, { useState, useEffect } from 'react'
import { 
  CheckSquare, 
  Clock, 
  AlertCircle, 
  Plus, 
  MoreHorizontal, 
  User as UserIcon,
  MessageSquare,
  Sparkles,
  Zap,
  Filter
} from 'lucide-react'
import gsap from 'gsap'

type TaskStatus = 'todo' | 'in-progress' | 'completed' | 'ai-suggested'

interface Task {
  id: string
  title: string
  description: string
  status: TaskStatus
  priority: 'low' | 'medium' | 'high'
  assignee?: string
  comments: number
  dueDate?: string
}

const INITIAL_TASKS: Task[] = [
  {
    id: '1',
    title: 'Finalize Workspace Onboarding',
    description: 'Ensure all team members have completed their profile setup.',
    status: 'in-progress',
    priority: 'high',
    assignee: 'You',
    comments: 3,
    dueDate: 'Today'
  },
  {
    id: '2',
    title: 'AI Workflow Integration',
    description: 'Connect internal LLM models to the task prioritization engine.',
    status: 'todo',
    priority: 'medium',
    assignee: 'Unassigned',
    comments: 0,
    dueDate: 'Tomorrow'
  },
  {
    id: '3',
    title: 'Optimize Team Sync',
    description: 'Auto-suggested based on recent meeting transcripts.',
    status: 'ai-suggested',
    priority: 'medium',
    comments: 1
  }
]

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS)
  const [activeTab, setActiveTab] = useState<TaskStatus | 'all'>('all')

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo('.task-column', 
        { 
          opacity: 0, 
          x: 20 
        },
        {
          opacity: 1,
          x: 0,
          stagger: 0.1,
          duration: 1,
          ease: 'power4.out',
          clearProps: 'all'
        }
      )
    })
    return () => ctx.revert()
  }, [])

  const columns: { title: string; status: TaskStatus; icon: React.ReactNode }[] = [
    { title: 'AI Suggested', status: 'ai-suggested', icon: <Sparkles className="w-4 h-4 text-emerald-500" /> },
    { title: 'To Do', status: 'todo', icon: <Clock className="w-4 h-4 text-blue-500" /> },
    { title: 'In Progress', status: 'in-progress', icon: <Zap className="w-4 h-4 text-orange-500" /> },
    { title: 'Completed', status: 'completed', icon: <CheckSquare className="w-4 h-4 text-emerald-600" /> },
  ]

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-10 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-stone-900 dark:text-white tracking-tight">
            Team <span className="text-emerald-500">Tasks</span>
          </h1>
          <p className="text-stone-600 dark:text-gray-400 mt-2 font-medium">
            AI-powered task management for high-performance teams.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="p-3 rounded-2xl border border-stone-200 dark:border-gray-800 text-stone-600 dark:text-gray-400 hover:bg-stone-100 dark:hover:bg-gray-900 transition-all">
            <Filter className="w-5 h-5" />
          </button>
          <button className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-2xl font-bold transition-transform hover:scale-105 active:scale-95 shadow-xl shadow-emerald-500/20">
            <Plus className="w-5 h-5" />
            New Task
          </button>
        </div>
      </div>

      <div className="flex gap-6 overflow-x-auto pb-10 scrollbar-hide">
        {columns.map((col) => (
          <div key={col.status} className="task-column flex-shrink-0 w-80 space-y-4">
            <div className="flex items-center justify-between px-2 mb-2">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-white dark:bg-gray-900 border border-stone-100 dark:border-gray-800 shadow-sm">
                  {col.icon}
                </span>
                <h2 className="font-bold text-stone-900 dark:text-white">{col.title}</h2>
                <span className="text-xs font-bold text-stone-400 bg-stone-100 dark:bg-gray-900 px-2 py-0.5 rounded-full">
                  {tasks.filter(t => t.status === col.status).length}
                </span>
              </div>
              <button className="text-stone-400 hover:text-stone-900 dark:hover:text-white transition-colors">
                <MoreHorizontal className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {tasks
                .filter((t) => t.status === col.status)
                .map((task) => (
                  <div 
                    key={task.id}
                    className="group bg-white dark:bg-gray-900 border border-stone-200 dark:border-gray-800 rounded-3xl p-5 shadow-sm hover:shadow-xl hover:shadow-emerald-500/5 transition-all cursor-grab active:cursor-grabbing border-b-4 border-b-transparent hover:border-b-emerald-500"
                  >
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                        task.priority === 'high' ? 'bg-red-100 text-red-600' : 
                        task.priority === 'medium' ? 'bg-blue-100 text-blue-600' : 
                        'bg-stone-100 text-stone-600'
                      }`}>
                        {task.priority}
                      </span>
                      <button className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreHorizontal className="w-4 h-4 text-stone-400" />
                      </button>
                    </div>
                    
                    <h3 className="font-bold text-stone-900 dark:text-white mb-2 leading-tight group-hover:text-emerald-500 transition-colors">
                      {task.title}
                    </h3>
                    <p className="text-sm text-stone-500 dark:text-gray-500 mb-6 line-clamp-2 leading-relaxed">
                      {task.description}
                    </p>

                    <div className="flex items-center justify-between pt-4 border-t border-stone-50 dark:border-gray-800">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-xs font-bold text-emerald-600 border border-emerald-500/20">
                          {task.assignee?.[0] || '?'}
                        </div>
                        {task.comments > 0 && (
                          <div className="flex items-center gap-1 text-xs font-bold text-stone-400">
                            <MessageSquare className="w-3 h-3" />
                            {task.comments}
                          </div>
                        )}
                      </div>
                      {task.dueDate && (
                        <span className="text-[10px] font-bold text-stone-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {task.dueDate}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              <button className="w-full py-4 rounded-3xl border-2 border-dashed border-stone-200 dark:border-gray-800 text-stone-400 hover:border-emerald-500 hover:text-emerald-500 transition-all font-bold text-sm flex items-center justify-center gap-2">
                <Plus className="w-4 h-4" />
                Add Item
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

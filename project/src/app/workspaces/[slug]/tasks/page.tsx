'use client'

import React, { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { 
  CheckSquare, 
  Plus, 
  Target, 
  Trash2, 
  Settings, 
  CheckCircle2, 
  Clock, 
  Loader2,
  Filter,
  MoreHorizontal,
  Search,
  Layout,
  LayoutGrid,
  List,
  Columns,
  GripHorizontal,
  Video
} from 'lucide-react'
import { TaskCreateModal } from '@/components/tasks/TaskCreateModal'
import toast from 'react-hot-toast'
import { AnimatePresence, motion } from 'framer-motion'

export default function WorkspaceTasksPage() {
  const params = useParams()
  const slug = params.slug as string
  const [tasks, setTasks] = useState<any[]>([])
  const [workspace, setWorkspace] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [selectedTask, setSelectedTask] = useState<any>(null)
  const [initialModalStep, setInitialModalStep] = useState(1)
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'board'>('board')
  const [searchQuery, setSearchQuery] = useState('')
  const [automationFeed, setAutomationFeed] = useState<{ id: number; title: string } | null>(null)

  const handleDragStart = (e: React.DragEvent, taskId: number) => {
    e.dataTransfer.setData('taskId', taskId.toString())
  }

  const handleDrop = async (e: React.DragEvent, newStatus: string) => {
    e.preventDefault()
    const taskIdStr = e.dataTransfer.getData('taskId')
    if (!taskIdStr) return
    const taskId = parseInt(taskIdStr)
    
    const originalTasks = [...tasks]
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t))
    
    try {
      const res = await fetch(`/api/workspaces/${slug}/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })
      if (!res.ok) throw new Error('Failed')
      const data = await res.json()
      if (data.task) {
        setTasks(prev => prev.map(t => t.id === data.task.id ? data.task : t))
      }
      if (data.recurringGeneratedTask) {
        setTasks(prev => [data.recurringGeneratedTask, ...prev])
        setAutomationFeed({ id: data.recurringGeneratedTask.id, title: data.recurringGeneratedTask.title })
        toast.success(`AI regenerated recurring task: ${data.recurringGeneratedTask.title}`)
      }
    } catch (err) {
      toast.error('Failed to update task status')
      setTasks(originalTasks)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  useEffect(() => {
    fetchWorkspace()
    fetchTasks()
  }, [slug])

  useEffect(() => {
    if (!automationFeed) return
    const timer = setTimeout(() => setAutomationFeed(null), 4500)
    return () => clearTimeout(timer)
  }, [automationFeed])

  const fetchWorkspace = async () => {
    try {
      const res = await fetch(`/api/workspaces/${slug}`)
      const data = await res.json()
      if (data.workspace) setWorkspace(data.workspace)
    } catch (err) {
      console.error(err)
    }
  }

  const fetchTasks = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/workspaces/${slug}/tasks`)
      const data = await res.json()
      if (data.tasks) setTasks(data.tasks)
    } catch (err) {
      toast.error('Failed to load tasks')
    } finally {
      setLoading(false)
    }
  }

  const isAdmin = workspace?.role === 'owner' || workspace?.role === 'admin'

  if (loading && tasks.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Target className="w-6 h-6 text-emerald-500 animate-pulse" />
          </div>
        </div>
        <div className="text-center space-y-2">
          <h2 className="text-xl font-black text-stone-900 dark:text-white uppercase tracking-tighter">Syncing Tasks</h2>
          <p className="text-xs font-bold text-stone-400 uppercase tracking-[0.3em] animate-pulse">Initializing Board...</p>
        </div>
      </div>
    )
  }

  // The Admin Only block has been removed so all users can see tasks.
  const handleDeleteTask = async (taskId: number) => {
    if (!confirm('Are you sure you want to delete this task? This action cannot be undone.')) return
    
    const toastId = toast.loading('Deleting task...')
    try {
      const res = await fetch(`/api/workspaces/${slug}/tasks/${taskId}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Task deleted', { id: toastId })
        fetchTasks()
      } else {
        throw new Error('Failed to delete task')
      }
    } catch (err: any) {
      toast.error(err.message, { id: toastId })
    }
  }

  const filteredTasks = tasks.filter(t => 
    t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading && tasks.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Target className="w-6 h-6 text-emerald-500 animate-pulse" />
          </div>
        </div>
        <div className="text-center space-y-2">
          <h2 className="text-xl font-black text-stone-900 dark:text-white uppercase tracking-tighter">Syncing Tasks</h2>
          <p className="text-xs font-bold text-stone-400 uppercase tracking-[0.3em] animate-pulse">Initializing Board...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-8 space-y-8 pb-20">
      <AnimatePresence>
        {automationFeed && (
          <motion.div
            initial={{ opacity: 0, y: -24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.98 }}
            transition={{ duration: 0.25 }}
            className="fixed right-6 top-24 z-50 rounded-2xl border border-emerald-300/50 bg-emerald-500/10 px-4 py-3 shadow-2xl shadow-emerald-500/20 backdrop-blur-md"
          >
            <div className="flex items-center gap-3">
              <div className="h-2.5 w-2.5 animate-pulse rounded-full bg-emerald-500" />
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600">AI Automation</p>
                <p className="text-sm font-bold text-stone-900 dark:text-white">Recurring task regenerated: {automationFeed.title}</p>
              </div>
              <button
                onClick={() => setAutomationFeed(null)}
                className="rounded-lg p-1 text-stone-500 hover:bg-white/60"
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-stone-900 dark:text-white tracking-tighter uppercase">
            Task <span className="text-emerald-500">Management</span>
          </h1>
          <p className="text-stone-500 font-medium font-mono text-sm uppercase opacity-60 mt-1">Control Center / Tasks</p>
        </div>
        <button 
          onClick={() => {
            setSelectedTask(null)
            setShowModal(true)
          }}
          className="flex items-center justify-center gap-3 px-8 py-4 bg-emerald-600 text-white rounded-[2rem] font-black shadow-xl shadow-emerald-500/20 hover:scale-105 active:scale-95 transition-all group shrink-0"
        >
          <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
          NEW MISSION
        </button>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-gray-950 p-4 rounded-[2rem] border border-stone-100 dark:border-gray-800 shadow-sm">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <input 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tasks, descriptions..."
            className="w-full pl-12 pr-4 py-3 bg-stone-50 dark:bg-gray-900 border border-stone-100 dark:border-gray-800 rounded-2xl outline-none focus:border-emerald-500/50 transition-all font-bold text-sm"
          />
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-stone-50 dark:bg-gray-900 p-1 rounded-xl border border-stone-100 dark:border-gray-800">
            <button 
              onClick={() => setViewMode('board')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'board' ? 'bg-white dark:bg-gray-800 text-emerald-500 shadow-sm' : 'text-stone-400'}`}
            >
              <Columns className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-gray-800 text-emerald-500 shadow-sm' : 'text-stone-400'}`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white dark:bg-gray-800 text-emerald-500 shadow-sm' : 'text-stone-400'}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
          <button className="flex items-center gap-2 px-4 py-3 bg-stone-50 dark:bg-gray-900 border border-stone-100 dark:border-gray-800 rounded-xl font-black text-[10px] text-stone-500 uppercase tracking-widest hover:bg-stone-100 dark:hover:bg-gray-800 transition-all">
            <Filter className="w-3 h-3" /> Filter
          </button>
        </div>
      </div>

      {viewMode === 'board' ? (
        <div className="flex gap-6 overflow-x-auto pb-8 custom-scrollbar snap-x min-h-[60vh]">
          {[
            { id: 'todo', label: 'To Do', color: 'bg-stone-100 dark:bg-gray-900 text-stone-600 dark:text-stone-400' },
            { id: 'in_progress', label: 'In Progress', color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' },
            { id: 'review', label: 'In Review', color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400' },
            { id: 'done', label: 'Completed', color: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' }
          ].map(column => (
            <div 
              key={column.id}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, column.id)}
              className="flex-shrink-0 w-80 sm:w-96 flex flex-col gap-4 snap-start"
            >
              <div className="flex items-center justify-between">
                <div className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest ${column.color}`}>
                  {column.label} ({filteredTasks.filter(t => t.status === column.id).length})
                </div>
              </div>
              
              <div className="flex-1 flex flex-col gap-4 min-h-[150px] p-2 -mx-2 rounded-2xl border-2 border-dashed border-transparent hover:border-stone-200 dark:hover:border-gray-800 transition-all">
                {filteredTasks.filter(t => t.status === column.id).map(task => (
                  <div 
                    key={task.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, task.id)}
                    onClick={() => {
                      setSelectedTask(task)
                      setInitialModalStep(1)
                      setShowModal(true)
                    }}
                    className="group bg-white dark:bg-gray-950 p-5 rounded-[2rem] border border-stone-100 dark:border-gray-800 shadow-sm hover:shadow-xl hover:shadow-emerald-500/10 transition-all cursor-grab active:cursor-grabbing hover:border-emerald-500/50"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                        task.priority === 'urgent' ? 'bg-red-100 text-red-600' : 
                        task.priority === 'high' ? 'bg-orange-100 text-orange-600' : 
                        'bg-emerald-100 text-emerald-600'
                      }`}>
                        {task.priority}
                      </div>
                      <GripHorizontal className="w-4 h-4 text-stone-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    
                    <h4 className="font-black text-stone-900 dark:text-white leading-tight mb-2 uppercase tracking-tight group-hover:text-emerald-500 transition-colors flex items-center gap-2 flex-wrap">
                      {task.title}
                      {task.isRecurring && (
                        <div className="flex items-center gap-1.5 rounded-lg border border-emerald-400/40 bg-emerald-500/15 px-2 py-1 text-[8px] font-black uppercase tracking-widest text-emerald-600 shadow-lg shadow-emerald-500/10">
                          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                          Recurring
                        </div>
                      )}
                      {task.roomId && (
                        <div className="flex items-center gap-1.5 px-2 py-1 bg-emerald-500 text-white rounded-lg shadow-lg shadow-emerald-500/30 shrink-0 animate-pulse">
                          <Video className="w-3.5 h-3.5" />
                          <span className="text-[8px] font-black uppercase tracking-widest">Meet</span>
                        </div>
                      )}
                    </h4>
                    
                    {task.milestones && task.milestones.length > 0 && (
                      <div 
                        className="mt-4 space-y-2 cursor-pointer hover:bg-stone-50 dark:hover:bg-gray-900/50 p-2 -mx-2 rounded-xl transition-colors"
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedTask(task)
                          setInitialModalStep(3)
                          setShowModal(true)
                        }}
                      >
                        <div className="flex items-center justify-between text-[9px] font-black text-stone-400 uppercase tracking-widest">
                          <span>Phases</span>
                          <span>{task.milestones.filter((m: any) => m.status === 'completed').length}/{task.milestones.length}</span>
                        </div>
                        <div className="flex gap-1">
                          {task.milestones.map((m: any, i: number) => (
                            <div 
                              key={i} 
                              className={`h-1.5 flex-1 rounded-full ${
                                m.status === 'completed' ? 'bg-emerald-500' : 
                                m.status === 'in_progress' ? 'bg-blue-500' : 
                                'bg-stone-100 dark:bg-gray-800'
                              }`} 
                              title={m.name}
                            />
                          ))}
                        </div>
                        <div className="pt-2 text-[10px] text-stone-500 font-medium truncate">
                          {task.milestones[0]?.name}
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between mt-5 pt-4 border-t border-stone-50 dark:border-gray-900">
                      <div className="flex -space-x-2">
                        {task.assignees?.map((a: any) => (
                          <div key={a.id} className="w-6 h-6 rounded-full border-2 border-white dark:border-gray-950 bg-stone-100 dark:bg-gray-800 flex items-center justify-center overflow-hidden">
                            {a.imageUrl ? <img src={a.imageUrl} className="w-full h-full object-cover" referrerPolicy="no-referrer" /> : <span className="text-[8px] font-bold">{a.name?.[0] || 'U'}</span>}
                          </div>
                        ))}
                      </div>
                      {task.dueDate && (
                        <span className="text-[9px] font-black text-stone-400 uppercase tracking-widest flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTasks.length === 0 ? (
            <div className="col-span-full py-32 text-center border-2 border-dashed border-stone-100 dark:border-gray-800 rounded-[3rem]">
              <div className="w-20 h-20 bg-stone-50 dark:bg-gray-900 rounded-full flex items-center justify-center mx-auto mb-6">
                <Target className="w-10 h-10 text-stone-200" />
              </div>
              <h3 className="text-xl font-black text-stone-900 dark:text-white uppercase">No Tasks Found</h3>
              <p className="text-sm text-stone-400 font-medium mt-2 max-w-xs mx-auto">Deploy your first mission to start tracking your workspace progress.</p>
            </div>
          ) : (
            filteredTasks.map((task) => (
              <div 
                key={task.id} 
                className="group relative bg-white dark:bg-gray-950 rounded-[2.5rem] border border-stone-100 dark:border-gray-800 p-6 shadow-sm hover:shadow-xl hover:shadow-emerald-500/5 hover:border-emerald-500/50 transition-all cursor-pointer"
                onClick={() => {
                  setSelectedTask(task)
                  setInitialModalStep(1)
                  setShowModal(true)
                }}
              >
                <div className="flex items-start justify-between mb-6">
                  <div className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                    task.priority === 'urgent' ? 'bg-red-100 text-red-600' : 
                    task.priority === 'high' ? 'bg-orange-100 text-orange-600' : 
                    'bg-emerald-100 text-emerald-600'
                  }`}>
                    {task.priority}
                  </div>
                  <div className="flex gap-2">
                    {isAdmin && (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteTask(task.id)
                        }}
                        className="p-2 text-stone-300 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                <h3 className="text-xl font-black text-stone-900 dark:text-white uppercase tracking-tighter leading-none mb-3 group-hover:text-emerald-500 transition-colors flex items-center gap-2 flex-wrap">
                  {task.title}
                  {task.isRecurring && (
                    <div className="flex items-center gap-1.5 rounded-lg border border-emerald-400/40 bg-emerald-500/15 px-2 py-1 text-[8px] font-black uppercase tracking-widest text-emerald-600 shadow-lg shadow-emerald-500/10">
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                      Recurring
                    </div>
                  )}
                  {task.roomId && (
                    <div className="flex items-center gap-1.5 px-2 py-1 bg-emerald-500 text-white rounded-lg shadow-lg shadow-emerald-500/30 shrink-0 animate-pulse">
                      <Video className="w-4 h-4" />
                      <span className="text-[9px] font-black uppercase tracking-widest">Meet</span>
                    </div>
                  )}
                </h3>
                <p className="text-sm text-stone-500 dark:text-gray-400 font-medium line-clamp-2 mb-6">
                  {task.description || 'No description provided.'}
                </p>

                <div className="flex items-center gap-4 pt-6 border-t border-stone-50 dark:border-gray-900">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3 h-3 text-stone-300" />
                    <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest">
                      {new Date(task.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Layout className="w-3 h-3 text-emerald-500" />
                    <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">
                      {task.milestones?.length || 0} Phases
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        /* List View */
        <div className="space-y-3">
          {filteredTasks.map((task) => (
            <div 
              key={task.id}
              onClick={() => {
                setSelectedTask(task)
                setInitialModalStep(1)
                setShowModal(true)
              }}
              className="flex items-center justify-between p-4 bg-white dark:bg-gray-950 rounded-2xl border border-stone-100 dark:border-gray-800 hover:border-emerald-500/50 transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className={`w-2 h-10 rounded-full ${
                  task.priority === 'urgent' ? 'bg-red-500' : 
                  task.priority === 'high' ? 'bg-orange-500' : 
                  'bg-emerald-500'
                }`} />
                <div className="min-w-0">
                  <h3 className="font-black text-stone-900 dark:text-white uppercase tracking-tight truncate flex items-center gap-2">
                    {task.title}
                    {task.isRecurring && (
                      <div className="flex items-center gap-1.5 rounded-md border border-emerald-400/40 bg-emerald-500/15 px-2 py-0.5 text-[8px] font-black uppercase tracking-widest text-emerald-600 shadow-lg shadow-emerald-500/10">
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                        Recurring
                      </div>
                    )}
                    {task.roomId && (
                      <div className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-500 text-white rounded-md shadow-md shadow-emerald-500/30 shrink-0 animate-pulse">
                        <Video className="w-3 h-3" />
                        <span className="text-[8px] font-black uppercase tracking-widest">Meet</span>
                      </div>
                    )}
                  </h3>
                  <p className="text-xs text-stone-400 font-bold uppercase tracking-widest">{task.priority} PRIORITY</p>
                </div>
              </div>
              <div className="flex items-center gap-8 shrink-0">
                <div className="hidden md:flex flex-col items-end">
                  <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Due Date</span>
                  <span className="text-xs font-bold text-stone-900 dark:text-white">{task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No Date'}</span>
                </div>
                <div className="hidden md:flex flex-col items-end">
                  <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Phases</span>
                  <span className="text-xs font-bold text-emerald-500">{task.milestones?.length || 0} Active</span>
                </div>
                {isAdmin && (
                  <button 
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteTask(task.id)
                    }}
                    className="p-2 text-stone-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <TaskCreateModal 
          slug={slug}
          task={selectedTask}
          initialStep={initialModalStep}
          onClose={() => setShowModal(false)}
          onSuccess={(updatedTask) => {
            fetchTasks()
            setTasks(prev => {
              const exists = prev.find(t => t.id === updatedTask.id)
              if (exists) {
                return prev.map(t => t.id === updatedTask.id ? updatedTask : t)
              }
              return [updatedTask, ...prev]
            })
          }}
        />
      )}
    </div>
  )
}

'use client'

import React, { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { FileText, Download, FileSpreadsheet, Loader2, Target, Calendar, CheckSquare, Clock } from 'lucide-react'
import toast from 'react-hot-toast'

export default function WorkspaceReportsPage() {
  const params = useParams()
  const slug = params.slug as string
  const [tasks, setTasks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [exportingId, setExportingId] = useState<number | null>(null)

  useEffect(() => {
    fetchTasks()
  }, [slug])

  const fetchTasks = async () => {
    try {
      const res = await fetch(`/api/workspaces/${slug}/tasks`)
      const data = await res.json()
      if (data.tasks) setTasks(data.tasks)
    } catch (err) {
      toast.error('Failed to load tasks for reporting')
    } finally {
      setLoading(false)
    }
  }

  const exportToCSV = (task: any) => {
    try {
      const headers = ['ID', 'Title', 'Description', 'Status', 'Priority', 'Assignees', 'Milestones', 'Due Date', 'Created At']
      const row = [
        task.id,
        `"${task.title.replace(/"/g, '""')}"`,
        `"${(task.description || '').replace(/"/g, '""')}"`,
        task.status,
        task.priority,
        task.assignees?.map((a: any) => a.name || a.email).join('; ') || 'None',
        task.milestones?.length || 0,
        task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'N/A',
        new Date(task.createdAt).toLocaleDateString()
      ]
      const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), row.join(',')].join('\n')
      const encodedUri = encodeURI(csvContent)
      const link = document.createElement("a")
      link.setAttribute("href", encodedUri)
      link.setAttribute("download", `task-${task.id}-report.csv`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      toast.success('Excel/CSV Export downloaded!')
    } catch (err) {
      toast.error('Failed to export CSV')
    }
  }

  const exportToPDF = (task: any) => {
    setExportingId(task.id)
    setTimeout(() => {
      // Create a temporary window to print the task details
      const printWindow = window.open('', '_blank')
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Task Report - ${task.title}</title>
              <style>
                body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; padding: 40px; color: #333; line-height: 1.6; }
                .header { border-bottom: 2px solid #10b981; padding-bottom: 20px; margin-bottom: 30px; }
                .title { font-size: 28px; font-weight: 900; margin: 0; color: #111; text-transform: uppercase; }
                .meta { color: #666; font-size: 14px; margin-top: 10px; }
                .badge { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; text-transform: uppercase; background: #f3f4f6; margin-right: 10px; }
                .section { margin-bottom: 30px; }
                .section-title { font-size: 16px; font-weight: bold; text-transform: uppercase; color: #666; border-bottom: 1px solid #eee; padding-bottom: 5px; margin-bottom: 15px; }
                .assignees { display: flex; gap: 10px; flex-wrap: wrap; }
                .assignee { background: #f9fafb; border: 1px solid #e5e7eb; padding: 5px 10px; border-radius: 6px; font-size: 14px; }
              </style>
            </head>
            <body>
              <div class="header">
                <h1 class="title">${task.title}</h1>
                <div class="meta">
                  <span class="badge">Status: ${task.status}</span>
                  <span class="badge">Priority: ${task.priority}</span>
                  <span class="badge">Due: ${task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'None'}</span>
                </div>
              </div>
              
              <div class="section">
                <div class="section-title">Description</div>
                <p>${task.description || 'No description provided.'}</p>
              </div>

              <div class="section">
                <div class="section-title">Assigned Team</div>
                <div class="assignees">
                  ${task.assignees?.map((a: any) => `<div class="assignee">${a.name || a.email}</div>`).join('') || '<p>No team members assigned.</p>'}
                </div>
              </div>

              <div class="section">
                <div class="section-title">Project Phases (${task.milestones?.length || 0})</div>
                <ul>
                  ${task.milestones?.map((m: any) => `<li><strong>${m.name}</strong> - Status: ${m.status} (Est: ${m.estimatedTime || 'N/A'})</li>`).join('') || '<li>No phases defined.</li>'}
                </ul>
              </div>
              
              <div class="meta" style="margin-top: 50px; font-size: 12px; text-align: center;">
                Generated by Momentum on ${new Date().toLocaleString()}
              </div>
            </body>
          </html>
        `)
        printWindow.document.close()
        printWindow.focus()
        printWindow.print()
      } else {
        toast.error('Popup blocked! Please allow popups to export PDF.')
      }
      setExportingId(null)
      toast.success('PDF Report Generated!')
    }, 500)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-black text-stone-900 dark:text-white tracking-tighter uppercase">
          Task <span className="text-emerald-500">Reports</span>
        </h1>
        <p className="text-stone-500 font-medium font-mono text-sm uppercase opacity-60 mt-1">Control Center / Analytics / Export</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Tasks', value: tasks.length, icon: Target },
          { label: 'Completed Tasks', value: tasks.filter(t => t.status === 'done').length, icon: CheckSquare },
          { label: 'High/Urgent Priority', value: tasks.filter(t => ['high', 'urgent'].includes(t.priority)).length, icon: Clock },
          { label: 'Upcoming Deadlines', value: tasks.filter(t => t.dueDate && new Date(t.dueDate) > new Date()).length, icon: Calendar },
        ].map((stat, i) => (
          <div key={i} className="bg-white dark:bg-gray-950 border border-stone-100 dark:border-gray-800 rounded-3xl p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500 flex items-center justify-center shrink-0">
              <stat.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-black text-stone-900 dark:text-white leading-none">{stat.value}</p>
              <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mt-1">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Task List for Export */}
      <div className="bg-white dark:bg-gray-950 border border-stone-100 dark:border-gray-800 rounded-[2.5rem] overflow-hidden shadow-sm">
        <div className="p-6 border-b border-stone-100 dark:border-gray-800 bg-stone-50/50 dark:bg-gray-900/50">
          <h2 className="text-lg font-black text-stone-900 dark:text-white uppercase tracking-tight">Generate Reports</h2>
        </div>
        
        <div className="divide-y divide-stone-100 dark:divide-gray-800">
          {tasks.length === 0 ? (
            <div className="p-12 text-center text-stone-500 font-medium">No tasks found to generate reports.</div>
          ) : (
            tasks.map(task => (
              <div key={task.id} className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 hover:bg-stone-50/50 dark:hover:bg-gray-900/30 transition-colors">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-black text-stone-900 dark:text-white uppercase tracking-tight text-lg">{task.title}</h3>
                    <span className={`px-2 py-0.5 text-[9px] font-black uppercase tracking-widest rounded-md ${
                      task.status === 'done' ? 'bg-emerald-100 text-emerald-600' :
                      task.status === 'in_progress' ? 'bg-blue-100 text-blue-600' :
                      'bg-stone-100 dark:bg-gray-800 text-stone-500'
                    }`}>
                      {task.status.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-xs text-stone-500 dark:text-gray-400 font-medium line-clamp-1">{task.description || 'No description'}</p>
                  <div className="flex items-center gap-4 mt-3">
                    <span className="text-[10px] font-bold text-stone-400 flex items-center gap-1 uppercase">
                      <Target className="w-3 h-3" /> {task.priority} Priority
                    </span>
                    <span className="text-[10px] font-bold text-stone-400 flex items-center gap-1 uppercase">
                      <CheckSquare className="w-3 h-3" /> {task.milestones?.length || 0} Phases
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <button 
                    onClick={() => exportToCSV(task)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-stone-100 dark:bg-gray-900 text-stone-600 dark:text-stone-300 hover:text-emerald-600 dark:hover:text-emerald-400 rounded-xl font-bold text-xs uppercase tracking-widest transition-all active:scale-95"
                  >
                    <FileSpreadsheet className="w-4 h-4" /> Excel / CSV
                  </button>
                  <button 
                    onClick={() => exportToPDF(task)}
                    disabled={exportingId === task.id}
                    className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white hover:bg-emerald-700 rounded-xl font-bold text-xs uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                  >
                    {exportingId === task.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                    PDF Report
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

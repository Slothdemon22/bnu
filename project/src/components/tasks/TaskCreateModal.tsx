'use client'

import React, { useState, useEffect, useRef } from 'react'
import { 
  X, 
  CheckSquare, 
  Users, 
  Calendar, 
  Tag as TagIcon, 
  Paperclip, 
  Flag, 
  Plus, 
  Trash2, 
  Loader2,
  ChevronRight,
  ChevronLeft,
  Layout,
  Layers,
  StickyNote,
  Clock,
  Target,
  Mic,
  Square,
  Sparkles,
  Trophy,
  Repeat
} from 'lucide-react'
import toast from 'react-hot-toast'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'

interface Member {
  id: number
  name: string
  email: string
  imageUrl?: string | null
  points?: number
  jobTitle?: string | null
}

interface Milestone {
  name: string
  description: string
  status: string
  estimatedTime: string
  difficulty: string
  tags: string[]
  notes: string
  attachments: { name: string, url: string }[]
}

interface TaskCreateModalProps {
  slug: string
  task?: any
  onClose: () => void
  onSuccess: (task: any) => void
  initialStep?: number
}

export function TaskCreateModal({ slug, task, onClose, onSuccess, initialStep = 1 }: TaskCreateModalProps) {
  const { user } = useAuth()
  const [step, setStep] = useState(initialStep)
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [schedulingMeeting, setSchedulingMeeting] = useState(false)
  const [meetingTime, setMeetingTime] = useState('') // empty means 'Anytime'
  const [workspaceRole, setWorkspaceRole] = useState('')
  
  const [schedulingGoogle, setSchedulingGoogle] = useState(false)
  const [googleDate, setGoogleDate] = useState('')
  const [googleStartTime, setGoogleStartTime] = useState('')
  const [googleEndTime, setGoogleEndTime] = useState('')
  
  // Basic Info
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState('medium')
  const [dueDate, setDueDate] = useState('')
  const [isRecurring, setIsRecurring] = useState(false)
  const [recurringPattern, setRecurringPattern] = useState<'daily' | 'weekly' | 'monthly'>('daily')
  const [recurringInterval, setRecurringInterval] = useState(1)
  const [recurringDays, setRecurringDays] = useState<number[]>([])
  const [recurringDueTime, setRecurringDueTime] = useState('')
  const [recurrenceEndDate, setRecurrenceEndDate] = useState('')
  
  // Assignees
  const [members, setMembers] = useState<Member[]>([])
  const [searchMember, setSearchMember] = useState('')
  const [selectedMemberIds, setSelectedMemberIds] = useState<number[]>([])
  const [showMemberDropdown, setShowMemberDropdown] = useState(false)
  const dropdownContainerRef = useRef<HTMLDivElement>(null)
  
  // Tags
  const [tags, setTags] = useState<string[]>([])
  const [currentTag, setCurrentTag] = useState('')
  
  // Milestones
  const [milestones, setMilestones] = useState<Milestone[]>([
    { name: 'Initial Setup', description: '', status: 'pending', estimatedTime: '', difficulty: 'medium', tags: [], notes: '', attachments: [] }
  ])
  
  const [attachments, setAttachments] = useState<{ name: string, url: string }[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Dictation
  const [isDictating, setIsDictating] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])

  useEffect(() => {
    fetchMembers()
    
    function handleClickOutside(event: MouseEvent) {
      if (dropdownContainerRef.current && !dropdownContainerRef.current.contains(event.target as Node)) {
        setShowMemberDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [slug])

  useEffect(() => {
    if (task) {
      setTitle(task.title || '')
      setDescription(task.description || '')
      setPriority(task.priority || 'medium')
      setDueDate(task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '')
      setIsRecurring(!!task.isRecurring)
      setRecurringPattern((task.recurringPattern as 'daily' | 'weekly' | 'monthly') || 'daily')
      setRecurringInterval(task.recurringInterval || 1)
      setRecurringDays(task.recurringDays || [])
      setRecurringDueTime(task.recurringDueTime || '')
      setRecurrenceEndDate(task.recurrenceEndDate ? new Date(task.recurrenceEndDate).toISOString().split('T')[0] : '')
      setTags(task.tags || [])
      setSelectedMemberIds(task.assignees?.map((a: any) => a.id) || task.assigneeIds || [])
      if (task.milestones && task.milestones.length > 0) {
        setMilestones(task.milestones.map((m: any) => ({
          name: m.name,
          description: m.description || '',
          status: m.status || 'pending',
          estimatedTime: m.estimatedTime || '',
          difficulty: m.difficulty || 'medium',
          tags: m.tags || [],
          notes: m.notes || '',
          attachments: m.attachments || []
        })))
      }
      if (task.attachments) {
        setAttachments(task.attachments.map((url: string) => ({ 
          name: url.split('/').pop()?.split('?')[0] || 'attachment', 
          url 
        })))
      }
    }
  }, [task])

  const fetchMembers = async () => {
    try {
      const res = await fetch(`/api/workspaces/${slug}`)
      const data = await res.json()
      if (data.workspace?.members) {
        setMembers(data.workspace.members.map((m: any) => ({
          id: m.user.id,
          name: m.user.name || m.user.email.split('@')[0],
          email: m.user.email,
          imageUrl: m.user.imageUrl,
          points: m.user.points || 0,
          jobTitle: m.jobTitle || 'Member'
        })))
      }
      if (data.workspace?.role) setWorkspaceRole(data.workspace.role)
    } catch (err) {
      console.error('Failed to fetch members:', err)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploading(true)
    try {
      const newAttachments = [...attachments]
      for (const file of Array.from(files)) {
        const fileExt = file.name.split('.').pop()
        const fileName = `${Math.random()}.${fileExt}`
        const filePath = `task-attachments/${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('takra-bucket')
          .upload(filePath, file)

        if (uploadError) throw uploadError

        const { data } = supabase.storage.from('takra-bucket').getPublicUrl(filePath)
        newAttachments.push({ name: file.name, url: data.publicUrl })
      }
      setAttachments(newAttachments)
      toast.success(`${files.length} file(s) uploaded!`)
    } catch (err: any) {
      toast.error('Upload failed: ' + err.message)
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleMilestoneFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, milestoneIdx: number) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploading(true)
    try {
      const newAttachments = [...(milestones[milestoneIdx].attachments || [])]
      for (const file of Array.from(files)) {
        const fileExt = file.name.split('.').pop()
        const fileName = `${Math.random()}.${fileExt}`
        const filePath = `task-attachments/${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('takra-bucket')
          .upload(filePath, file)

        if (uploadError) throw uploadError

        const { data } = supabase.storage.from('takra-bucket').getPublicUrl(filePath)
        newAttachments.push({ name: file.name, url: data.publicUrl })
      }
      updateMilestone(milestoneIdx, 'attachments', newAttachments)
      toast.success(`${files.length} file(s) attached to phase!`)
    } catch (err: any) {
      toast.error('Upload failed: ' + err.message)
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const addTag = (e?: React.KeyboardEvent) => {
    if (e && e.key !== 'Enter') return
    if (e) e.preventDefault()
    if (!currentTag.trim() || tags.includes(currentTag.trim())) return
    setTags([...tags, currentTag.trim()])
    setCurrentTag('')
  }

  const addMilestone = () => {
    setMilestones([...milestones, { name: '', description: '', status: 'pending', estimatedTime: '', difficulty: 'medium', tags: [], notes: '', attachments: [] }])
  }

  const updateMilestone = (idx: number, field: keyof Milestone, value: any) => {
    const newMilestones = [...milestones]
    newMilestones[idx] = { ...newMilestones[idx], [field]: value }
    setMilestones(newMilestones)
  }

  const removeMilestone = (idx: number) => {
    if (milestones.length === 1) return
    setMilestones(milestones.filter((_, i) => i !== idx))
  }

  const handleSubmit = async () => {
    if (!title) {
      toast.error('Task title is required')
      return
    }
    
    setLoading(true)
    try {
      const url = task ? `/api/workspaces/${slug}/tasks/${task.id}` : `/api/workspaces/${slug}/tasks`
      const method = task ? 'PATCH' : 'POST'
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          priority,
          dueDate,
          tags,
          assigneeIds: selectedMemberIds,
          milestones,
          attachments: attachments.map(a => a.url),
          isRecurring,
          recurringPattern: isRecurring ? recurringPattern : null,
          recurringInterval: isRecurring ? Math.max(1, Number(recurringInterval || 1)) : 1,
          recurringDays: isRecurring && recurringPattern === 'weekly' ? recurringDays : [],
          recurringDueTime: isRecurring && recurringDueTime ? recurringDueTime : null,
          recurrenceEndDate: isRecurring && recurrenceEndDate ? recurrenceEndDate : null
        })
      })
      
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      
      toast.success(task ? 'Task updated!' : 'Task created successfully!')
      onSuccess(data.task)
      onClose()
    } catch (err: any) {
      toast.error(err.message || 'Failed to create task')
    } finally {
      setLoading(false)
    }
  }

  const handleScheduleMeeting = async () => {
    if (!task) return
    setSchedulingMeeting(true)
    try {
      const res = await fetch(`/api/workspaces/${slug}/tasks/${task.id}/meeting`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ meetingTime: meetingTime || null })
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      toast.success('Meeting scheduled and team notified!')
      onSuccess(data.task)
      onClose()
    } catch (err: any) {
      toast.error(err.message || 'Failed to schedule meeting')
    } finally {
      setSchedulingMeeting(false)
    }
  }

  const handleScheduleGoogle = async () => {
    if (!task) return
    setSchedulingGoogle(true)
    try {
      const res = await fetch(`/api/workspaces/${slug}/tasks/${task.id}/calendar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          date: googleDate, 
          startTime: googleStartTime, 
          endTime: googleEndTime,
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
        })
      })
      const data = await res.json()
      if (data.needsAuth) {
        window.location.href = '/api/auth/google/calendar'
        return
      }
      if (data.error) throw new Error(data.error)
      toast.success('Scheduled in Google Calendar!')
      if (data.eventUrl) window.open(data.eventUrl, '_blank')
    } catch (err: any) {
      toast.error(err.message || 'Failed to schedule in Google Calendar')
    } finally {
      setSchedulingGoogle(false)
    }
  }

  const startDictation = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data)
      }

      mediaRecorder.onstop = async () => {
        const mimeType = mediaRecorder.mimeType || audioChunksRef.current[0]?.type || 'audio/webm'
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType })
        const extension = mimeType.includes('mp4') || mimeType.includes('m4a')
          ? 'm4a'
          : mimeType.includes('wav')
            ? 'wav'
            : mimeType.includes('ogg')
              ? 'ogg'
              : 'webm'
        const audioFile = new File([audioBlob], `task-dictation.${extension}`, { type: mimeType })
        setLoading(true)
        toast.loading('Analyzing voice instructions...', { id: 'voice-toast' })
        
        try {
          const formData = new FormData()
          formData.append('file', audioFile)

          const sttRes = await fetch('/api/groq-stt', { method: 'POST', body: formData })
          const sttData = await sttRes.json()

          if (!sttRes.ok) {
            throw new Error(sttData.error || 'Speech-to-text failed')
          }

          if (sttData.text) {
            const parseRes = await fetch('/api/groq-task-parse', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ transcript: sttData.text })
            })
            const parseData = await parseRes.json()
            if (parseData.parsed) {
              const p = parseData.parsed
              if (p.title) setTitle(p.title)
              if (p.description) setDescription(p.description)
              if (p.priority) setPriority(p.priority)
              if (p.dueDate) setDueDate(p.dueDate)
              if (p.tags && p.tags.length > 0) {
                setTags(prev => Array.from(new Set([...prev, ...p.tags])))
              }
              if (p.milestones && p.milestones.length > 0) {
                setMilestones(p.milestones.map((m: any) => ({
                  name: m.name || '',
                  description: m.description || '',
                  status: 'pending',
                  estimatedTime: m.estimatedTime || '',
                  difficulty: m.difficulty || 'medium',
                  tags: [],
                  notes: m.notes || '',
                  attachments: []
                })))
              }
              toast.success('Form automatically populated!', { id: 'voice-toast' })
            }
          }
        } catch (err) {
          toast.error('Voice auto-fill failed', { id: 'voice-toast' })
        } finally {
          setLoading(false)
        }
        stream.getTracks().forEach(track => track.stop())
      }

      mediaRecorder.start()
      setIsDictating(true)
      toast('Listening...', { icon: '🎙️', id: 'listen-toast' })
    } catch (err) {
      toast.error('Microphone access denied')
    }
  }

  const stopDictation = () => {
    if (mediaRecorderRef.current && isDictating) {
      mediaRecorderRef.current.stop()
      setIsDictating(false)
      toast.dismiss('listen-toast')
    }
  }

  const filteredMembers = members.filter(m => 
    !selectedMemberIds.includes(m.id) && 
    (searchMember === '' || 
     m.name.toLowerCase().includes(searchMember.toLowerCase()) || 
     m.email.toLowerCase().includes(searchMember.toLowerCase()))
  )
  
  const recommendMembers = () => {
    if (members.length === 0) return
    
    // Determine target XP/Rank based on task priority or overall complexity
    // Priority: urgent/high = needs more experienced people
    const priorityWeight: Record<string, number> = { urgent: 4, high: 3, medium: 2, low: 1 }
    const targetLevel = priorityWeight[priority] || 2
    
    // Sort members by a weighted score of points and seniority
    const scoredMembers = members
      .filter(m => !selectedMemberIds.includes(m.id))
      .map(m => {
        let score = (m.points || 0) / 100 // Points base score
        
        // Job title seniority boost (50% weightage)
        const title = (m.jobTitle || '').toLowerCase()
        if (title.includes('senior') || title.includes('lead') || title.includes('principal') || title.includes('expert')) {
          score += 10 * targetLevel // Boost for senior roles on high priority tasks
        } else if (title.includes('junior') || title.includes('intern')) {
          score -= 5 // Penalty for junior roles on high priority tasks
        }
        
        return { ...m, score }
      })
      .sort((a, b) => b.score - a.score)
    
    // Auto-select top 2-3 recommendations or just show them?
    // Let's just pick the top 3 and add them
    const recommended = scoredMembers.slice(0, 2).map(m => m.id)
    if (recommended.length > 0) {
      setSelectedMemberIds(prev => Array.from(new Set([...prev, ...recommended])))
      toast.success(`Recommended ${recommended.length} experts based on task priority!`, { icon: '✨' })
    } else {
      toast.error('No suitable recommendations found.')
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-md">
      <div className="bg-white dark:bg-gray-950 w-full max-w-4xl rounded-[2.5rem] shadow-2xl overflow-hidden border border-stone-200 dark:border-gray-800 flex flex-col h-[85vh]">
        
        {/* Header */}
        <div className="p-8 border-b border-stone-100 dark:border-gray-800 flex items-center justify-between bg-stone-50/50 dark:bg-gray-900/50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
              <CheckSquare className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-stone-900 dark:text-white uppercase tracking-tighter">
                {task ? 'Edit Task' : 'New Task'}
              </h2>
              <div className="flex items-center gap-4 mt-2">
                {[
                  { num: 1, label: 'Details' },
                  { num: 2, label: 'Team' },
                  { num: 3, label: 'Phases' }
                ].map(s => (
                  <button 
                    key={s.num} 
                    onClick={() => setStep(s.num)}
                    className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all ${step === s.num ? 'text-emerald-500' : 'text-stone-400 hover:text-stone-600 dark:hover:text-stone-300'}`}
                  >
                    <div className={`h-1.5 rounded-full transition-all duration-500 ${step >= s.num ? 'w-6 bg-emerald-500' : 'w-2 bg-stone-200 dark:bg-gray-800'}`} />
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {isDictating ? (
              <button onClick={stopDictation} className="px-4 py-2 bg-red-100 text-red-600 rounded-xl font-black text-xs uppercase tracking-widest flex items-center gap-2 animate-pulse hover:bg-red-200 transition-colors">
                <Square className="w-4 h-4 fill-current" /> STOP LISTENING
              </button>
            ) : (
              <button onClick={startDictation} className="px-4 py-2 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-xl font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-emerald-100 transition-colors shadow-sm">
                <Mic className="w-4 h-4" /> AI VOICE FILL
              </button>
            )}
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-white dark:hover:bg-gray-800 transition-all hover:scale-110 active:scale-95 shadow-sm border border-transparent hover:border-stone-200 dark:hover:border-gray-700">
              <X className="w-6 h-6 text-stone-400" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          {step === 1 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="space-y-2">
                <h3 className="text-3xl font-black text-stone-900 dark:text-white tracking-tighter">CORE DETAILS</h3>
                <p className="text-stone-500 dark:text-gray-400 font-medium text-sm">Define the scope and priority of this mission.</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em] flex items-center gap-2">
                      <Target className="w-3 h-3" /> Task Title *
                    </label>
                    <input 
                      autoFocus
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. Redesign Landing Page"
                      className="w-full px-6 py-4 rounded-2xl border-2 border-stone-100 dark:border-gray-800 bg-stone-50 dark:bg-gray-900 focus:border-emerald-500 focus:ring-8 focus:ring-emerald-500/5 outline-none transition-all font-bold text-lg"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em] flex items-center gap-2">
                      <StickyNote className="w-3 h-3" /> Description
                    </label>
                    <textarea 
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Describe the objective, constraints and goals..."
                      rows={4}
                      className="w-full px-6 py-4 rounded-2xl border-2 border-stone-100 dark:border-gray-800 bg-stone-50 dark:bg-gray-900 focus:border-emerald-500 focus:ring-8 focus:ring-emerald-500/5 outline-none transition-all font-medium text-sm leading-relaxed"
                    />
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em] flex items-center gap-2">
                      <Flag className="w-3 h-3" /> Priority Level
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {['low', 'medium', 'high', 'urgent'].map(p => (
                        <button
                          key={p}
                          onClick={() => setPriority(p)}
                          className={`py-3 rounded-xl border-2 text-[10px] font-black uppercase tracking-widest transition-all ${
                            priority === p 
                              ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600' 
                              : 'border-stone-100 dark:border-gray-800 text-stone-400 hover:border-emerald-500/30'
                          }`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em] flex items-center gap-2">
                      <Calendar className="w-3 h-3" /> Deadline
                    </label>
                    <input 
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="w-full px-6 py-4 rounded-2xl border-2 border-stone-100 dark:border-gray-800 bg-stone-50 dark:bg-gray-900 focus:border-emerald-500 outline-none transition-all font-bold"
                    />
                  </div>

                  <div className="space-y-3 rounded-2xl border-2 border-stone-100 dark:border-gray-800 bg-stone-50 dark:bg-gray-900 p-4">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em] flex items-center gap-2">
                        <Repeat className="w-3 h-3" /> Recurring Task
                      </label>
                      <button
                        type="button"
                        onClick={() => setIsRecurring((prev) => !prev)}
                        className={`relative h-7 w-12 rounded-full transition-all ${isRecurring ? 'bg-emerald-500' : 'bg-stone-300 dark:bg-gray-700'}`}
                      >
                        <span className={`absolute top-1 h-5 w-5 rounded-full bg-white transition-all ${isRecurring ? 'left-6' : 'left-1'}`} />
                      </button>
                    </div>

                    {isRecurring && (
                      <div className="space-y-3">
                        <div className="grid grid-cols-3 gap-2">
                          {(['daily', 'weekly', 'monthly'] as const).map((pattern) => (
                            <button
                              key={pattern}
                              type="button"
                              onClick={() => setRecurringPattern(pattern)}
                              className={`py-2 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${
                                recurringPattern === pattern
                                  ? 'border-emerald-500 bg-emerald-50 text-emerald-600'
                                  : 'border-stone-200 dark:border-gray-700 text-stone-500'
                              }`}
                            >
                              {pattern}
                            </button>
                          ))}
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="number"
                            min={1}
                            value={recurringInterval}
                            onChange={(e) => setRecurringInterval(Math.max(1, Number(e.target.value || 1)))}
                            placeholder="Repeat every"
                            className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-gray-700 bg-white dark:bg-gray-950 text-xs font-bold outline-none"
                          />
                          <input
                            type="time"
                            value={recurringDueTime}
                            onChange={(e) => setRecurringDueTime(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-gray-700 bg-white dark:bg-gray-950 text-xs font-bold outline-none"
                          />
                        </div>

                        {recurringPattern === 'weekly' && (
                          <div className="flex flex-wrap gap-2">
                            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, idx) => {
                              const active = recurringDays.includes(idx)
                              return (
                                <button
                                  key={`${day}-${idx}`}
                                  type="button"
                                  onClick={() =>
                                    setRecurringDays((prev) =>
                                      prev.includes(idx) ? prev.filter((d) => d !== idx) : [...prev, idx]
                                    )
                                  }
                                  className={`h-8 w-8 rounded-full text-[10px] font-black transition-all ${
                                    active ? 'bg-emerald-500 text-white' : 'bg-white dark:bg-gray-950 border border-stone-200 dark:border-gray-700 text-stone-500'
                                  }`}
                                >
                                  {day}
                                </button>
                              )
                            })}
                          </div>
                        )}

                        <input
                          type="date"
                          value={recurrenceEndDate}
                          onChange={(e) => setRecurrenceEndDate(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-gray-700 bg-white dark:bg-gray-950 text-xs font-bold outline-none"
                        />
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em] flex items-center gap-2">
                      <TagIcon className="w-3 h-3" /> Tags
                    </label>
                    <div className="flex flex-wrap gap-2 p-4 rounded-2xl border-2 border-stone-100 dark:border-gray-800 bg-stone-50 dark:bg-gray-900 min-h-[100px]">
                      {tags.map(tag => (
                        <span key={tag} className="px-3 py-1 bg-white dark:bg-gray-800 border border-stone-200 dark:border-gray-700 rounded-lg text-xs font-black text-stone-600 dark:text-stone-300 flex items-center gap-2 shadow-sm animate-in zoom-in-95">
                          {tag}
                          <button onClick={() => setTags(tags.filter(t => t !== tag))} className="text-stone-400 hover:text-red-500 transition-colors">
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                      <input 
                        value={currentTag}
                        onChange={(e) => setCurrentTag(e.target.value)}
                        onKeyDown={addTag}
                        placeholder="Add tag..."
                        className="bg-transparent border-none outline-none text-xs font-bold placeholder-stone-400 flex-1 min-w-[100px]"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {task && (
                <div className="space-y-4 pt-6 mt-6 border-t border-stone-100 dark:border-gray-800">
                  <div className="space-y-2">
                    <h4 className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em] flex items-center gap-2">
                      <Calendar className="w-3 h-3 text-blue-500" /> Google Calendar Integration
                    </h4>
                    <p className="text-xs text-stone-500 font-medium">Schedule this task as an event in your Google Calendar.</p>
                  </div>
                  <div className="flex flex-col sm:flex-row items-end gap-4">
                    <div className="flex-1 space-y-2">
                      <label className="text-[10px] font-bold text-stone-400 uppercase">Date</label>
                      <input 
                        type="date"
                        value={googleDate}
                        onChange={(e) => setGoogleDate(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-stone-200 dark:border-gray-800 bg-white dark:bg-gray-950 focus:border-blue-500 outline-none text-sm font-bold"
                      />
                    </div>
                    <div className="flex-1 space-y-2">
                      <label className="text-[10px] font-bold text-stone-400 uppercase">Start Time</label>
                      <input 
                        type="time"
                        value={googleStartTime}
                        onChange={(e) => setGoogleStartTime(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-stone-200 dark:border-gray-800 bg-white dark:bg-gray-950 focus:border-blue-500 outline-none text-sm font-bold"
                      />
                    </div>
                    <div className="flex-1 space-y-2">
                      <label className="text-[10px] font-bold text-stone-400 uppercase">End Time</label>
                      <input 
                        type="time"
                        value={googleEndTime}
                        onChange={(e) => setGoogleEndTime(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-stone-200 dark:border-gray-800 bg-white dark:bg-gray-950 focus:border-blue-500 outline-none text-sm font-bold"
                      />
                    </div>
                    <button
                      onClick={handleScheduleGoogle}
                      disabled={schedulingGoogle || !googleDate || !googleStartTime || !googleEndTime}
                      className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black text-xs uppercase tracking-widest transition-all disabled:opacity-50 flex items-center gap-2 shrink-0"
                    >
                      {schedulingGoogle ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Schedule'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="space-y-2">
                <h3 className="text-3xl font-black text-stone-900 dark:text-white tracking-tighter">ASSIGNMENT</h3>
                <p className="text-stone-500 dark:text-gray-400 font-medium text-sm">Assemble the team responsible for execution.</p>
              </div>

              <div className="space-y-6">
                <div className="space-y-2 relative">
                  <label className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em] flex items-center gap-2">
                    <Users className="w-3 h-3" /> Assign Team Members
                  </label>
                  <div className="relative" ref={dropdownContainerRef}>
                    <input 
                      value={searchMember}
                      onChange={(e) => {
                        setSearchMember(e.target.value)
                        setShowMemberDropdown(true)
                      }}
                      onFocus={() => setShowMemberDropdown(true)}
                      placeholder="Search members by name or email..."
                      className="w-full px-6 py-4 rounded-2xl border-2 border-stone-100 dark:border-gray-800 bg-stone-50 dark:bg-gray-900 focus:border-emerald-500 outline-none transition-all font-bold"
                    />
                    <button 
                      onClick={recommendMembers}
                      className="absolute right-3 top-1/2 -translate-y-1/2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-amber-500/20 flex items-center gap-2 group transition-all"
                    >
                      <Sparkles className="w-3 h-3 group-hover:rotate-12 transition-transform" /> AI Recommend
                    </button>
                    {showMemberDropdown && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-900 border border-stone-200 dark:border-gray-800 rounded-2xl shadow-xl z-10 max-h-60 overflow-y-auto overflow-x-hidden p-2">
                        {filteredMembers.length === 0 ? (
                          <p className="p-4 text-center text-xs text-stone-400 font-bold italic">No matching members found</p>
                        ) : (
                          filteredMembers.map(m => (
                            <button
                              key={m.id}
                              onClick={() => {
                                setSelectedMemberIds([...selectedMemberIds, m.id])
                                setSearchMember('')
                                setShowMemberDropdown(false)
                              }}
                              className="w-full flex items-center gap-3 p-3 hover:bg-stone-50 dark:hover:bg-gray-800 rounded-xl transition-all group text-left"
                            >
                              <div className="w-10 h-10 rounded-xl bg-stone-100 dark:bg-gray-800 flex items-center justify-center font-bold text-stone-500 overflow-hidden">
                                {m.imageUrl ? <img src={m.imageUrl} className="w-full h-full object-cover" referrerPolicy="no-referrer" /> : m.name[0]}
                              </div>
                              <div>
                                <p className="text-sm font-black text-stone-900 dark:text-white group-hover:text-emerald-500 transition-colors">{m.name}</p>
                                <p className="text-[10px] font-bold text-stone-400">{m.email}</p>
                              </div>
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Selected Assignees ({selectedMemberIds.length})</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {selectedMemberIds.length === 0 ? (
                      <div className="sm:col-span-2 py-10 border-2 border-dashed border-stone-100 dark:border-gray-800 rounded-3xl flex flex-col items-center justify-center gap-2 text-stone-400">
                        <Users className="w-8 h-8 opacity-20" />
                        <p className="text-xs font-black italic">No one assigned yet</p>
                      </div>
                    ) : (
                      selectedMemberIds.map(id => {
                        const m = members.find(m => m.id === id)
                        if (!m) return null
                        return (
                          <div key={id} className="flex items-center justify-between p-4 bg-white dark:bg-gray-900 rounded-2xl border border-stone-100 dark:border-gray-800 shadow-sm animate-in zoom-in-95 group">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-stone-100 dark:bg-gray-800 flex items-center justify-center font-bold text-stone-500 overflow-hidden shrink-0">
                                {m.imageUrl ? <img src={m.imageUrl} className="w-full h-full object-cover" referrerPolicy="no-referrer" /> : m.name[0]}
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-black text-stone-900 dark:text-white truncate">{m.name}</p>
                                <p className="text-[10px] font-bold text-stone-400 truncate flex items-center gap-1.5">
                                  {m.jobTitle} • <Trophy className="w-2.5 h-2.5 text-amber-500" /> {m.points} XP
                                </p>
                              </div>
                            </div>
                            <button 
                              onClick={() => setSelectedMemberIds(selectedMemberIds.filter(sid => sid !== id))}
                              className="p-2 text-stone-400 hover:text-red-500 transition-all hover:scale-110"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )
                      })
                    )}
                  </div>
                </div>

                <div className="pt-8 space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em] flex items-center gap-2">
                      <Paperclip className="w-3 h-3" /> Attachments
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      {attachments.map((at, idx) => (
                        <div key={idx} className="relative aspect-square rounded-2xl border-2 border-stone-100 dark:border-gray-800 bg-stone-50 dark:bg-gray-900 overflow-hidden group">
                          {at.url.match(/\.(jpeg|jpg|gif|png|webp)$/) ? (
                            <img src={at.url} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center gap-2 p-2 text-center">
                              <Paperclip className="w-6 h-6 text-stone-300" />
                              <p className="text-[10px] font-black truncate w-full text-stone-500">{at.name}</p>
                            </div>
                          )}
                          <button 
                            onClick={() => setAttachments(attachments.filter((_, i) => i !== idx))}
                            className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                      <button 
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="aspect-square rounded-2xl border-2 border-dashed border-stone-200 dark:border-gray-800 hover:border-emerald-500 hover:bg-emerald-50/30 dark:hover:bg-emerald-900/10 flex flex-col items-center justify-center gap-2 transition-all group"
                      >
                        {uploading ? (
                          <Loader2 className="w-6 h-6 text-emerald-500 animate-spin" />
                        ) : (
                          <>
                            <Plus className="w-6 h-6 text-stone-300 group-hover:text-emerald-500 transition-colors" />
                            <span className="text-[10px] font-black text-stone-400 group-hover:text-emerald-600 uppercase tracking-widest">Attach</span>
                          </>
                        )}
                      </button>
                      <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" multiple />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="space-y-2">
                <h3 className="text-3xl font-black text-stone-900 dark:text-white tracking-tighter">MILESTONES</h3>
                <p className="text-stone-500 dark:text-gray-400 font-medium text-sm">Break down the mission into executable phases.</p>
              </div>

              <div className="space-y-6">
                {milestones.map((m, idx) => (
                  <div key={idx} className="p-8 bg-stone-50 dark:bg-gray-900 rounded-[2rem] border-2 border-stone-100 dark:border-gray-800 relative group animate-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: `${idx * 100}ms` }}>
                    <div className="absolute -top-3 -left-3 w-10 h-10 rounded-xl bg-stone-900 dark:bg-white text-white dark:text-stone-900 flex items-center justify-center font-black shadow-lg">
                      {idx + 1}
                    </div>
                    
                    {milestones.length > 1 && (
                      <button 
                        onClick={() => removeMilestone(idx)}
                        className="absolute top-4 right-4 p-2 text-stone-400 hover:text-red-500 transition-all hover:scale-110"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Phase Name</label>
                          <input 
                            value={m.name}
                            onChange={(e) => updateMilestone(idx, 'name', e.target.value)}
                            placeholder="Initial Setup, Research, V1 Release..."
                            className="w-full px-5 py-3 rounded-xl border border-stone-200 dark:border-gray-800 bg-white dark:bg-gray-950 focus:border-emerald-500 outline-none transition-all font-bold"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Phase Objective</label>
                          <textarea 
                            value={m.description}
                            onChange={(e) => updateMilestone(idx, 'description', e.target.value)}
                            placeholder="What needs to be achieved in this phase?"
                            rows={2}
                            className="w-full px-5 py-3 rounded-xl border border-stone-200 dark:border-gray-800 bg-white dark:bg-gray-950 focus:border-emerald-500 outline-none transition-all font-medium text-sm"
                          />
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Status</label>
                          <div className="flex bg-white dark:bg-gray-950 rounded-xl p-1 border border-stone-200 dark:border-gray-800">
                            {['pending', 'in_progress', 'completed'].map(status => (
                              <button
                                  key={status}
                                onClick={() => {
                                  // Prevent taking back a completed milestone
                                  if (m.status === 'completed' && status !== 'completed') {
                                    toast.error('Mission accomplished! Completed phases cannot be regressed.')
                                    return
                                  }
                                  updateMilestone(idx, 'status', status)
                                }}
                                disabled={m.status === 'completed' && status !== 'completed'}
                                className={`flex-1 text-[10px] font-black uppercase tracking-widest py-2.5 rounded-lg transition-all ${
                                  m.status === status 
                                    ? (status === 'completed' ? 'bg-emerald-500 text-white shadow-md' : status === 'in_progress' ? 'bg-blue-500 text-white shadow-md' : 'bg-stone-500 text-white shadow-md') 
                                    : (m.status === 'completed' ? 'text-stone-300 cursor-not-allowed' : 'text-stone-400 hover:bg-stone-50 dark:hover:bg-gray-800')
                                }`}
                              >
                                {status.replace('_', ' ')}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Est. Completion Date</label>
                          <div className="relative">
                            <input 
                              type="date"
                              min={new Date().toISOString().split('T')[0]}
                              value={m.estimatedTime}
                              onChange={(e) => updateMilestone(idx, 'estimatedTime', e.target.value)}
                              className="w-full px-5 py-3 rounded-xl border border-stone-200 dark:border-gray-800 bg-white dark:bg-gray-950 focus:border-emerald-500 outline-none transition-all font-bold"
                            />
                            <Clock className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-300 pointer-events-none" />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Difficulty</label>
                          <div className="flex bg-white dark:bg-gray-950 rounded-xl p-1 border border-stone-200 dark:border-gray-800">
                            {['easy', 'medium', 'hard', 'expert'].map(diff => (
                              <button
                                key={diff}
                                onClick={() => updateMilestone(idx, 'difficulty', diff)}
                                className={`flex-1 text-[10px] font-black uppercase tracking-widest py-2.5 rounded-lg transition-all ${m.difficulty === diff ? 'bg-emerald-500 text-white shadow-md' : 'text-stone-400 hover:bg-stone-50 dark:hover:bg-gray-800'}`}
                              >
                                {diff}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Phase Notes (Optional)</label>
                          <input 
                            value={m.notes}
                            onChange={(e) => updateMilestone(idx, 'notes', e.target.value)}
                            placeholder="Any specific technical constraints or notes..."
                            className="w-full px-5 py-3 rounded-xl border border-stone-200 dark:border-gray-800 bg-white dark:bg-gray-950 focus:border-emerald-500 outline-none transition-all font-medium text-xs italic"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Phase Attachments</label>
                          <div className="flex flex-wrap gap-2">
                            {m.attachments?.map((at, aIdx) => (
                              <div key={aIdx} className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-gray-950 border border-stone-200 dark:border-gray-800 rounded-lg group">
                                <Paperclip className="w-3 h-3 text-stone-400" />
                                <a href={at.url} target="_blank" rel="noreferrer" className="text-xs font-bold text-stone-600 dark:text-stone-300 hover:text-emerald-500 max-w-[150px] truncate">{at.name}</a>
                                <button onClick={() => updateMilestone(idx, 'attachments', m.attachments.filter((_, i) => i !== aIdx))} className="text-stone-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            ))}
                            <label className="flex items-center gap-2 px-3 py-1.5 border border-dashed border-stone-300 dark:border-gray-700 rounded-lg hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all cursor-pointer group text-stone-400 hover:text-emerald-600">
                              <Plus className="w-3 h-3" />
                              <span className="text-[10px] font-black uppercase tracking-widest">Add</span>
                              <input type="file" multiple className="hidden" onChange={(e) => handleMilestoneFileUpload(e, idx)} disabled={uploading} />
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                <button 
                  onClick={addMilestone}
                  className="w-full py-6 border-2 border-dashed border-stone-200 dark:border-gray-800 rounded-3xl text-stone-400 hover:border-emerald-500 hover:text-emerald-500 hover:bg-emerald-50/30 transition-all font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 group"
                >
                  <Plus className="w-5 h-5 group-hover:scale-125 transition-transform" /> Add Another Phase
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-8 border-t border-stone-100 dark:border-gray-800 bg-stone-50/50 dark:bg-gray-950/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {step > 1 ? (
              <button 
                onClick={() => setStep(step - 1)}
                className="flex items-center gap-2 text-stone-500 hover:text-stone-900 dark:hover:text-white font-black transition-all hover:-translate-x-1"
              >
                <ChevronLeft className="w-5 h-5" /> PREVIOUS
              </button>
            ) : (
              <button 
                onClick={onClose}
                className="text-stone-400 hover:text-red-500 font-black transition-colors uppercase tracking-widest"
              >
                Discard
              </button>
            )}
          </div>
          
          <div className="flex items-center gap-6">
            <div className="hidden sm:flex items-center gap-2">
              {[1, 2, 3].map(i => (
                <div key={i} className={`w-2 h-2 rounded-full transition-all ${step === i ? 'bg-emerald-500 scale-125' : 'bg-stone-200 dark:bg-gray-800'}`} />
              ))}
            </div>

            {task && task.roomUrl && (workspaceRole === 'admin' || workspaceRole === 'owner' || (user?.id !== undefined && selectedMemberIds.includes(user.id))) && (
              <a 
                href={task.roomUrl}
                target="_blank"
                className="px-6 py-4 bg-stone-900 dark:bg-white text-white dark:text-stone-900 rounded-2xl font-black shadow-xl flex items-center gap-2 hover:scale-105 active:scale-95 transition-all"
              >
                JOIN MEET
              </a>
            )}
            
            {task && !task.roomUrl && (workspaceRole === 'admin' || workspaceRole === 'owner') && (
              <div className="flex items-center gap-2">
                <input 
                  type="datetime-local" 
                  value={meetingTime}
                  onChange={(e) => setMeetingTime(e.target.value)}
                  className="px-4 py-4 rounded-2xl border-2 border-stone-200 dark:border-gray-800 bg-transparent outline-none text-xs font-bold text-stone-600 dark:text-stone-300 min-w-[180px]"
                  title="Leave empty for Anytime"
                />
                <button 
                  onClick={handleScheduleMeeting}
                  disabled={schedulingMeeting}
                  className="px-6 py-4 border-2 border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-2xl font-black flex items-center gap-2 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-all disabled:opacity-50"
                >
                  {schedulingMeeting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'SCHEDULE MEET'}
                </button>
              </div>
            )}

            {task ? (
              <button 
                onClick={handleSubmit}
                disabled={loading || (!workspaceRole || (workspaceRole !== 'admin' && workspaceRole !== 'owner' && !selectedMemberIds.includes(user?.id)))}
                className="px-10 py-4 bg-emerald-600 text-white rounded-2xl font-black shadow-xl shadow-emerald-500/20 flex items-center gap-3 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                title={(!workspaceRole || (workspaceRole !== 'admin' && workspaceRole !== 'owner' && !selectedMemberIds.includes(user?.id))) ? "Only assignees or admins can update this task" : ""}
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Layout className="w-5 h-5" /> UPDATE TASK</>}
              </button>
            ) : step < 3 ? (
              <button 
                onClick={() => setStep(step + 1)}
                className="px-10 py-4 bg-stone-900 dark:bg-white text-white dark:text-stone-900 rounded-2xl font-black shadow-xl flex items-center gap-3 hover:scale-105 active:scale-95 transition-all group"
              >
                CONTINUE <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            ) : (
              <button 
                onClick={handleSubmit}
                disabled={loading}
                className="px-10 py-4 bg-emerald-600 text-white rounded-2xl font-black shadow-xl shadow-emerald-500/20 flex items-center gap-3 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Layout className="w-5 h-5" /> DEPLOY TASK</>}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

'use client'

import React, { useState, useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { Send, Bot, User, Loader2, Sparkles, X, Mic, Square, Volume2, VolumeX } from 'lucide-react'
import ReactMarkdown from 'react-markdown'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
}

interface Mention {
  id: string
  type: 'task' | 'member'
  display: string
  data: any
}

export function AIBubble() {
  const pathname = usePathname()
  
  // Extract slug if we are inside a workspace
  // pathname is typically /workspaces/[slug]/...
  const isInsideWorkspace = pathname.startsWith('/workspaces/') && pathname.split('/').length > 2
  const slug = isInsideWorkspace ? pathname.split('/')[2] : null

  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [voiceEnabled, setVoiceEnabled] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const currentAudioRef = useRef<HTMLAudioElement | null>(null)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Mentions logic
  const [showMentions, setShowMentions] = useState(false)
  const [mentionType, setMentionType] = useState<'task' | 'member'>('task')
  const [mentionQuery, setMentionQuery] = useState('')
  const [tasks, setTasks] = useState<any[]>([])
  const [members, setMembers] = useState<any[]>([])

  useEffect(() => {
    if (!isOpen || !slug) return
    const fetchData = async () => {
      try {
        const [tasksRes, membersRes] = await Promise.all([
          fetch(`/api/workspaces/${slug}/tasks`).catch(() => null),
          fetch(`/api/workspaces/${slug}/members`).catch(() => null)
        ])
        if (tasksRes && tasksRes.ok) {
          const tasksData = await tasksRes.json()
          if (tasksData.tasks) setTasks(tasksData.tasks)
        }
        if (membersRes && membersRes.ok) {
          const membersData = await membersRes.json()
          if (membersData.members) setMembers(membersData.members)
        }
      } catch (err) {
        console.error('Failed to fetch mentions data:', err)
      }
    }
    fetchData()
  }, [isOpen, slug])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value
    setInput(val)
    
    // Check if typing a mention
    const match = val.match(/(?:\s|^)\/(tasks|members)(?:\s+([^\s]*))?$/)
    if (match) {
      setMentionType(match[1] === 'tasks' ? 'task' : 'member')
      setMentionQuery(match[2] || '')
      setShowMentions(true)
    } else {
      setShowMentions(false)
    }
  }

  const insertMention = (mention: Mention) => {
    const regex = /(?:\s|^)\/(tasks|members)(?:\s+([^\s]*))?$/
    const newVal = input.replace(regex, ` [@${mention.type}:${mention.id}] `)
    setInput(newVal)
    setShowMentions(false)
    inputRef.current?.focus()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || loading || !slug) return

    // Unlock Speech Synthesis immediately on user gesture
    if (voiceEnabled && 'speechSynthesis' in window) {
      const unlockUtterance = new SpeechSynthesisUtterance('')
      unlockUtterance.volume = 0
      window.speechSynthesis.speak(unlockUtterance)
    }

    const newMessage: ChatMessage = { id: Date.now().toString(), role: 'user', content: input.trim() }
    setMessages(prev => [...prev, newMessage])
    setInput('')
    setShowMentions(false)
    setLoading(true)

    try {
      const res = await fetch(`/api/workspaces/${slug}/ai-chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...messages, newMessage] })
      })
      
      const data = await res.json()
      if (data.reply) {
        setMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', content: data.reply }])
        if (voiceEnabled) {
          playAudio(data.reply)
        }
      }
    } catch (err) {
      console.error(err)
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', content: 'Sorry, I encountered an error.' }])
    } finally {
      setLoading(false)
    }
  }

  const speakWithBrowserTTS = (text: string) => {
    if (!('speechSynthesis' in window)) return
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = 1
    utterance.pitch = 1
    window.speechSynthesis.speak(utterance)
  }

  const playAudio = async (text: string) => {
    // Strip markdown formatting for cleaner speech
    const cleanText = text.replace(/[*_#`]/g, '')
    if (!cleanText.trim()) return
    
    try {
      if (currentAudioRef.current) {
        currentAudioRef.current.pause()
        currentAudioRef.current = null
      }

      const res = await fetch('/api/groq-tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: cleanText })
      })
      
      if (res.ok) {
        const blob = await res.blob()
        const url = URL.createObjectURL(blob)
        const audio = new Audio(url)
        currentAudioRef.current = audio
        audio.onended = () => {
          URL.revokeObjectURL(url)
          if (currentAudioRef.current === audio) currentAudioRef.current = null
        }
        audio.onerror = () => {
          URL.revokeObjectURL(url)
          if (currentAudioRef.current === audio) currentAudioRef.current = null
        }

        try {
          await audio.play()
          return
        } catch (playErr) {
          console.warn('Groq audio playback blocked, falling back to browser TTS:', playErr)
          URL.revokeObjectURL(url)
          if (currentAudioRef.current === audio) currentAudioRef.current = null
          speakWithBrowserTTS(cleanText)
          return
        }
      } else {
        // Fallback to browser TTS if Groq TTS endpoint throws error
        const err = await res.json().catch(() => ({}))
        console.warn('Groq TTS request failed, using browser TTS fallback:', err.error || 'Unknown error')
        speakWithBrowserTTS(cleanText)
      }
    } catch (err) {
      // Fallback
      console.warn('TTS failed, using browser TTS fallback:', err)
      speakWithBrowserTTS(cleanText)
    }
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
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
        const audioFile = new File([audioBlob], `recording.${extension}`, { type: mimeType })
        setIsTranscribing(true)
        
        try {
          const formData = new FormData()
          formData.append('file', audioFile)

          const res = await fetch('/api/groq-stt', {
            method: 'POST',
            body: formData
          })

          if (res.ok) {
            const data = await res.json()
            if (data.text) {
              setInput(prev => (prev + ' ' + data.text).trim())
            }
          } else {
            const err = await res.json().catch(() => ({}))
            console.error('STT request failed:', err.error || 'Unknown STT error')
          }
        } catch (error) {
          console.error('STT Error:', error)
        } finally {
          setIsTranscribing(false)
        }
        
        // Stop all tracks to release mic
        stream.getTracks().forEach(track => track.stop())
      }

      mediaRecorder.start()
      setIsRecording(true)
    } catch (err) {
      console.error('Microphone access denied:', err)
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }

  const filteredMentions = mentionType === 'task' 
    ? tasks.filter(t => t.title.toLowerCase().includes(mentionQuery.toLowerCase()))
    : members.filter(m => m.user.name?.toLowerCase().includes(mentionQuery.toLowerCase()) || m.user.email?.toLowerCase().includes(mentionQuery.toLowerCase()))

  // Don't render bubble if not in a workspace
  if (!slug) return null

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-emerald-600 text-white rounded-full flex items-center justify-center shadow-2xl shadow-emerald-600/30 hover:scale-110 active:scale-95 transition-all z-[9999]"
      >
        {isOpen ? <X className="w-6 h-6" /> : <Sparkles className="w-6 h-6" />}
      </button>

      {isOpen && (
        <div className="fixed bottom-24 right-6 w-[500px] h-[700px] max-h-[85vh] max-w-[calc(100vw-3rem)] bg-white dark:bg-gray-950 border border-stone-200 dark:border-gray-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden z-[9999] animate-in slide-in-from-bottom-10 fade-in duration-300">
          <div className="bg-stone-50 dark:bg-gray-900 border-b border-stone-200 dark:border-gray-800 p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-emerald-600" />
              </div>
              <div>
                <h3 className="font-black text-stone-900 dark:text-white uppercase tracking-tight text-sm">AI Assistant</h3>
                <p className="text-[10px] text-stone-500 uppercase tracking-widest font-bold">Workspace Context Active</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button 
                onClick={() => setVoiceEnabled(!voiceEnabled)} 
                className={`p-1.5 rounded-lg transition-colors ${voiceEnabled ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30' : 'text-stone-400 hover:text-stone-600 dark:hover:text-white'}`}
                title={voiceEnabled ? "Voice Output Enabled" : "Voice Output Disabled"}
              >
                {voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>
              <button onClick={() => setIsOpen(false)} className="text-stone-400 hover:text-stone-600 dark:hover:text-white transition-colors p-1.5">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
            {messages.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center opacity-70">
                <div className="w-16 h-16 rounded-3xl bg-emerald-50 dark:bg-emerald-950 flex items-center justify-center mb-4">
                  <Sparkles className="w-8 h-8 text-emerald-500" />
                </div>
                <p className="text-sm font-bold text-stone-900 dark:text-white mb-1">How can I help you?</p>
                <p className="text-xs text-stone-500 max-w-[200px]">Use /tasks or /members to reference workspace items.</p>
              </div>
            ) : (
              messages.map(msg => (
                <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
                    msg.role === 'user' ? 'bg-stone-900 text-white' : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30'
                  }`}>
                    {msg.role === 'user' ? <User className="w-3 h-3" /> : <Bot className="w-3 h-3" />}
                  </div>
                  <div className={`px-5 py-4 rounded-2xl max-w-[90%] text-sm ${
                    msg.role === 'user' 
                      ? 'bg-stone-900 dark:bg-gray-800 text-white font-medium rounded-tr-sm' 
                      : 'bg-white dark:bg-gray-900 shadow-md border border-stone-100 dark:border-gray-800 text-stone-800 dark:text-gray-200 rounded-tl-sm [&>p]:mb-3 [&>p:last-child]:mb-0 [&>h1]:text-lg [&>h1]:font-black [&>h1]:mb-2 [&>h2]:text-base [&>h2]:font-bold [&>h2]:mb-2 [&>h3]:font-bold [&>h3]:mb-1 [&>ul]:list-disc [&>ul]:pl-5 [&>ul]:mb-3 [&>ol]:list-decimal [&>ol]:pl-5 [&>ol]:mb-3 [&>li]:mb-1 [&>strong]:font-black [&>strong]:text-stone-900 dark:[&>strong]:text-white'
                  }`}>
                    {msg.role === 'user' ? (
                      <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                    ) : (
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    )}
                  </div>
                </div>
              ))
            )}
            {loading && (
              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center shrink-0">
                  <Bot className="w-3 h-3 text-emerald-600 animate-pulse" />
                </div>
                <div className="px-4 py-2.5 rounded-2xl bg-stone-50 dark:bg-gray-900 border border-stone-200 dark:border-gray-800 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-3 border-t border-stone-200 dark:border-gray-800 bg-white dark:bg-gray-950 relative">
            {showMentions && (
              <div className="absolute bottom-full left-0 right-0 mb-2 mx-3 bg-white dark:bg-gray-900 border border-stone-200 dark:border-gray-800 rounded-2xl shadow-xl overflow-hidden z-50 max-h-48 overflow-y-auto">
                <div className="p-2 bg-stone-50 dark:bg-gray-950 border-b border-stone-200 dark:border-gray-800 text-[10px] font-black uppercase tracking-widest text-stone-500">
                  Select {mentionType}
                </div>
                {filteredMentions.length === 0 ? (
                  <div className="p-3 text-xs text-stone-500 text-center">No results</div>
                ) : (
                  filteredMentions.map(item => (
                    <button
                      key={item.id}
                      onClick={() => insertMention({
                        id: item.id,
                        type: mentionType,
                        display: mentionType === 'task' ? item.title : item.user.name,
                        data: item
                      })}
                      className="w-full text-left px-3 py-2 hover:bg-stone-50 dark:hover:bg-gray-800 transition-colors border-b border-stone-100 dark:border-gray-800/50 flex flex-col"
                    >
                      <span className="font-bold text-xs text-stone-900 dark:text-white truncate">
                        {mentionType === 'task' ? item.title : item.user.name}
                      </span>
                      <span className="text-[10px] text-stone-500 truncate">
                        {mentionType === 'task' ? `Status: ${item.status}` : item.user.email}
                      </span>
                    </button>
                  ))
                )}
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex gap-2 items-end">
              {isRecording ? (
                <div className="flex-1 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/50 rounded-2xl px-4 py-3 flex items-center justify-between animate-pulse">
                  <div className="flex items-center gap-2">
                    <div className="flex items-end gap-1 h-6">
                      <span className="w-1 h-3 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0ms', animationDuration: '0.8s' }} />
                      <span className="w-1 h-5 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '150ms', animationDuration: '0.8s' }} />
                      <span className="w-1 h-4 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '300ms', animationDuration: '0.8s' }} />
                      <span className="w-1 h-6 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '450ms', animationDuration: '0.8s' }} />
                      <span className="w-1 h-3 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '600ms', animationDuration: '0.8s' }} />
                    </div>
                    <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest ml-2">Listening...</span>
                  </div>
                  <button 
                    type="button" 
                    onClick={stopRecording}
                    className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 flex items-center justify-center hover:bg-red-200 transition-colors"
                  >
                    <Square className="w-3 h-3 fill-current" />
                  </button>
                </div>
              ) : (
                <div className="flex-1 relative">
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={handleInputChange}
                    placeholder={isTranscribing ? "Transcribing..." : "Message... (/tasks, /members)"}
                    disabled={isTranscribing}
                    className="w-full resize-none bg-stone-50 dark:bg-gray-900 border border-stone-200 dark:border-gray-800 rounded-2xl pl-4 pr-10 py-3 outline-none focus:ring-2 focus:ring-emerald-500/20 text-stone-900 dark:text-white text-sm disabled:opacity-50"
                    rows={1}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSubmit(e);
                      }
                    }}
                  />
                  {!input.trim() && !isTranscribing && (
                    <button
                      type="button"
                      onClick={startRecording}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full text-stone-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 flex items-center justify-center transition-colors"
                    >
                      <Mic className="w-4 h-4" />
                    </button>
                  )}
                  {isTranscribing && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <Loader2 className="w-4 h-4 text-emerald-500 animate-spin" />
                    </div>
                  )}
                </div>
              )}
              <button 
                type="submit" 
                disabled={(!input.trim() && !isRecording) || loading || isTranscribing || isRecording}
                className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-600/20 mb-[1px]"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}

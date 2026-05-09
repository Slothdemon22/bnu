'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import dynamic from 'next/dynamic'
import { useParams } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { toast } from '@/components/ui/ToasterProvider'
import { MessageThread, type Message, type Author } from '@/components/chat/MessageThread'
import { UserAvatar } from '@/components/chat/UserAvatar'
import { supabase } from '@/lib/supabase'
import { Loader2 } from 'lucide-react'

const EmojiPicker = dynamic(
  () => import('emoji-picker-react').then((mod) => mod.default),
  { ssr: false }
)

function displayName(a: Author) {
  return a.name?.trim() || a.email.split('@')[0] || 'Anonymous'
}

function injectOptimistic(
  list: Message[],
  parentId: number | null,
  optimistic: Message
): Message[] {
  if (parentId === null) {
    return [...list, optimistic]
  }
  return list.map((m) => {
    if (m.id === parentId) {
      return { ...m, replies: [...(m.replies || []), optimistic] }
    }
    if (m.replies?.length) {
      return { ...m, replies: injectOptimistic(m.replies, parentId, optimistic) }
    }
    return m
  })
}

function removeOptimistic(list: Message[], tempId: string | number): Message[] {
  return list
    .filter((m) => m.id !== tempId)
    .map((m) => {
      if (m.replies?.length) {
        return { ...m, replies: removeOptimistic(m.replies, tempId) }
      }
      return m
    })
}

function findMessageById(list: Message[], id: string | number): Message | null {
  for (const m of list) {
    if (m.id === id) return m
    if (m.replies?.length) {
      const found = findMessageById(m.replies, id)
      if (found) return found
    }
  }
  return null
}


export default function WorkspaceChatPage() {
  const { slug } = useParams()
  const { user, loading: authLoading } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [replyingTo, setReplyingTo] = useState<Message | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showEmoji, setShowEmoji] = useState(false)
  const [autoScroll, setAutoScroll] = useState(true)
  const feedRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch(`/api/workspaces/${slug}/chat/messages`)
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setMessages(data.messages || [])
    } catch (err: any) {
      toast.error(err.message || 'Failed to load messages')
    } finally {
      setLoading(false)
    }
  }, [slug])

  useEffect(() => {
    fetchMessages()
  }, [fetchMessages])

  // Real-time subscription
  useEffect(() => {
    const { createPusherClient } = require('@/lib/pusher/client')
    const pusher = createPusherClient()
    
    if (pusher) {
      const channel = pusher.subscribe(`workspace-chat-${slug}`)
      
      channel.bind('new-message', (data: { message: Message }) => {
        setMessages(prev => {
          if (findMessageById(prev, data.message.id)) return prev

          if (data.message.parentId === null) {
            return [...prev, data.message]
          }

          const injectReply = (list: Message[]): Message[] => {
            return list.map(m => {
              if (m.id === data.message.parentId) {
                return { ...m, replies: [...(m.replies || []), data.message] }
              }
              if (m.replies?.length) {
                return { ...m, replies: injectReply(m.replies) }
              }
              return m
            })
          }
          return injectReply(prev)
        })
      })

      return () => {
        pusher.unsubscribe(`workspace-chat-${slug}`)
      }
    }
  }, [slug])

  useEffect(() => {
    if (feedRef.current && messages.length && autoScroll) {
      feedRef.current.scrollTo({
        top: feedRef.current.scrollHeight,
        behavior: 'smooth',
      })
    }
  }, [messages.length, autoScroll])

  const handleScroll = useCallback(() => {
    if (!feedRef.current) return
    const { scrollTop, scrollHeight, clientHeight } = feedRef.current
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100
    setAutoScroll(isNearBottom)
  }, [])

  const scrollToBottom = useCallback(() => {
    if (!feedRef.current) return
    feedRef.current.scrollTo({
      top: feedRef.current.scrollHeight,
      behavior: 'smooth',
    })
    setAutoScroll(true)
  }, [])

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!user || !input.trim()) return

    const contentToSend = input.trim()
    const parentId = replyingTo?.id != null && typeof replyingTo.id === 'number' ? replyingTo.id : null
    const tempId = `opt-${Date.now()}`
    
    const optimisticMsg: Message = {
      id: tempId,
      content: contentToSend,
      author: { 
        id: user.id, 
        email: user.email, 
        name: user.name ?? null,
        imageUrl: user.imageUrl ?? null,
        role: user.role ?? null
      },
      createdAt: new Date().toISOString(),
      replies: [],
      _optimistic: true,
    }

    setMessages((prev) => injectOptimistic(prev, parentId, optimisticMsg))
    setInput('')
    setReplyingTo(null)
    setShowEmoji(false)
    setSubmitting(true)

    try {
      const res = await fetch(`/api/workspaces/${slug}/chat/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: contentToSend, parentId }),
      })
      if (!res.ok) throw new Error('Failed to send')
      const data = await res.json()
      // Replace optimistic message with the real one to ensure IDs are correct
      setMessages(prev => {
        const withoutOpt = removeOptimistic(prev, tempId)
        if (findMessageById(withoutOpt, data.message.id)) return withoutOpt

        if (parentId === null) return [...withoutOpt, data.message]
        
        const inject = (list: Message[]): Message[] => {
          return list.map(m => {
            if (m.id === parentId) return { ...m, replies: [...(m.replies || []), data.message] }
            if (m.replies?.length) return { ...m, replies: inject(m.replies) }
            return m
          })
        }
        return inject(withoutOpt)
      })
    } catch (err: any) {
      setMessages((prev) => removeOptimistic(prev, tempId))
      toast.error(err.message || 'Failed to send')
    } finally {
      setSubmitting(false)
    }
  }

  function onEmojiClick(emojiData: { emoji: string }) {
    setInput((prev) => prev + emojiData.emoji)
    inputRef.current?.focus()
  }

  const messageCount = useMemo(() => {
    const countMessages = (msgs: Message[]): number => {
      return msgs.reduce((acc, msg) => {
        return acc + 1 + (msg.replies ? countMessages(msg.replies) : 0)
      }, 0)
    }
    return countMessages(messages)
  }, [messages])

  if (authLoading) return null

  return (
    <div className="h-[calc(100vh-10rem)] flex flex-col max-w-5xl mx-auto w-full px-4 sm:px-6 py-4">
      <div className="flex items-center justify-between mb-4 gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-stone-900 dark:text-white tracking-tight">
              Team <span className="text-emerald-500">Board</span>
            </h1>
            <div className="px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800">
              <span className="text-[10px] font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-widest">
                {messageCount} Messages
              </span>
            </div>
          </div>
          <p className="text-stone-500 dark:text-gray-400 text-xs font-medium mt-1">
            Real-time collaboration for your private team workspace.
          </p>
        </div>
        {loading && (
          <div className="flex items-center gap-2 px-4 py-2 bg-stone-100 dark:bg-gray-800 rounded-xl animate-pulse">
            <Loader2 className="w-4 h-4 text-emerald-500 animate-spin" />
            <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Syncing</span>
          </div>
        )}
      </div>

      <div className="flex-1 flex flex-col min-h-0 rounded-[2rem] border border-stone-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm overflow-hidden relative">
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100 dark:border-gray-800 bg-stone-50/50 dark:bg-gray-800/50">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-black text-stone-900 dark:text-white uppercase tracking-widest">
              Live Channel
            </span>
          </div>
          {!autoScroll && (
            <button
              onClick={scrollToBottom}
              className="px-3 py-1 rounded-full text-[10px] font-black bg-emerald-600 text-white shadow-lg shadow-emerald-500/20 uppercase tracking-widest transition-all hover:scale-105 active:scale-95"
            >
              ↓ New activity
            </button>
          )}
        </div>

        <div
          ref={feedRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth"
        >
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="w-10 h-10 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
              <p className="text-xs font-black text-stone-400 uppercase tracking-widest">Syncing channel...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 text-center">
              <div className="w-20 h-20 rounded-[2rem] bg-emerald-50 dark:bg-emerald-900/10 flex items-center justify-center text-4xl mb-6 shadow-sm">
                💬
              </div>
              <p className="text-xl font-black text-stone-900 dark:text-white">Empty Board</p>
              <p className="text-sm text-stone-400 font-medium mt-2 max-w-xs">
                Start the conversation. Only your team members can see these messages.
              </p>
            </div>
          ) : (
            messages.map((msg) => (
              <MessageThread
                key={msg.id}
                message={msg}
                depth={0}
                maxDepth={6}
                onReply={(target) => {
                  setReplyingTo(target)
                  inputRef.current?.focus()
                }}
                currentUserId={user?.id}
              />
            ))
          )}
        </div>

        {user && (
          <div className="p-4 border-t border-stone-100 dark:border-gray-800 bg-white dark:bg-gray-900">
            {replyingTo && (
              <div className="flex items-center gap-4 mb-4 px-4 py-3 rounded-2xl bg-white/40 dark:bg-gray-900/40 backdrop-blur-md border border-emerald-500/20 shadow-lg animate-in slide-in-from-bottom-2 duration-300">
                <div className="w-1 h-10 bg-emerald-500 rounded-full shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-[0.2em]">
                      Replying to
                    </span>
                    <span className="text-sm font-black text-stone-900 dark:text-white truncate">
                      {displayName(replyingTo.author)}
                    </span>
                  </div>
                  <p className="text-xs text-stone-500 dark:text-gray-400 truncate mt-1 italic">
                    "{replyingTo.content}"
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setReplyingTo(null)}
                  className="shrink-0 w-8 h-8 rounded-xl flex items-center justify-center bg-stone-100 dark:bg-gray-800 text-stone-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}
            <form onSubmit={handleSend} className="relative group">
              <div className="flex gap-3 items-end rounded-3xl border-2 border-stone-100 dark:border-gray-800 bg-stone-50/50 dark:bg-gray-800/50 p-2 focus-within:border-emerald-500/50 focus-within:bg-white dark:focus-within:bg-gray-900 transition-all shadow-sm">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onFocus={() => setShowEmoji(false)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleSend(e)
                    }
                  }}
                  placeholder={replyingTo ? 'Write your reply...' : 'Type a message...'}
                  rows={1}
                  className="flex-1 min-h-[44px] max-h-32 resize-none bg-transparent px-4 py-3 text-stone-900 dark:text-white placeholder-stone-400 text-sm font-medium focus:outline-none"
                />
                <div className="flex items-center gap-2 pr-1 pb-1">
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowEmoji((e) => !e)}
                      className="p-2 rounded-xl text-stone-400 hover:text-stone-600 dark:hover:text-gray-300 transition-colors"
                    >
                      😊
                    </button>
                    {showEmoji && (
                      <div className="absolute bottom-full right-0 mb-4 z-50">
                        <EmojiPicker
                          onEmojiClick={onEmojiClick}
                          theme={(typeof document !== 'undefined' && document.documentElement.classList.contains('dark') ? 'dark' : 'light') as any}
                          width={300}
                          height={400}
                        />
                      </div>
                    )}
                  </div>
                  <button
                    type="submit"
                    disabled={submitting || !input.trim()}
                    className="p-3 rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-500/20 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100 transition-all"
                  >
                    {submitting ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}

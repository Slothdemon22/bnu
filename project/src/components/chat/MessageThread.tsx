'use client'

import { memo, useState } from 'react'
import { UserAvatar } from './UserAvatar'

export type Author = {
  id: number
  email: string
  name: string | null
  imageUrl?: string | null
  role?: string | null
}

export type Message = {
  id: number | string
  content: string
  author: Author
  createdAt: string
  parentId?: number | null
  replies?: Message[]
  _optimistic?: boolean
}

type MessageThreadProps = {
  message: Message
  depth?: number
  maxDepth?: number
  onReply?: (message: Message) => void
  currentUserId?: number | null
}

function formatTime(dateStr: string) {
  const d = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  
  if (diff < 60000) return 'now'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`
  
  const isToday = d.toDateString() === now.toDateString()
  if (isToday) {
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
  }
  
  const isThisYear = d.getFullYear() === now.getFullYear()
  if (isThisYear) {
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }
  
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatFullDate(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

const MessageThreadComponent = ({
  message,
  depth = 0,
  maxDepth = 6,
  onReply,
  currentUserId,
}: MessageThreadProps) => {
  const [collapsed, setCollapsed] = useState(false)
  const [showFullDate, setShowFullDate] = useState(false)
  
  const isNested = depth > 0
  const hasReplies = message.replies && message.replies.length > 0
  const canReply = currentUserId && depth < maxDepth
  const isOwnMessage = currentUserId === message.author.id

  const displayName = message.author.name?.trim() || message.author.email.split('@')[0] || 'Anonymous'

  // Color coding for thread depth
  const getThreadColor = (level: number) => {
    const colors = [
      'border-emerald-400 dark:border-emerald-600',
      'border-blue-400 dark:border-blue-600',
      'border-purple-400 dark:border-purple-600',
      'border-pink-400 dark:border-pink-600',
      'border-orange-400 dark:border-orange-600',
      'border-cyan-400 dark:border-cyan-600',
    ]
    return colors[level % colors.length]
  }

  return (
    <div
      className={`
        ${isNested ? 'relative pl-8 sm:pl-10 ml-2 sm:ml-4 border-l-2 border-stone-100 dark:border-gray-800' : ''} 
        transition-all duration-300
      `}
    >
      {/* Thread connection line */}
      {isNested && (
        <div className="absolute -left-[2px] top-0 bottom-0 w-[2px] bg-emerald-500/30" />
      )}

      {/* Thread indicator dot */}
      {isNested && (
        <div
          className={`
            absolute -left-[7px] top-8 w-3 h-3 rounded-full 
            border-2 border-white dark:border-gray-900 shadow-sm
            ${depth === 1 ? 'bg-emerald-500' : depth === 2 ? 'bg-blue-500' : 'bg-purple-500'}
          `}
        />
      )}

      <div
        className={`
          group relative flex flex-col transition-all duration-300 mb-4
          ${isOwnMessage ? 'items-end' : 'items-start'}
        `}
      >
        <div className={`flex items-end gap-3 max-w-[90%] ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'}`}>
          <div className="shrink-0 mb-1">
            <UserAvatar
              userId={message.author.id}
              name={message.author.name}
              email={message.author.email}
              imageUrl={message.author.imageUrl}
              role={message.author.role}
              size={isNested ? "xs" : "sm"}
            />
          </div>

          <div className={`flex flex-col gap-1.5 min-w-0 ${isOwnMessage ? 'items-end' : 'items-start'}`}>
            {!isOwnMessage && (
              <div className="flex items-center gap-2 px-1">
                <span className={`font-black text-stone-900 dark:text-white uppercase tracking-tight ${isNested ? 'text-[10px]' : 'text-[11px]'}`}>
                  {displayName}
                </span>
                {message.author.role === 'admin' && (
                  <span className="text-[8px] font-black bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 px-1.5 py-0.5 rounded-md">
                    STAFF
                  </span>
                )}
              </div>
            )}

            <div
              className={`
                relative px-5 py-3.5 rounded-[1.75rem] shadow-sm transition-all duration-300
                ${message._optimistic 
                  ? 'bg-emerald-50/50 border border-emerald-200 animate-pulse' 
                  : isOwnMessage
                    ? 'bg-emerald-600 text-white rounded-br-none shadow-lg shadow-emerald-500/10'
                    : isNested
                      ? 'bg-stone-50 dark:bg-gray-800/50 border border-stone-100 dark:border-gray-800 rounded-bl-none'
                      : 'bg-white dark:bg-gray-900 border border-stone-100 dark:border-gray-800 rounded-bl-none'
                }
                group-hover:shadow-md
                ${isNested ? 'py-2.5 px-4' : ''}
              `}
            >
              <p className={`leading-relaxed whitespace-pre-wrap break-words ${isOwnMessage ? 'text-white' : 'text-stone-800 dark:text-stone-200'} ${isNested ? 'text-xs' : 'text-[13px]'}`}>
                {message.content}
              </p>
            </div>

            <div className={`flex items-center gap-3 px-1 mt-0.5 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">
                {formatTime(message.createdAt)}
              </span>
              {canReply && onReply && (
                <button
                  type="button"
                  onClick={() => onReply(message)}
                  className="opacity-0 group-hover:opacity-100 text-[10px] font-black text-emerald-500 hover:text-emerald-600 uppercase tracking-widest transition-all"
                >
                  Reply
                </button>
              )}
              {hasReplies && (
                <button
                  type="button"
                  onClick={() => setCollapsed(!collapsed)}
                  className="text-[10px] font-black text-stone-400 hover:text-stone-600 uppercase tracking-widest transition-all flex items-center gap-1"
                >
                  {collapsed ? `Show ${message.replies!.length} Replies` : 'Collapse'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Nested replies */}
      {hasReplies && !collapsed && (
        <div className="mt-3 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
          {Array.from(new Map(message.replies!.map(r => [r.id, r])).values()).map((reply) => (
            <MessageThreadComponent
              key={reply.id}
              message={reply}
              depth={depth + 1}
              maxDepth={maxDepth}
              onReply={onReply}
              currentUserId={currentUserId}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export const MessageThread = memo(MessageThreadComponent)

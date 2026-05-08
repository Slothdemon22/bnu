'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Bell, Check, Trash2, ExternalLink, Clock } from 'lucide-react'
import { createPusherClient } from '@/lib/pusher/client'
import { useAuth } from '@/hooks/useAuth'
import { toast } from 'react-hot-toast'
import Link from 'next/link'

type Notification = {
  id: number
  title: string
  message: string
  type?: string
  readAt: string | null
  createdAt: string
}

export function NotificationBell() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchNotifications()
    
    if (!user) return

    const pusher = createPusherClient()
    if (!pusher) return

    const channel = pusher.subscribe(`user-notifications-${user.id}`)
    channel.bind('new-notification', (data: { notification: Notification }) => {
      setNotifications(prev => [data.notification, ...prev])
      setUnreadCount(prev => prev + 1)
      
      if (data.notification.type === 'meeting_scheduled') {
        const [msg, url] = data.notification.message.split('|||')
        toast.custom((t) => (
          <div className="max-w-sm w-full bg-stone-900 dark:bg-gray-950 shadow-2xl rounded-2xl pointer-events-auto flex flex-col border border-emerald-500/50 overflow-hidden relative">
            <div className="p-4 flex items-start gap-4">
              <div className="h-10 w-10 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                <span className="text-xl">📹</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-black text-white uppercase tracking-wider">
                  {data.notification.title}
                </p>
                <p className="mt-1 text-xs text-stone-300 font-medium leading-relaxed">
                  {msg}
                </p>
              </div>
            </div>
            {url && (
              <div className="bg-stone-800 dark:bg-gray-900 p-3 flex gap-2">
                <button 
                  onClick={() => toast.dismiss(t.id)} 
                  className="flex-1 px-4 py-2 bg-stone-700 text-white font-bold rounded-xl text-[10px] uppercase tracking-widest hover:bg-stone-600 transition-colors"
                >
                  Dismiss
                </button>
                <a 
                  href={url}
                  onClick={() => toast.dismiss(t.id)}
                  target="_blank"
                  className="flex-[2] px-4 py-2 bg-emerald-500 text-white text-center font-bold rounded-xl text-[10px] uppercase tracking-widest hover:bg-emerald-600 transition-colors"
                >
                  Join Meeting Now
                </a>
              </div>
            )}
          </div>
        ), { duration: 30000 }) // Show for 30 seconds
      } else {
        toast.success(data.notification.title, {
          icon: '🔔',
          duration: 4000,
        })
      }
    })

    return () => {
      pusher.unsubscribe(`user-notifications-${user.id}`)
    }
  }, [user])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  async function fetchNotifications() {
    setLoading(true)
    try {
      const res = await fetch('/api/notifications?limit=5')
      const data = await res.json()
      if (data.notifications) {
        setNotifications(data.notifications)
        setUnreadCount(data.unreadCount || 0)
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err)
    } finally {
      setLoading(false)
    }
  }

  async function markAsRead(id?: number) {
    try {
      const res = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(id ? { ids: [id] } : { all: true }),
      })
      if (res.ok) {
        if (id) {
          setNotifications(prev => prev.map(n => n.id === id ? { ...n, readAt: new Date().toISOString() } : n))
          setUnreadCount(prev => Math.max(0, prev - 1))
        } else {
          setNotifications(prev => prev.map(n => ({ ...n, readAt: new Date().toISOString() })))
          setUnreadCount(0)
        }
      }
    } catch (err) {
      console.error('Failed to mark as read:', err)
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-xl hover:bg-stone-100 dark:hover:bg-gray-900 text-stone-500 relative transition-all active:scale-95"
      >
        <Bell className={`w-5 h-5 ${unreadCount > 0 ? 'animate-bounce-subtle' : ''}`} />
        {unreadCount > 0 && (
          <span className="absolute top-2 right-2 w-2 h-2 bg-emerald-500 rounded-full border-2 border-white dark:border-gray-950 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-gray-900 border border-stone-200 dark:border-gray-800 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top-right">
          <div className="p-4 border-b border-stone-100 dark:border-gray-800 flex items-center justify-between bg-stone-50/50 dark:bg-gray-800/50">
            <div>
              <h3 className="font-black text-stone-900 dark:text-white">Notifications</h3>
              <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">{unreadCount} Unread Messages</p>
            </div>
            {unreadCount > 0 && (
              <button 
                onClick={() => markAsRead()}
                className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 uppercase tracking-widest"
              >
                <Check className="w-3 h-3" /> Mark all read
              </button>
            )}
          </div>

          <div className="max-h-[400px] overflow-y-auto">
            {loading && notifications.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <div className="w-8 h-8 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mx-auto" />
                <p className="text-xs text-stone-400 font-bold">Synchronizing...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-12 h-12 bg-stone-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Bell className="w-6 h-6 text-stone-300" />
                </div>
                <p className="text-sm font-bold text-stone-900 dark:text-white">All caught up!</p>
                <p className="text-xs text-stone-400 mt-1">No new notifications at the moment.</p>
              </div>
            ) : (
              <div className="divide-y divide-stone-100 dark:divide-gray-800">
                {notifications.map((n) => (
                  <div 
                    key={n.id} 
                    className={`p-4 hover:bg-stone-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer group ${!n.readAt ? 'bg-emerald-50/20 dark:bg-emerald-900/10' : ''}`}
                    onClick={() => !n.readAt && markAsRead(n.id)}
                  >
                    <div className="flex gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        !n.readAt ? 'bg-emerald-500 text-white' : 'bg-stone-100 dark:bg-gray-800 text-stone-400'
                      }`}>
                        <Bell className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={`text-sm font-black truncate ${!n.readAt ? 'text-stone-900 dark:text-white' : 'text-stone-500'}`}>{n.title}</p>
                          <span className="text-[10px] text-stone-400 whitespace-nowrap mt-0.5 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {new Date(n.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-xs text-stone-500 dark:text-gray-400 line-clamp-2 mt-0.5 leading-relaxed">{n.message.split('|||')[0]}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-4 border-t border-stone-100 dark:border-gray-800 bg-stone-50/50 dark:bg-gray-800/50">
            <Link 
              href="/profile?tab=notifications" 
              onClick={() => setIsOpen(false)}
              className="w-full py-3 bg-white dark:bg-gray-900 border border-stone-200 dark:border-gray-700 rounded-xl text-xs font-black text-stone-600 dark:text-stone-300 hover:border-emerald-500/50 hover:text-emerald-600 transition-all flex items-center justify-center gap-2"
            >
              View Full History <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}

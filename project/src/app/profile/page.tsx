'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Trophy, Mail, Shield, Settings, Bell, User as UserIcon, LogOut, ChevronLeft, Target, Award, Star, Moon, Sun, Monitor } from 'lucide-react'
import Navbar from '@/components/custom/Navbar'
import Footer from '@/components/custom/Footer'
import { useAuth } from '@/hooks/useAuth'
import { toast } from '@/components/ui/ToasterProvider'
import { useTheme } from 'next-themes'

type User = { 
  id: number; 
  email: string; 
  name: string | null; 
  role: string; 
  imageUrl?: string | null; 
  points: number;
  bio?: string | null;
  notificationsEnabled?: boolean;
}

type NotificationItem = {
  id: number
  title: string
  message: string
  type?: string | null
  entityType?: string | null
  entityId?: number | null
  userId?: number | null
  readAt?: string | null
  createdAt: string
}

type TabType = 'profile' | 'notifications' | 'settings'

export default function ProfilePage() {
  const { user: authUser, loading: authLoading, checkAuth } = useAuth()
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [activeTab, setActiveTab] = useState<TabType>('profile')
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [loadingNotifications, setLoadingNotifications] = useState(false)
  
  const { theme, setTheme } = useTheme()
  const [bio, setBio] = useState('')
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)

  useEffect(() => {
    if (!authLoading && !authUser) {
      router.push('/login')
      return
    }
    if (authUser) {
      fetch('/api/auth/me')
        .then((r) => r.json())
        .then((data) => {
          setUser(data.user)
          setName(data.user?.name ?? '')
          setBio(data.user?.bio ?? '')
          setNotificationsEnabled(data.user?.notificationsEnabled ?? true)
        })
        .catch(() => toast.error('Failed to load profile'))
        .finally(() => setLoading(false))
    }
  }, [authUser, authLoading, router])

  useEffect(() => {
    if (activeTab === 'notifications') {
      if (notifications.length === 0) {
        loadNotifications()
      }
      
      if (authUser) {
        const { createPusherClient } = require('@/lib/pusher/client')
        const pusher = createPusherClient()
        if (pusher) {
          const channel = pusher.subscribe(`user-notifications-${authUser.id}`)
          channel.bind('new-notification', (data: { notification: NotificationItem }) => {
            setNotifications(prev => [data.notification, ...prev])
          })
          return () => {
            pusher.unsubscribe(`user-notifications-${authUser.id}`)
          }
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, authUser])

  async function loadNotifications() {
    setLoadingNotifications(true)
    try {
      const res = await fetch('/api/notifications?limit=50')
      const data = await res.json()
      if (res.ok) {
        setNotifications(data.notifications || [])
      }
    } catch (error) {
      toast.error('Failed to load notifications')
    } finally {
      setLoadingNotifications(false)
    }
  }

  async function markAsRead(id: number) {
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: [id] }),
      })
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === id ? { ...n, readAt: new Date().toISOString() } : n
        )
      )
    } catch (error) {
      console.error('Failed to mark as read:', error)
    }
  }

  async function deleteNotification(id: number) {
    await markAsRead(id)
    setNotifications((prev) => prev.filter((n) => n.id !== id))
    toast.success('Notification removed')
  }

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch('/api/auth/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() || null, bio: bio.trim() || null }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to update')
      setUser(data.user)
      setName(data.user?.name ?? '')
      setBio(data.user?.bio ?? '')
      setEditing(false)
      toast.success('Profile updated')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  async function handleToggleNotifications(enabled: boolean) {
    setNotificationsEnabled(enabled)
    try {
      const res = await fetch('/api/auth/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationsEnabled: enabled }),
      })
      if (!res.ok) throw new Error('Failed to update')
      toast.success(enabled ? 'Notifications enabled' : 'Notifications disabled')
    } catch {
      toast.error('Failed to update preferences')
      setNotificationsEnabled(!enabled)
    }
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const formData = new FormData()
      formData.set('file', file)
      const res = await fetch('/api/profile/avatar', {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Upload failed')
      setUser(data.user)
      checkAuth()
      toast.success('Profile photo updated')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to upload photo')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center gap-6">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
          </div>
        </div>
        <div className="text-center space-y-2">
          <h2 className="text-xl font-black text-stone-900 dark:text-white uppercase tracking-tighter">Syncing Profile</h2>
          <p className="text-xs font-bold text-stone-400 uppercase tracking-[0.3em] animate-pulse">Fetching Secure Data...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  const displayName = user.name?.trim() || user.email.split('@')[0] || 'User'

  return (
    <div className="w-full">
      {/* Hero section */}
      <div className="bg-gradient-to-b from-emerald-600/10 to-transparent dark:from-emerald-800/20 dark:to-transparent border-b border-stone-200 dark:border-gray-800">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6 sm:gap-8">
            <div className="relative group">
              <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl overflow-hidden bg-stone-200 dark:bg-gray-700 shadow-lg ring-2 ring-white dark:ring-gray-800 ring-offset-2 ring-offset-stone-50 dark:ring-offset-gray-900 shrink-0">
                {user.imageUrl ? (
                  <img
                    src={user.imageUrl}
                    alt={displayName}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-emerald-600 dark:text-emerald-400 bg-gradient-to-br from-emerald-100 to-emerald-200 dark:from-emerald-900/50 dark:to-emerald-800/50">
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <label className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                <span className="text-white text-sm font-medium px-3 py-1.5 bg-white/20 rounded-lg backdrop-blur-sm">
                  {uploading ? 'Uploading…' : 'Change photo'}
                </span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  className="sr-only"
                  disabled={uploading}
                  onChange={handleAvatarChange}
                />
              </label>
            </div>
            <div className="text-center sm:text-left flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 dark:text-white tracking-tight">
                {displayName}
              </h1>
              <p className="text-stone-500 dark:text-gray-400 mt-1">{user.email}</p>
              <div className="flex flex-wrap items-center gap-3 mt-4">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase tracking-widest border border-emerald-500/20">
                  <Shield className="w-3 h-3" />
                  {user.role}
                </span>
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/20 border border-amber-400/30">
                  <Trophy className="w-4 h-4" />
                  <span className="text-[11px] font-black uppercase tracking-tighter">
                    {user.points.toLocaleString()} XP RANK
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        {/* Tabs */}
        <div className="flex gap-1 border-b border-stone-200 dark:border-gray-700 mb-6 overflow-x-auto">
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-4 py-2.5 text-sm font-medium transition-colors whitespace-nowrap ${
              activeTab === 'profile'
                ? 'text-emerald-600 dark:text-emerald-400 border-b-2 border-emerald-600 dark:border-emerald-400'
                : 'text-stone-600 dark:text-gray-400 hover:text-stone-900 dark:hover:text-white'
            }`}
          >
            Profile
          </button>
          <button
            onClick={() => setActiveTab('notifications')}
            className={`px-4 py-2.5 text-sm font-medium transition-colors whitespace-nowrap ${
              activeTab === 'notifications'
                ? 'text-emerald-600 dark:text-emerald-400 border-b-2 border-emerald-600 dark:border-emerald-400'
                : 'text-stone-600 dark:text-gray-400 hover:text-stone-900 dark:hover:text-white'
            }`}
          >
            Notifications
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-2.5 text-sm font-medium transition-colors whitespace-nowrap ${
              activeTab === 'settings'
                ? 'text-emerald-600 dark:text-emerald-400 border-b-2 border-emerald-600 dark:border-emerald-400'
                : 'text-stone-600 dark:text-gray-400 hover:text-stone-900 dark:hover:text-white'
            }`}
          >
            Settings
          </button>
        </div>

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <section className="bg-white dark:bg-gray-800 rounded-2xl border border-stone-200 dark:border-gray-700 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-stone-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-stone-900 dark:text-white">
                Profile
              </h2>
              <p className="text-sm text-stone-500 dark:text-gray-400 mt-0.5">
                Your display name and account info
              </p>
            </div>
            <div className="p-6">
              {editing ? (
                <form onSubmit={handleSaveProfile} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-stone-700 dark:text-gray-300 mb-1.5">
                      Display name
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your name"
                      className="w-full rounded-xl border border-stone-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-4 py-2.5 text-stone-900 dark:text-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-stone-700 dark:text-gray-300 mb-1.5">
                      Bio
                    </label>
                    <textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Tell us about your work..."
                      rows={3}
                      className="w-full rounded-xl border border-stone-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-4 py-2.5 text-stone-900 dark:text-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
                    />
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={saving}
                      className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium disabled:opacity-50 transition-colors"
                    >
                      {saving ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditing(false)
                        setName(user.name ?? '')
                        setBio(user.bio ?? '')
                      }}
                      className="px-4 py-2.5 rounded-xl border border-stone-300 dark:border-gray-600 text-stone-700 dark:text-gray-300 font-medium hover:bg-stone-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm min-w-0">
                    <div>
                      <dt className="text-stone-500 dark:text-gray-400">Name</dt>
                      <dd className="font-medium text-stone-900 dark:text-white mt-0.5">
                        {displayName}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-stone-500 dark:text-gray-400">Email</dt>
                      <dd className="font-medium text-stone-900 dark:text-white mt-0.5 truncate">
                        {user.email}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-stone-500 dark:text-gray-400">Total Points</dt>
                      <dd className="font-black text-amber-600 dark:text-amber-400 mt-0.5 text-lg">
                        {user.points} XP
                      </dd>
                    </div>
                    {user.bio && (
                      <div className="sm:col-span-2">
                        <dt className="text-stone-500 dark:text-gray-400">Bio</dt>
                        <dd className="font-medium text-stone-900 dark:text-white mt-0.5 whitespace-pre-wrap">
                          {user.bio}
                        </dd>
                      </div>
                    )}
                  </dl>
                  <button
                    type="button"
                    onClick={() => setEditing(true)}
                    className="text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:underline shrink-0"
                  >
                    Edit profile
                  </button>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <section className="bg-white dark:bg-gray-800 rounded-2xl border border-stone-200 dark:border-gray-700 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-stone-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-stone-900 dark:text-white">
                All Notifications
              </h2>
              <p className="text-sm text-stone-500 dark:text-gray-400 mt-0.5">
                View all your notification history
              </p>
            </div>
            <div className="divide-y divide-stone-200 dark:divide-gray-700">
              {loadingNotifications ? (
                <div className="p-8 text-center text-stone-500 dark:text-gray-400">
                  Loading notifications...
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <svg
                    className="mx-auto h-12 w-12 text-stone-300 dark:text-gray-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M15 17h5l-1.4-1.4A2 2 0 0118 14.2V11a6 6 0 10-12 0v3.2a2 2 0 01-.6 1.4L4 17h5m6 0a3 3 0 11-6 0h6z"
                    />
                  </svg>
                  <p className="mt-4 text-stone-500 dark:text-gray-400">No notifications yet</p>
                  <p className="mt-1 text-sm text-stone-400 dark:text-gray-500">
                    When you receive notifications, they'll appear here
                  </p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-stone-50 dark:hover:bg-gray-700/50 transition-colors ${
                      !notification.readAt ? 'bg-emerald-50/30 dark:bg-emerald-900/10' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-medium text-stone-900 dark:text-white">
                            {notification.title}
                          </h3>
                          {!notification.readAt && (
                            <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500 dark:bg-emerald-400"></span>
                          )}
                          {notification.type && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-stone-100 dark:bg-gray-700 text-stone-600 dark:text-gray-300 capitalize">
                              {notification.type.replace(/_/g, ' ')}
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-sm text-stone-600 dark:text-gray-300">
                          {notification.message}
                        </p>
                        <p className="mt-2 text-xs text-stone-400 dark:text-gray-500">
                          {new Date(notification.createdAt).toLocaleString('en-US', {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          })}
                        </p>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        {!notification.readAt && (
                          <button
                            onClick={() => markAsRead(notification.id)}
                            className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline"
                            title="Mark as read"
                          >
                            Mark read
                          </button>
                        )}
                        <button
                          onClick={() => deleteNotification(notification.id)}
                          className="text-xs text-red-600 dark:text-red-400 hover:underline"
                          title="Delete notification"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <section className="bg-white dark:bg-gray-800 rounded-2xl border border-stone-200 dark:border-gray-700 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-stone-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-stone-900 dark:text-white">
                Settings
              </h2>
              <p className="text-sm text-stone-500 dark:text-gray-400 mt-0.5">
                Preferences and account settings
              </p>
            </div>
            <div className="divide-y divide-stone-200 dark:divide-gray-700">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-4">
                <div>
                  <p className="font-medium text-stone-900 dark:text-white">Theme Preference</p>
                  <p className="text-sm text-stone-500 dark:text-gray-400">Choose how Momentum looks to you</p>
                </div>
                <div className="flex p-1 rounded-xl bg-stone-100 dark:bg-gray-700 w-fit">
                  <button 
                    onClick={() => setTheme('light')}
                    className={`flex items-center justify-center p-2 rounded-lg transition-colors ${theme === 'light' ? 'bg-white text-emerald-600 shadow-sm' : 'text-stone-500 hover:text-stone-900 dark:text-gray-400 dark:hover:text-white'}`}
                  >
                    <Sun className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => setTheme('system')}
                    className={`flex items-center justify-center p-2 rounded-lg transition-colors ${theme === 'system' ? 'bg-white dark:bg-gray-600 text-emerald-600 dark:text-emerald-400 shadow-sm' : 'text-stone-500 hover:text-stone-900 dark:text-gray-400 dark:hover:text-white'}`}
                  >
                    <Monitor className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => setTheme('dark')}
                    className={`flex items-center justify-center p-2 rounded-lg transition-colors ${theme === 'dark' ? 'bg-gray-600 text-emerald-400 shadow-sm' : 'text-stone-500 hover:text-stone-900 dark:text-gray-400 dark:hover:text-white'}`}
                  >
                    <Moon className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between p-4">
                <div>
                  <p className="font-medium text-stone-900 dark:text-white">Push Notifications</p>
                  <p className="text-sm text-stone-500 dark:text-gray-400">Receive alerts for tasks and mentions</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={notificationsEnabled} onChange={(e) => handleToggleNotifications(e.target.checked)} />
                  <div className="w-11 h-6 bg-stone-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 dark:peer-focus:ring-emerald-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-emerald-600"></div>
                </label>
              </div>
              <div className="flex items-center justify-between p-4">
                <div>
                  <p className="font-medium text-stone-900 dark:text-white">Privacy & Visibility</p>
                  <p className="text-sm text-stone-500 dark:text-gray-400">Control who sees your profile</p>
                </div>
                <span className="text-xs text-stone-400 dark:text-gray-500 px-2 py-1 rounded-full bg-stone-100 dark:bg-gray-700">
                  Coming soon
                </span>
              </div>
            </div>
          </section>
        )}

        <div className="mt-8 flex justify-center">
          <Link
            href="/"
            className="text-sm font-medium text-stone-600 dark:text-gray-400 hover:text-stone-900 dark:hover:text-white transition-colors"
          >
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  )
}

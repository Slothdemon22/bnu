'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  CheckSquare, 
  MessageSquare, 
  Video, 
  Settings, 
  Users, 
  Briefcase,
  ChevronLeft,
  ChevronRight,
  Plus,
  Search,
  Bell
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

export function DashboardSidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const pathname = usePathname()
  const { user } = useAuth()

  const menuItems = [
    { name: 'Dashboard', href: '/workspaces', icon: LayoutDashboard },
  ]

  const secondaryItems = [
    { name: 'Settings', href: '/profile', icon: Settings },
  ]

  return (
    <aside 
      className={`relative h-screen bg-white dark:bg-gray-950 border-r border-stone-200 dark:border-gray-800 transition-all duration-300 ease-in-out flex flex-col z-40 ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand / Logo */}
      <div className="p-6 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-emerald-500/20">
          <Briefcase className="w-5 h-5 text-white" />
        </div>
        {!isCollapsed && (
          <span className="font-bold text-xl tracking-tight text-stone-900 dark:text-white">
            FlowSync
          </span>
        )}
      </div>

      {/* Workspace Selector (Simplified for now) */}
      <div className="px-4 mb-6">
        <div className={`p-2 rounded-xl bg-stone-100 dark:bg-gray-900 border border-stone-200 dark:border-gray-800 flex items-center gap-3 ${isCollapsed ? 'justify-center' : ''}`}>
          <div className="w-8 h-8 rounded-lg bg-stone-900 dark:bg-white text-white dark:text-stone-900 flex items-center justify-center font-bold text-xs flex-shrink-0">
            {user?.workspaceName?.[0] || 'W'}
          </div>
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-stone-500 uppercase tracking-widest">Workspace</p>
              <p className="text-sm font-bold text-stone-900 dark:text-white truncate">{user?.workspaceName || 'My Workspace'}</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto">
        {!isCollapsed && (
          <p className="px-2 pb-2 text-[10px] font-bold text-stone-400 dark:text-gray-600 uppercase tracking-[0.2em]">
            Menu
          </p>
        )}
        {menuItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group ${
                isActive 
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20' 
                  : 'text-stone-600 dark:text-gray-400 hover:bg-stone-100 dark:hover:bg-gray-900'
              }`}
            >
              <item.icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-white' : 'group-hover:text-stone-900 dark:group-hover:text-white'}`} />
              {!isCollapsed && (
                <span className="font-semibold text-sm">{item.name}</span>
              )}
            </Link>
          )
        })}

        <div className="pt-6">
          {!isCollapsed && (
            <p className="px-2 pb-2 text-[10px] font-bold text-stone-400 dark:text-gray-600 uppercase tracking-[0.2em]">
              Support
            </p>
          )}
          {secondaryItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group ${
                  isActive 
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20' 
                    : 'text-stone-600 dark:text-gray-400 hover:bg-stone-100 dark:hover:bg-gray-900'
                }`}
              >
                <item.icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-white' : 'group-hover:text-stone-900 dark:group-hover:text-white'}`} />
                {!isCollapsed && (
                  <span className="font-semibold text-sm">{item.name}</span>
                )}
              </Link>
            )
          })}
        </div>
      </nav>

      {/* User Footer */}
      <div className="p-4 border-t border-stone-100 dark:border-gray-900">
        <Link 
          href="/profile"
          className={`flex items-center gap-3 hover:bg-stone-100 dark:hover:bg-gray-900 p-2 rounded-xl transition-all ${isCollapsed ? 'justify-center' : ''}`}
        >
          <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 font-bold border-2 border-emerald-500/20 overflow-hidden flex-shrink-0">
            {user?.imageUrl ? (
              <img src={user.imageUrl} alt={user.name || ''} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              user?.name?.[0] || 'U'
            )}
          </div>
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-stone-900 dark:text-white truncate">{user?.name || 'User'}</p>
              <p className="text-xs text-stone-500 truncate">{user?.email}</p>
            </div>
          )}
        </Link>
      </div>

      {/* Collapse Toggle */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-white dark:bg-gray-800 border border-stone-200 dark:border-gray-700 flex items-center justify-center shadow-md hover:scale-110 transition-transform z-50"
      >
        {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>
    </aside>
  )
}

'use client';

import React from "react";
import Navbar from "@/components/custom/Navbar";
import Footer from "@/components/custom/Footer";
import { useAuth } from "@/components/auth/AuthProvider";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { WorkspaceSidebar } from "@/components/dashboard/WorkspaceSidebar";
import { usePathname } from "next/navigation";
import { Search, Bell } from "lucide-react";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import Link from "next/link";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  
  // Workspace dashboard routes (e.g. /workspaces/my-slug/...)
  const isInsideWorkspace = pathname.startsWith('/workspaces/') && pathname.split('/').length > 2;
  
  // Routes that should display at least one of the sidebars
  const sidebarRoutes = ['/workspaces', '/tasks', '/chat', '/meeting', '/profile'];
  const showAnySidebar = !loading && user && user.onboardingCompleted && (sidebarRoutes.some(route => pathname.startsWith(route)));
  
  const showWorkspaceSidebar = showAnySidebar && isInsideWorkspace;
  const showDashboardSidebar = showAnySidebar && !isInsideWorkspace;

  if (pathname.startsWith('/meeting')) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen bg-stone-50 dark:bg-gray-950">
      {showWorkspaceSidebar && <WorkspaceSidebar />}
      {showDashboardSidebar && <DashboardSidebar />}
      <div className="flex-1 flex flex-col min-w-0 pt-20">
        <Navbar />
        {showAnySidebar && (
          <header className="h-16 border-b border-stone-200 dark:border-gray-800 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md flex items-center justify-between px-8 sticky top-0 z-30">
            <div className="flex items-center gap-4 flex-1">
              <div className="relative max-w-md w-full hidden md:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                <input 
                  type="text" 
                  placeholder="Search anything..." 
                  className="w-full pl-10 pr-4 py-2 bg-stone-100 dark:bg-gray-900 border-none rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 transition-all"
                />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <NotificationBell />
              <Link href="/profile" className="p-1 rounded-xl hover:bg-stone-100 dark:hover:bg-gray-900 transition-colors overflow-hidden">
                <div className="w-8 h-8 rounded-lg bg-stone-900 dark:bg-white text-white dark:text-stone-900 flex items-center justify-center font-bold text-xs overflow-hidden">
                  {user?.imageUrl ? (
                    <img src={user.imageUrl} alt={user.name || ''} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    user?.name?.[0] || 'U'
                  )}
                </div>
              </Link>
            </div>
          </header>
        )}
        <main className="flex-1">
          {children}
        </main>
        {!showAnySidebar && <Footer />}
      </div>
    </div>
  );
}

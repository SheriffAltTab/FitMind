import React from 'react'
import {
  LayoutDashboard,
  Dumbbell,
  Brain,
  Apple,
  Settings,
  LogOut,
  User,
  Shield,
} from 'lucide-react'
import { Logo } from './Logo'
import { motion } from 'framer-motion'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
interface SidebarProps {
  onLogout?: () => void
}
export function Sidebar({ onLogout }: SidebarProps) {
  const location = useLocation()
  const { user, isAdmin } = useAuth()
  const currentPath = location.pathname
  const navItems: { icon: React.ComponentType<{ className?: string }>; label: string; path: string }[] = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: Dumbbell, label: 'Fitness', path: '/fitness' },
    { icon: Brain, label: 'Mental Health', path: '/mental-health' },
    { icon: Apple, label: 'Nutrition', path: '/nutrition' },
    { icon: Settings, label: 'Profile & Settings', path: '/profile' },
    ...(isAdmin ? [{ icon: Shield, label: 'Admin', path: '/admin' }] : []),
  ]
  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-[var(--bg-sidebar)] border-r border-[var(--border)] flex flex-col z-50 hidden md:flex transition-colors duration-300">
      {/* Logo Area */}
      <div className="p-6 flex items-center gap-2">
        <div className="text-[var(--accent)] flex-shrink-0">
          <Logo size={28} />
        </div>
        <h1 className="text-xl font-bold text-[var(--text-primary)] tracking-tight">
          FitMind
        </h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-4 space-y-1">
        {navItems.map((item) => {
          const isActive = currentPath === item.path
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${isActive ? 'bg-[var(--accent)]/15 text-[var(--text-primary)] font-medium' : 'text-[var(--text-secondary)] hover:bg-[var(--border-light)]'}`}
            >
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute left-0 top-0 bottom-0 w-1 bg-[var(--accent)] rounded-r-full"
                  initial={{
                    opacity: 0,
                  }}
                  animate={{
                    opacity: 1,
                  }}
                  exit={{
                    opacity: 0,
                  }}
                />
              )}
              <item.icon
                className={`w-5 h-5 ${isActive ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]'}`}
              />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* User / Bottom Area */}
      <div className="p-4 border-t border-[var(--border)]">
        <Link
          to="/profile"
          className="flex items-center gap-3 p-2 rounded-xl hover:bg-[var(--border-light)] transition-colors cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-full bg-[var(--bg-primary)] flex items-center justify-center text-[var(--text-secondary)] group-hover:bg-[var(--accent)]/20 group-hover:text-[var(--text-primary)] transition-colors">
            <User className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-[var(--text-primary)] truncate">
              {user?.name ?? 'User'}
            </p>
            <p className="text-xs text-[var(--text-secondary)] truncate">
              {user?.email ?? ''}
            </p>
          </div>
        </Link>
        <button
          onClick={onLogout}
          className="w-full mt-2 flex items-center justify-center gap-2 p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-xs font-medium"
        >
          <LogOut className="w-3.5 h-3.5" />
          Sign Out
        </button>
      </div>
    </aside>
  )
}

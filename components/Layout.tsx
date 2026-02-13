import React from 'react'
import { Sidebar } from './Sidebar'
import { motion, AnimatePresence } from 'framer-motion'
import { useLocation } from 'react-router-dom'
interface LayoutProps {
  children: React.ReactNode
  onLogout?: () => void
}
export function Layout({ children, onLogout }: LayoutProps) {
  const location = useLocation()
  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex transition-colors duration-300">
      <Sidebar onLogout={onLogout} />

      <main className="flex-1 md:ml-64 p-4 md:p-8 overflow-x-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{
              opacity: 0,
              x: 20,
            }}
            animate={{
              opacity: 1,
              x: 0,
            }}
            exit={{
              opacity: 0,
              x: -20,
            }}
            transition={{
              duration: 0.3,
              ease: 'easeOut',
            }}
            className="w-full max-w-7xl mx-auto"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  )
}

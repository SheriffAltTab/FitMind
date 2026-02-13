import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Check, ArrowRight } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Logo } from '../components/Logo'
export function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)
    const result = login(email.trim(), password)
    setIsLoading(false)
    if (result.success) navigate('/dashboard')
    else setError(result.error ?? 'Login failed')
  }
  return (
    <div className="min-h-screen w-full flex bg-[var(--bg-card)]">
      {/* Left Panel - Geometric Pattern (Always Light) */}
      <div className="hidden lg:flex w-1/2 bg-[#F8FAFB] relative overflow-hidden items-center justify-center">
        {/* Geometric Pattern Background */}
        <div className="absolute inset-0 opacity-40">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern
                id="grid"
                width="40"
                height="40"
                patternUnits="userSpaceOnUse"
              >
                <circle cx="2" cy="2" r="1.5" fill="#A8E6CF" />
                <path
                  d="M 2 2 L 42 2"
                  stroke="#A8E6CF"
                  strokeWidth="0.5"
                  opacity="0.3"
                />
                <path
                  d="M 2 2 L 2 42"
                  stroke="#A8E6CF"
                  strokeWidth="0.5"
                  opacity="0.3"
                />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        {/* Content Overlay */}
        <div className="relative z-10 text-center p-12">
          <motion.div
            initial={{
              opacity: 0,
              y: 20,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              duration: 0.8,
            }}
          >
            <div className="w-16 h-16 rounded-2xl mx-auto mb-6 flex items-center justify-center text-[#2D3436]">
              <Logo size={56} />
            </div>
            <h1 className="text-4xl font-bold text-[#2D3436] mb-4 tracking-tight">
              FitMind
            </h1>
            <p className="text-xl text-[#636E72] font-medium">
              Your wellness, precisely tracked.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Right Panel - Login Form (Themed) */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-16 bg-[var(--bg-card)]">
        <motion.div
          className="w-full max-w-md"
          initial={{
            opacity: 0,
            x: 20,
          }}
          animate={{
            opacity: 1,
            x: 0,
          }}
          transition={{
            duration: 0.5,
            delay: 0.2,
          }}
        >
          <div className="mb-10">
            <h2 className="text-3xl font-bold text-[var(--text-primary)] mb-2">
              Welcome back
            </h2>
            <p className="text-[var(--text-secondary)]">
              Sign in to your wellness dashboard
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-[var(--text-primary)] mb-2"
              >
                Email address
              </label>
              <div className="relative">
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 outline-none transition-all placeholder:text-slate-400"
                  placeholder="name@example.com"
                  required
                />
                {email.includes('@') && email.includes('.') && (
                  <div className="absolute right-3 top-3.5 text-[var(--accent)]">
                    <Check className="w-5 h-5" />
                  </div>
                )}
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-[var(--text-primary)] mb-2"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 outline-none transition-all placeholder:text-slate-400"
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-slate-300 text-[var(--accent)] focus:ring-[var(--accent)]"
                />
                <span className="text-sm text-[var(--text-secondary)]">
                  Remember me
                </span>
              </label>
              <a
                href="#"
                className="text-sm font-medium text-[var(--text-primary)] hover:text-[var(--accent)] transition-colors"
              >
                Forgot password?
              </a>
            </div>

            {error && (
              <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[var(--accent)] hover:opacity-90 text-[#2D3436] font-semibold py-3.5 rounded-xl transition-all transform active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="w-5 h-5 border-2 border-[#2D3436] border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  Sign In <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-[var(--text-secondary)]">
            Don't have an account?{' '}
            <Link
              to="/signup"
              className="font-semibold text-[var(--text-primary)] hover:text-[var(--accent)] transition-colors"
            >
              Sign up
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  )
}

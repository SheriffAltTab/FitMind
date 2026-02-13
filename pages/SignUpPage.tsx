import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Eye,
  EyeOff,
  Check,
  ArrowRight,
  Target,
  Dumbbell,
  Moon,
  Wind,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Logo } from '../components/Logo'
type Step = 'form' | 'goals' | 'stats' | 'success'
const goals = [
  {
    id: 'weight',
    label: 'Lose Weight',
    icon: Target,
    color: 'text-rose-500',
    bg: 'bg-rose-50 dark:bg-rose-900/20',
    border: 'border-rose-200 dark:border-rose-800',
  },
  {
    id: 'muscle',
    label: 'Build Muscle',
    icon: Dumbbell,
    color: 'text-blue-500',
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    border: 'border-blue-200 dark:border-blue-800',
  },
  {
    id: 'sleep',
    label: 'Better Sleep',
    icon: Moon,
    color: 'text-indigo-500',
    bg: 'bg-indigo-50 dark:bg-indigo-900/20',
    border: 'border-indigo-200 dark:border-indigo-800',
  },
  {
    id: 'stress',
    label: 'Reduce Stress',
    icon: Wind,
    color: 'text-teal-500',
    bg: 'bg-teal-50 dark:bg-teal-900/20',
    border: 'border-teal-200 dark:border-teal-800',
  },
]
export function SignUpPage() {
  const navigate = useNavigate()
  const { signup } = useAuth()
  const [step, setStep] = useState<Step>('form')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [signUpError, setSignUpError] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [selectedGoal, setSelectedGoal] = useState<string>('')
  const [stats, setStats] = useState({
    height: 170,
    weight: 70,
    age: 25,
  })
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.confirmPassword && formData.password !== formData.confirmPassword) {
      setSignUpError('Passwords do not match')
      return
    }
    setSignUpError('')
    setIsLoading(true)
    setTimeout(() => {
      setIsLoading(false)
      setStep('goals')
    }, 400)
  }
  const handleGoalSelect = (goalId: string) => {
    setSelectedGoal(goalId)
  }
  const handleFinalSubmit = () => {
    setSignUpError('')
    setIsLoading(true)
    const result = signup({
      email: formData.email.trim(),
      password: formData.password,
      name: formData.name.trim(),
      height: stats.height,
      weight: stats.weight,
      age: stats.age,
    })
    setIsLoading(false)
    if (result.success) {
      setStep('success')
    } else {
      setSignUpError(result.error ?? 'Sign up failed')
    }
  }
  return (
    <div className="min-h-screen w-full flex bg-[var(--bg-card)]">
      {/* Left Panel - Geometric Pattern (Reused) */}
      <div className="hidden lg:flex w-1/2 bg-[#F8FAFB] relative overflow-hidden items-center justify-center">
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
              Join FitMind
            </h1>
            <p className="text-xl text-[#636E72] font-medium">
              Start your personalized wellness journey today.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Right Panel - Content */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-16 relative overflow-hidden bg-[var(--bg-card)]">
        <AnimatePresence mode="wait">
          {step === 'form' && (
            <motion.div
              key="form"
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
              className="w-full max-w-md"
            >
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-[var(--text-primary)] mb-2">
                  Create Account
                </h2>
                <p className="text-[var(--text-secondary)]">
                  Sign up to get started with FitMind
                </p>
              </div>

              <form onSubmit={handleFormSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        name: e.target.value,
                      })
                    }
                    className="w-full px-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 outline-none transition-all"
                    placeholder="John Doe"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">
                    Email address
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        email: e.target.value,
                      })
                    }
                    className="w-full px-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 outline-none transition-all"
                    placeholder="name@example.com"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          password: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 outline-none transition-all"
                      placeholder="Create a password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-[var(--accent)] hover:opacity-90 text-[#2D3436] font-semibold py-3.5 rounded-xl transition-all transform active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-70"
                >
                  {isLoading ? (
                    <span className="w-5 h-5 border-2 border-[#2D3436] border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      Create Account <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              <p className="mt-8 text-center text-sm text-[var(--text-secondary)]">
                Already have an account?{' '}
                <Link
                  to="/login"
                  className="font-semibold text-[var(--text-primary)] hover:text-[var(--accent)] transition-colors"
                >
                  Sign in
                </Link>
              </p>
            </motion.div>
          )}

          {step === 'goals' && (
            <motion.div
              key="goals"
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
              className="w-full max-w-md"
            >
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-1.5 w-8 bg-[var(--accent)] rounded-full" />
                  <div className="h-1.5 w-8 bg-[var(--bg-primary)] rounded-full" />
                </div>
                <h2 className="text-3xl font-bold text-[var(--text-primary)] mb-2">
                  What's your main goal?
                </h2>
                <p className="text-[var(--text-secondary)]">
                  We'll personalize your experience based on this.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 mb-8">
                {goals.map((goal) => (
                  <button
                    key={goal.id}
                    onClick={() => handleGoalSelect(goal.id)}
                    className={`flex items-center p-4 rounded-xl border-2 transition-all text-left group ${selectedGoal === goal.id ? `border-[var(--accent)] bg-[var(--accent)]/10` : 'border-[var(--border)] hover:border-[var(--accent)]/50 hover:bg-[var(--bg-primary)]'}`}
                  >
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center mr-4 ${goal.bg} ${goal.color}`}
                    >
                      <goal.icon className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-[var(--text-primary)]">
                        {goal.label}
                      </h3>
                    </div>
                    {selectedGoal === goal.id && (
                      <div className="w-6 h-6 rounded-full bg-[var(--accent)] flex items-center justify-center">
                        <Check className="w-4 h-4 text-[#2D3436]" />
                      </div>
                    )}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setStep('stats')}
                disabled={!selectedGoal}
                className="w-full bg-[var(--text-primary)] hover:opacity-90 text-[var(--bg-card)] font-semibold py-3.5 rounded-xl transition-all transform active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue <ChevronRight className="w-4 h-4" />
              </button>
            </motion.div>
          )}

          {step === 'stats' && (
            <motion.div
              key="stats"
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
              className="w-full max-w-md"
            >
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-1.5 w-8 bg-[var(--accent)] rounded-full" />
                  <div className="h-1.5 w-8 bg-[var(--accent)] rounded-full" />
                </div>
                <h2 className="text-3xl font-bold text-[var(--text-primary)] mb-2">
                  Tell us about you
                </h2>
                <p className="text-[var(--text-secondary)]">
                  This helps us calculate your metrics accurately.
                </p>
              </div>

              {signUpError && (
                <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg mb-4">
                  {signUpError}
                </p>
              )}
              <div className="space-y-8 mb-8">
                {/* Height Slider */}
                <div>
                  <div className="flex justify-between mb-4">
                    <label className="font-medium text-[var(--text-primary)]">
                      Height
                    </label>
                    <span className="font-bold text-[var(--text-primary)] bg-[var(--bg-primary)] px-3 py-1 rounded-lg">
                      {stats.height} cm
                    </span>
                  </div>
                  <input
                    type="range"
                    min="140"
                    max="210"
                    value={stats.height}
                    onChange={(e) =>
                      setStats({
                        ...stats,
                        height: parseInt(e.target.value),
                      })
                    }
                    className="w-full h-2 bg-[var(--bg-primary)] rounded-lg appearance-none cursor-pointer accent-[var(--accent)]"
                  />
                  <div className="flex justify-between mt-2 text-xs text-[var(--text-secondary)]">
                    <span>140cm</span>
                    <span>210cm</span>
                  </div>
                </div>

                {/* Weight Slider */}
                <div>
                  <div className="flex justify-between mb-4">
                    <label className="font-medium text-[var(--text-primary)]">
                      Weight
                    </label>
                    <span className="font-bold text-[var(--text-primary)] bg-[var(--bg-primary)] px-3 py-1 rounded-lg">
                      {stats.weight} kg
                    </span>
                  </div>
                  <input
                    type="range"
                    min="40"
                    max="150"
                    value={stats.weight}
                    onChange={(e) =>
                      setStats({
                        ...stats,
                        weight: parseInt(e.target.value),
                      })
                    }
                    className="w-full h-2 bg-[var(--bg-primary)] rounded-lg appearance-none cursor-pointer accent-[var(--accent)]"
                  />
                  <div className="flex justify-between mt-2 text-xs text-[var(--text-secondary)]">
                    <span>40kg</span>
                    <span>150kg</span>
                  </div>
                </div>

                {/* Age Slider */}
                <div>
                  <div className="flex justify-between mb-4">
                    <label className="font-medium text-[var(--text-primary)]">
                      Age
                    </label>
                    <span className="font-bold text-[var(--text-primary)] bg-[var(--bg-primary)] px-3 py-1 rounded-lg">
                      {stats.age} years
                    </span>
                  </div>
                  <input
                    type="range"
                    min="16"
                    max="80"
                    value={stats.age}
                    onChange={(e) =>
                      setStats({
                        ...stats,
                        age: parseInt(e.target.value),
                      })
                    }
                    className="w-full h-2 bg-[var(--bg-primary)] rounded-lg appearance-none cursor-pointer accent-[var(--accent)]"
                  />
                  <div className="flex justify-between mt-2 text-xs text-[var(--text-secondary)]">
                    <span>16</span>
                    <span>80</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep('goals')}
                  className="px-6 py-3.5 rounded-xl border border-[var(--border)] text-[var(--text-primary)] font-semibold hover:bg-[var(--bg-primary)] transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={handleFinalSubmit}
                  disabled={isLoading}
                  className="flex-1 bg-[var(--text-primary)] hover:opacity-90 text-[var(--bg-card)] font-semibold py-3.5 rounded-xl transition-all transform active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      Complete Setup <Check className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          )}

          {step === 'success' && (
            <motion.div
              key="success"
              initial={{
                opacity: 0,
                scale: 0.9,
              }}
              animate={{
                opacity: 1,
                scale: 1,
              }}
              className="w-full max-w-md text-center"
            >
              <div className="w-24 h-24 bg-[var(--accent)] rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg shadow-[var(--accent)]/30">
                <Check className="w-12 h-12 text-[#2D3436]" strokeWidth={3} />
              </div>
              <h2 className="text-3xl font-bold text-[var(--text-primary)] mb-4">
                You're all set!
              </h2>
              <p className="text-[var(--text-secondary)] mb-8 text-lg">
                Your profile has been created. Let's start your wellness
                journey.
              </p>
              <button
                onClick={() => navigate('/dashboard')}
                className="w-full bg-[var(--text-primary)] hover:opacity-90 text-[var(--bg-card)] font-semibold py-4 rounded-xl transition-all transform active:scale-[0.98] shadow-xl"
              >
                Go to Dashboard
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

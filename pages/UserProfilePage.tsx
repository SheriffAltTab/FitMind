import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  User,
  Bell,
  Shield,
  LogOut,
  ChevronRight,
  Mail,
  Moon,
  Sun,
  Globe,
  Download,
  Trash2,
  X,
  Check,
} from 'lucide-react'
import { useTheme } from '../components/ThemeContext'
import { useAuth } from '../contexts/AuthContext'
import { getAllUserData } from '../lib/storage'
import type { NotificationPrefs } from '../lib/types'

interface UserProfilePageProps {
  onLogout?: () => void
}

type ProfileTab = 'account' | 'preferences' | 'data'

export function UserProfilePage({ onLogout }: UserProfilePageProps) {
  const { user, appData, updateUser, logout, deleteAccount } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const [activeSection, setActiveSection] = useState<ProfileTab | null>(null)
  const [editPersonal, setEditPersonal] = useState(false)
  const [editEmail, setEditEmail] = useState(false)
  const [editPassword, setEditPassword] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [personalForm, setPersonalForm] = useState({
    name: user?.name ?? '',
    height: user?.height ?? 170,
    weight: user?.weight ?? 70,
    age: user?.age ?? 25,
  })
  const [newEmail, setNewEmail] = useState(user?.email ?? '')
  const [passwordForm, setPasswordForm] = useState({ current: '', new: '', confirm: '' })

  React.useEffect(() => {
    if (user) {
      setPersonalForm({ name: user.name, height: user.height, weight: user.weight, age: user.age })
      setNewEmail(user.email)
    }
  }, [user?.id])

  const handleSavePersonal = () => {
    updateUser({
      name: personalForm.name.trim(),
      height: personalForm.height,
      weight: personalForm.weight,
      age: personalForm.age,
    })
    setEditPersonal(false)
  }

  const handleSaveEmail = () => {
    if (newEmail.trim() && newEmail.includes('@')) {
      updateUser({ email: newEmail.trim() })
      setEditEmail(false)
    }
  }

  const handleSavePassword = () => {
    if (passwordForm.new.length >= 6 && passwordForm.new === passwordForm.confirm) {
      updateUser({ password: passwordForm.new, lastPasswordChange: new Date().toISOString() })
      setPasswordForm({ current: '', new: '', confirm: '' })
      setEditPassword(false)
    }
  }

  const handleToggleNotification = (key: keyof NotificationPrefs) => {
    if (!user) return
    updateUser({
      notifications: { ...user.notifications, [key]: !user.notifications[key] },
    })
  }

  const handleThemeToggle = () => {
    toggleTheme()
    updateUser({ theme: theme === 'light' ? 'dark' : 'light' })
  }

  const handleDownloadData = () => {
    if (!user) return
    const data = getAllUserData(user)
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `fitmind-data-${user.id}-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleDeleteAccount = () => {
    deleteAccount()
    setConfirmDelete(false)
  }

  if (!user) return null

  const initials = user.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
  const memberSince = user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : ''

  return (
    <div className="space-y-8 pb-8">
      <div>
        <h1 className="text-3xl font-bold text-[var(--text-primary)] tracking-tight">Profile</h1>
        <p className="text-[var(--text-secondary)] mt-1">Manage your account and settings</p>
      </div>

      {/* Profile Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-[var(--bg-card)] p-8 rounded-xl shadow-sm border border-[var(--border)] flex flex-col md:flex-row items-center gap-8"
      >
        <div className="relative">
          <div className="w-24 h-24 rounded-full bg-[var(--bg-primary)] flex items-center justify-center text-[var(--text-secondary)] text-3xl font-bold border-4 border-[var(--bg-card)] shadow-lg">
            {initials}
          </div>
        </div>
        <div className="text-center md:text-left flex-1">
          <h2 className="text-2xl font-bold text-[var(--text-primary)]">{user.name}</h2>
          <p className="text-[var(--text-secondary)] mb-4">Member since {memberSince}</p>
          <div className="flex flex-wrap justify-center md:justify-start gap-2">
            <span className="px-3 py-1 rounded-full bg-[var(--bg-primary)] text-[var(--text-secondary)] text-sm font-medium border border-[var(--border)]">
              Level {appData?.level ?? 1}
            </span>
          </div>
        </div>
        <div className="flex gap-8 text-center border-t md:border-t-0 md:border-l border-[var(--border)] pt-6 md:pt-0 md:pl-8 w-full md:w-auto justify-center md:justify-start">
          <div>
            <p className="text-2xl font-bold text-[var(--text-primary)]">{user.weight}</p>
            <p className="text-xs text-[var(--text-secondary)] uppercase tracking-wider">Weight</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-[var(--text-primary)]">{user.height}</p>
            <p className="text-xs text-[var(--text-secondary)] uppercase tracking-wider">Height</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-[var(--text-primary)]">{user.age}</p>
            <p className="text-xs text-[var(--text-secondary)] uppercase tracking-wider">Age</p>
          </div>
        </div>
      </motion.div>

      {/* Account */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-[var(--bg-card)] rounded-xl shadow-sm border border-[var(--border)] overflow-hidden"
      >
        <button
          onClick={() => setActiveSection(activeSection === 'account' ? null : 'account')}
          className="w-full px-6 py-4 border-b border-[var(--border)] bg-[var(--bg-primary)] flex items-center justify-between"
        >
          <h3 className="font-bold text-[var(--text-primary)]">Account</h3>
          <ChevronRight className={`w-4 h-4 transition-transform ${activeSection === 'account' ? 'rotate-90' : ''}`} />
        </button>
        <AnimatePresence>
          {activeSection === 'account' && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="divide-y divide-[var(--border)]"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-[var(--bg-primary)] flex items-center justify-center">
                      <User className="w-5 h-5 text-[var(--text-secondary)]" />
                    </div>
                    <div>
                      <p className="font-medium text-[var(--text-primary)]">Personal Information</p>
                      <p className="text-xs text-[var(--text-secondary)]">Name, age, weight, height</p>
                    </div>
                  </div>
                  {!editPersonal ? (
                    <button
                      onClick={() => setEditPersonal(true)}
                      className="text-sm font-medium text-[var(--accent)] hover:underline"
                    >
                      Edit
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button onClick={handleSavePersonal} className="p-2 rounded-full bg-[var(--accent)] text-[var(--text-primary)]">
                        <Check className="w-4 h-4" />
                      </button>
                      <button onClick={() => setEditPersonal(false)} className="p-2 rounded-full bg-red-100 text-red-500">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
                {editPersonal && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="block text-xs text-[var(--text-secondary)] mb-1">Name</label>
                      <input
                        value={personalForm.name}
                        onChange={(e) => setPersonalForm((p) => ({ ...p, name: e.target.value }))}
                        className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-[var(--text-secondary)] mb-1">Age</label>
                      <input
                        type="number"
                        min="16"
                        max="100"
                        value={personalForm.age}
                        onChange={(e) => setPersonalForm((p) => ({ ...p, age: parseInt(e.target.value, 10) || 0 }))}
                        className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-[var(--text-secondary)] mb-1">Weight (kg)</label>
                      <input
                        type="number"
                        min="40"
                        max="200"
                        value={personalForm.weight}
                        onChange={(e) => setPersonalForm((p) => ({ ...p, weight: parseInt(e.target.value, 10) || 0 }))}
                        className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-[var(--text-secondary)] mb-1">Height (cm)</label>
                      <input
                        type="number"
                        min="140"
                        max="220"
                        value={personalForm.height}
                        onChange={(e) => setPersonalForm((p) => ({ ...p, height: parseInt(e.target.value, 10) || 0 }))}
                        className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)]"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs text-[var(--text-secondary)] mb-1">Daily calorie goal</label>
                      <input
                        type="number"
                        min="1000"
                        max="5000"
                        value={user.dailyCalorieGoal}
                        onChange={(e) => updateUser({ dailyCalorieGoal: parseInt(e.target.value, 10) || 2200 })}
                        className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)]"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-[var(--bg-primary)] flex items-center justify-center">
                      <Mail className="w-5 h-5 text-[var(--text-secondary)]" />
                    </div>
                    <div>
                      <p className="font-medium text-[var(--text-primary)]">Email Address</p>
                      <p className="text-xs text-[var(--text-secondary)]">{user.email}</p>
                    </div>
                  </div>
                  {!editEmail ? (
                    <button onClick={() => setEditEmail(true)} className="text-sm font-medium text-[var(--accent)] hover:underline">
                      Change
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button onClick={handleSaveEmail} className="p-2 rounded-full bg-[var(--accent)] text-[var(--text-primary)]">
                        <Check className="w-4 h-4" />
                      </button>
                      <button onClick={() => setEditEmail(false)} className="p-2 rounded-full bg-red-100 text-red-500">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
                {editEmail && (
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="w-full mt-2 px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)]"
                    placeholder="New email"
                  />
                )}
              </div>

              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-[var(--bg-primary)] flex items-center justify-center">
                      <Shield className="w-5 h-5 text-[var(--text-secondary)]" />
                    </div>
                    <div>
                      <p className="font-medium text-[var(--text-primary)]">Password & Security</p>
                      <p className="text-xs text-[var(--text-secondary)]">
                        {user.lastPasswordChange ? 'Last changed recently' : 'Set a password'}
                      </p>
                    </div>
                  </div>
                  {!editPassword ? (
                    <button onClick={() => setEditPassword(true)} className="text-sm font-medium text-[var(--accent)] hover:underline">
                      Change
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button onClick={handleSavePassword} className="p-2 rounded-full bg-[var(--accent)] text-[var(--text-primary)]">
                        <Check className="w-4 h-4" />
                      </button>
                      <button onClick={() => setEditPassword(false)} className="p-2 rounded-full bg-red-100 text-red-500">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
                {editPassword && (
                  <div className="space-y-3 mt-4">
                    <input
                      type="password"
                      value={passwordForm.new}
                      onChange={(e) => setPasswordForm((p) => ({ ...p, new: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)]"
                      placeholder="New password (min 6 characters)"
                    />
                    <input
                      type="password"
                      value={passwordForm.confirm}
                      onChange={(e) => setPasswordForm((p) => ({ ...p, confirm: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)]"
                      placeholder="Confirm new password"
                    />
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Preferences */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-[var(--bg-card)] rounded-xl shadow-sm border border-[var(--border)] overflow-hidden"
      >
        <button
          onClick={() => setActiveSection(activeSection === 'preferences' ? null : 'preferences')}
          className="w-full px-6 py-4 border-b border-[var(--border)] bg-[var(--bg-primary)] flex items-center justify-between"
        >
          <h3 className="font-bold text-[var(--text-primary)]">Preferences</h3>
          <ChevronRight className={`w-4 h-4 transition-transform ${activeSection === 'preferences' ? 'rotate-90' : ''}`} />
        </button>
        <AnimatePresence>
          {activeSection === 'preferences' && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="divide-y divide-[var(--border)]"
            >
              {[
                { key: 'workouts' as const, label: 'Workout reminders', value: user.notifications.workouts },
                { key: 'mindfulness' as const, label: 'Mindfulness reminders', value: user.notifications.mindfulness },
                { key: 'nutrition' as const, label: 'Nutrition reminders', value: user.notifications.nutrition },
                { key: 'reminders' as const, label: 'General reminders', value: user.notifications.reminders },
              ].map((item) => (
                <div key={item.key} className="px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-[var(--bg-primary)] flex items-center justify-center">
                      <Bell className="w-5 h-5 text-[var(--text-secondary)]" />
                    </div>
                    <span className="font-medium text-[var(--text-primary)]">{item.label}</span>
                  </div>
                  <button
                    onClick={() => handleToggleNotification(item.key)}
                    className={`w-10 h-6 rounded-full p-1 transition-colors ${item.value ? 'bg-[var(--accent)]' : 'bg-slate-200 dark:bg-slate-600'}`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${item.value ? 'translate-x-4' : 'translate-x-0'}`}
                    />
                  </button>
                </div>
              ))}
              <div className="px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-[var(--bg-primary)] flex items-center justify-center">
                    {theme === 'light' ? <Moon className="w-5 h-5 text-[var(--text-secondary)]" /> : <Sun className="w-5 h-5 text-[var(--text-secondary)]" />}
                  </div>
                  <div>
                    <p className="font-medium text-[var(--text-primary)]">Appearance</p>
                    <p className="text-xs text-[var(--text-secondary)]">{theme === 'light' ? 'Light' : 'Dark'}</p>
                  </div>
                </div>
                <button
                  onClick={handleThemeToggle}
                  className={`w-10 h-6 rounded-full p-1 transition-colors ${theme === 'dark' ? 'bg-[var(--accent)]' : 'bg-slate-200'}`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${theme === 'dark' ? 'translate-x-4' : 'translate-x-0'}`}
                  />
                </button>
              </div>
              <div className="px-6 py-4 flex items-center justify-between opacity-60">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-[var(--bg-primary)] flex items-center justify-center">
                    <Globe className="w-5 h-5 text-[var(--text-secondary)]" />
                  </div>
                  <div>
                    <p className="font-medium text-[var(--text-primary)]">Language</p>
                    <p className="text-xs text-[var(--text-secondary)]">English (Unavailable)</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Data & Privacy */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-[var(--bg-card)] rounded-xl shadow-sm border border-[var(--border)] overflow-hidden"
      >
        <button
          onClick={() => setActiveSection(activeSection === 'data' ? null : 'data')}
          className="w-full px-6 py-4 border-b border-[var(--border)] bg-[var(--bg-primary)] flex items-center justify-between"
        >
          <h3 className="font-bold text-[var(--text-primary)]">Data & Privacy</h3>
          <ChevronRight className={`w-4 h-4 transition-transform ${activeSection === 'data' ? 'rotate-90' : ''}`} />
        </button>
        <AnimatePresence>
          {activeSection === 'data' && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="divide-y divide-[var(--border)]"
            >
              <button
                onClick={handleDownloadData}
                className="w-full px-6 py-4 flex items-center gap-4 hover:bg-[var(--bg-primary)] transition-colors text-left"
              >
                <div className="w-10 h-10 rounded-full bg-[var(--bg-primary)] flex items-center justify-center text-blue-500">
                  <Download className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-[var(--text-primary)]">Download My Data</p>
                  <p className="text-xs text-[var(--text-secondary)]">Get a copy of all your tracked metrics</p>
                </div>
                <ChevronRight className="w-4 h-4 text-[var(--text-secondary)]" />
              </button>
              <div className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center text-red-500">
                    <Trash2 className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-[var(--text-primary)]">Delete Account</p>
                    <p className="text-xs text-[var(--text-secondary)]">Permanently remove all data</p>
                  </div>
                  {!confirmDelete ? (
                    <button
                      onClick={() => setConfirmDelete(true)}
                      className="px-4 py-2 rounded-lg border border-red-500 text-red-500 font-medium hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      Delete
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={handleDeleteAccount}
                        className="px-4 py-2 rounded-lg bg-red-500 text-white font-medium hover:bg-red-600"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => setConfirmDelete(false)}
                        className="px-4 py-2 rounded-lg border border-[var(--border)] text-[var(--text-primary)]"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="flex justify-center pt-8">
        <button
          onClick={onLogout}
          className="flex items-center gap-2 px-6 py-3 rounded-xl text-red-600 dark:text-red-400 font-medium hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          Sign Out of FitMind
        </button>
      </motion.div>
    </div>
  )
}

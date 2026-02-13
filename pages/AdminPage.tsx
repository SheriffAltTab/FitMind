import React, { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts'
import {
  Dumbbell,
  Brain,
  Users,
  BarChart3,
  Plus,
  Pencil,
  Trash2,
  Search,
  Shield,
  ShieldOff,
  Ban,
  CheckCircle,
} from 'lucide-react'
import { getUsers, getAppData, setUserRole, setUserBanned } from '../lib/storage'
import {
  getStoredWorkouts,
  saveStoredWorkouts,
  getWorkouts,
  getStoredSessions,
  saveStoredSessions,
  getSessions,
} from '../lib/adminStorage'
import { categories, type WorkoutItem } from '../lib/workouts'
import type { MindfulnessSessionStored, MindfulnessIconName } from '../lib/mentalHealth'
import { sessionsStoredDefault } from '../lib/mentalHealth'
import type { User } from '../lib/types'

const TAB_OPTIONS = [
  { id: 'fitness' as const, label: 'Fitness', icon: Dumbbell },
  { id: 'mental' as const, label: 'Mental Health', icon: Brain },
  { id: 'users' as const, label: 'Users', icon: Users },
  { id: 'demographics' as const, label: 'Demographics', icon: BarChart3 },
]

const CATEGORY_OPTIONS = categories.filter((c) => c !== 'All')
const DIFFICULTY_OPTIONS = ['Easy', 'Medium', 'High']
const DIFFICULTY_COLORS: Record<string, string> = {
  Easy: 'text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400',
  Medium: 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 dark:text-yellow-400',
  High: 'text-red-500 bg-red-50 dark:bg-red-900/20 dark:text-red-400',
}
const ICON_OPTIONS: MindfulnessIconName[] = ['Wind', 'Moon', 'Heart', 'Headphones']

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2)
}

export function AdminPage() {
  const [activeTab, setActiveTab] = useState<'fitness' | 'mental' | 'users' | 'demographics'>('fitness')
  const [workoutsList, setWorkoutsList] = useState<WorkoutItem[]>([])
  const [sessionsList, setSessionsList] = useState<MindfulnessSessionStored[]>([])
  const [usersList, setUsersList] = useState<User[]>([])
  const [userSearch, setUserSearch] = useState('')
  const [editingWorkout, setEditingWorkout] = useState<WorkoutItem | null>(null)
  const [editingSession, setEditingSession] = useState<MindfulnessSessionStored | null>(null)
  const [showWorkoutForm, setShowWorkoutForm] = useState(false)
  const [showSessionForm, setShowSessionForm] = useState(false)

  useEffect(() => {
    const stored = getStoredWorkouts()
    if (stored.length > 0) setWorkoutsList(stored)
    else setWorkoutsList(getWorkouts())
  }, [activeTab])

  useEffect(() => {
    const stored = getStoredSessions()
    if (stored.length > 0) setSessionsList(stored)
    else setSessionsList(sessionsStoredDefault)
  }, [activeTab])

  useEffect(() => {
    setUsersList(getUsers())
  }, [activeTab])

  const filteredUsers = useMemo(() => {
    const q = userSearch.trim().toLowerCase()
    if (!q) return usersList
    return usersList.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.id.toLowerCase().includes(q)
    )
  }, [usersList, userSearch])

  const handleSaveWorkouts = (list: WorkoutItem[]) => {
    saveStoredWorkouts(list)
    setWorkoutsList(list)
    setEditingWorkout(null)
    setShowWorkoutForm(false)
  }

  const handleSaveSessions = (list: MindfulnessSessionStored[]) => {
    saveStoredSessions(list)
    setSessionsList(list)
    setEditingSession(null)
    setShowSessionForm(false)
  }

  const handleUserRoleToggle = (userId: string, currentRole?: string) => {
    const next = currentRole === 'admin' ? 'user' : 'admin'
    setUserRole(userId, next)
    setUsersList(getUsers())
  }

  const handleUserBannedToggle = (userId: string, currentBanned?: boolean) => {
    setUserBanned(userId, !currentBanned)
    setUsersList(getUsers())
  }

  const demographicsData = useMemo(() => {
    const users = getUsers()
    const workoutCounts: Record<string, number> = {}
    const sessionCounts: Record<string, number> = {}
    for (const u of users) {
      const data = getAppData(u.id)
      for (const day of Object.keys(data.workoutsByDay ?? {})) {
        for (const title of data.workoutsByDay![day] ?? []) {
          workoutCounts[title] = (workoutCounts[title] ?? 0) + 1
        }
      }
      for (const [sessionId, prog] of Object.entries(data.mindfulnessProgress ?? {})) {
        if ((prog?.percent ?? 0) >= 100) {
          sessionCounts[sessionId] = (sessionCounts[sessionId] ?? 0) + 1
        }
      }
    }
    const workoutChart = Object.entries(workoutCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 15)
    const sessions = getSessions()
    const sessionIdToTitle: Record<string, string> = {}
    for (const s of sessions) sessionIdToTitle[s.id] = s.title
    const sessionChart = Object.entries(sessionCounts)
      .map(([id, count]) => ({ name: sessionIdToTitle[id] || id, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 15)
    return { workoutChart, sessionChart }
  }, [activeTab])

  return (
    <div className="space-y-8 pb-8">
      <div>
        <h1 className="text-3xl font-bold text-[var(--text-primary)] tracking-tight">Admin Panel</h1>
        <p className="text-[var(--text-secondary)] mt-1">Manage exercises, users, and view demographics</p>
      </div>

      <div className="flex gap-2 flex-wrap border-b border-[var(--border)] pb-2">
        {TAB_OPTIONS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-[var(--accent)] text-[var(--text-primary)]'
                : 'text-[var(--text-secondary)] hover:bg-[var(--border-light)]'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'fitness' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-[var(--text-primary)]">Fitness exercises</h2>
            <button
              onClick={() => {
                setEditingWorkout(null)
                setShowWorkoutForm(true)
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--accent)] text-[var(--text-primary)] font-medium hover:opacity-90"
            >
              <Plus className="w-4 h-4" />
              Add exercise
            </button>
          </div>
          <div className="grid gap-4">
            {(workoutsList.length ? workoutsList : getWorkouts()).map((w) => (
              <div
                key={w.id}
                className="flex items-center justify-between p-4 rounded-xl border border-[var(--border)] bg-[var(--bg-card)]"
              >
                <div>
                  <p className="font-semibold text-[var(--text-primary)]">{w.title}</p>
                  <p className="text-sm text-[var(--text-secondary)]">{w.category} · {w.duration} · {w.difficulty}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setEditingWorkout(w)
                      setShowWorkoutForm(true)
                    }}
                    className="p-2 rounded-lg border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--border-light)]"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      const list = (workoutsList.length ? workoutsList : getWorkouts()).filter((x) => x.id !== w.id)
                      handleSaveWorkouts(list)
                    }}
                    className="p-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-900/20"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
          {showWorkoutForm && (
            <WorkoutForm
              workout={editingWorkout}
              onSave={(w) => {
                const list = workoutsList.length ? [...workoutsList] : [...getWorkouts()]
                const idx = list.findIndex((x) => x.id === w.id)
                if (idx >= 0) list[idx] = w
                else list.push(w)
                handleSaveWorkouts(list)
              }}
              onCancel={() => {
                setShowWorkoutForm(false)
                setEditingWorkout(null)
              }}
            />
          )}
        </motion.div>
      )}

      {activeTab === 'mental' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-[var(--text-primary)]">Mental Health sessions</h2>
            <button
              onClick={() => {
                setEditingSession(null)
                setShowSessionForm(true)
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--accent)] text-[var(--text-primary)] font-medium hover:opacity-90"
            >
              <Plus className="w-4 h-4" />
              Add session
            </button>
          </div>
          <div className="grid gap-4">
            {(sessionsList.length ? sessionsList : sessionsStoredDefault).map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between p-4 rounded-xl border border-[var(--border)] bg-[var(--bg-card)]"
              >
                <div>
                  <p className="font-semibold text-[var(--text-primary)]">{s.title}</p>
                  <p className="text-sm text-[var(--text-secondary)]">{s.type} · {s.duration}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setEditingSession(s)
                      setShowSessionForm(true)
                    }}
                    className="p-2 rounded-lg border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--border-light)]"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      const list = sessionsList.length ? sessionsList : [...sessionsStoredDefault]
                      const next = list.filter((x) => x.id !== s.id)
                      handleSaveSessions(next)
                    }}
                    className="p-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-900/20"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
          {showSessionForm && (
            <SessionForm
              session={editingSession}
              onSave={(s) => {
                const list = sessionsList.length ? [...sessionsList] : [...sessionsStoredDefault]
                const idx = list.findIndex((x) => x.id === s.id)
                if (idx >= 0) list[idx] = s
                else list.push(s)
                handleSaveSessions(list)
              }}
              onCancel={() => {
                setShowSessionForm(false)
                setEditingSession(null)
              }}
            />
          )}
        </motion.div>
      )}

      {activeTab === 'users' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          <h2 className="text-xl font-bold text-[var(--text-primary)]">Users</h2>
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]" />
            <input
              type="text"
              placeholder="Search by name, email, or ID..."
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]"
            />
          </div>
          <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
            <table className="w-full text-left">
              <thead className="bg-[var(--bg-card)] border-b border-[var(--border)]">
                <tr>
                  <th className="p-3 text-sm font-semibold text-[var(--text-primary)]">Name</th>
                  <th className="p-3 text-sm font-semibold text-[var(--text-primary)]">Email</th>
                  <th className="p-3 text-sm font-semibold text-[var(--text-primary)]">ID</th>
                  <th className="p-3 text-sm font-semibold text-[var(--text-primary)]">Role</th>
                  <th className="p-3 text-sm font-semibold text-[var(--text-primary)]">Banned</th>
                  <th className="p-3 text-sm font-semibold text-[var(--text-primary)]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="bg-[var(--bg-card)] hover:bg-[var(--border-light)]/50">
                    <td className="p-3 text-[var(--text-primary)]">{u.name}</td>
                    <td className="p-3 text-[var(--text-secondary)]">{u.email}</td>
                    <td className="p-3 text-xs text-[var(--text-secondary)] font-mono">{u.id.slice(0, 8)}…</td>
                    <td className="p-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${u.role === 'admin' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' : 'bg-[var(--border-light)] text-[var(--text-secondary)]'}`}>
                        {u.role ?? 'user'}
                      </span>
                    </td>
                    <td className="p-3">{u.banned ? <span className="text-red-600 dark:text-red-400 text-sm">Yes</span> : <span className="text-[var(--text-secondary)] text-sm">No</span>}</td>
                    <td className="p-3 flex gap-2">
                      <button
                        onClick={() => handleUserRoleToggle(u.id, u.role)}
                        title={u.role === 'admin' ? 'Remove admin' : 'Make admin'}
                        className={`p-1.5 rounded-lg border ${u.role === 'admin' ? 'border-amber-200 text-amber-600 dark:border-amber-800 dark:text-amber-400' : 'border-[var(--border)] text-[var(--text-secondary)]'} hover:opacity-80`}
                      >
                        {u.role === 'admin' ? <ShieldOff className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => handleUserBannedToggle(u.id, u.banned)}
                        title={u.banned ? 'Unban' : 'Ban'}
                        className={`p-1.5 rounded-lg border ${u.banned ? 'border-green-200 text-green-600 dark:border-green-800 dark:text-green-400' : 'border-red-200 text-red-600 dark:border-red-800 dark:text-red-400'} hover:opacity-80`}
                      >
                        {u.banned ? <CheckCircle className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {activeTab === 'demographics' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
          <h2 className="text-xl font-bold text-[var(--text-primary)]">Favorite activities</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-[var(--bg-card)] p-6 rounded-xl border border-[var(--border)]">
              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Top workouts</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={demographicsData.workoutChart} margin={{ top: 5, right: 20, left: 0, bottom: 60 }}>
                    <XAxis dataKey="name" tick={{ fill: 'var(--text-secondary)', fontSize: 10 }} angle={-45} textAnchor="end" />
                    <YAxis tick={{ fill: 'var(--text-secondary)', fontSize: 10 }} />
                    <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--bg-card)' }} />
                    <Bar dataKey="count" fill="var(--accent)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="bg-[var(--bg-card)] p-6 rounded-xl border border-[var(--border)]">
              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Top mindfulness sessions</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={demographicsData.sessionChart} margin={{ top: 5, right: 20, left: 0, bottom: 60 }}>
                    <XAxis dataKey="name" tick={{ fill: 'var(--text-secondary)', fontSize: 10 }} angle={-45} textAnchor="end" />
                    <YAxis tick={{ fill: 'var(--text-secondary)', fontSize: 10 }} />
                    <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--bg-card)' }} />
                    <Bar dataKey="count" fill="var(--accent)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}

function WorkoutForm({
  workout,
  onSave,
  onCancel,
}: {
  workout: WorkoutItem | null
  onSave: (w: WorkoutItem) => void
  onCancel: () => void
}) {
  const [title, setTitle] = useState(workout?.title ?? '')
  const [category, setCategory] = useState(workout?.category ?? CATEGORY_OPTIONS[0])
  const [durationMinutes, setDurationMinutes] = useState(workout?.durationMinutes ?? 20)
  const [calories, setCalories] = useState(workout?.calories ?? '200 cal')
  const [difficulty, setDifficulty] = useState(workout?.difficulty ?? 'Medium')
  const [description, setDescription] = useState(workout?.description ?? '')
  const [musclesStr, setMusclesStr] = useState((workout?.muscles ?? []).join(', '))
  const [equipmentStr, setEquipmentStr] = useState((workout?.equipment ?? []).join(', '))
  const [imageGradient, setImageGradient] = useState(workout?.imageGradient ?? 'from-orange-400 to-pink-500')
  const [videoUrl, setVideoUrl] = useState(workout?.videoUrl ?? '')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const muscles = musclesStr.split(',').map((s) => s.trim()).filter(Boolean)
    const equipment = equipmentStr.split(',').map((s) => s.trim()).filter(Boolean)
    const difficultyColor = DIFFICULTY_COLORS[difficulty] ?? DIFFICULTY_COLORS.Medium
    onSave({
      id: workout?.id ?? generateId(),
      title,
      category,
      durationMinutes,
      duration: `${durationMinutes} min`,
      calories,
      difficulty,
      difficultyColor,
      imageGradient,
      description,
      muscles,
      equipment,
      ...(videoUrl ? { videoUrl } : {}),
    })
  }

  return (
    <form onSubmit={handleSubmit} className="bg-[var(--bg-card)] p-6 rounded-xl border border-[var(--border)] space-y-4 max-w-xl">
      <h3 className="text-lg font-bold text-[var(--text-primary)]">{workout ? 'Edit exercise' : 'New exercise'}</h3>
      <div>
        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Title</label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} required className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)]" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Category</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)]">
            {CATEGORY_OPTIONS.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Duration (min)</label>
          <input type="number" min={1} value={durationMinutes} onChange={(e) => setDurationMinutes(Number(e.target.value) || 1)} className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)]" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Calories</label>
          <input value={calories} onChange={(e) => setCalories(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)]" />
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Difficulty</label>
          <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)]">
            {DIFFICULTY_OPTIONS.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Description</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)]" />
      </div>
      <div>
        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Muscles (comma-separated)</label>
        <input value={musclesStr} onChange={(e) => setMusclesStr(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)]" />
      </div>
      <div>
        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Equipment (comma-separated)</label>
        <input value={equipmentStr} onChange={(e) => setEquipmentStr(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)]" />
      </div>
      <div>
        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Image gradient (Tailwind classes)</label>
        <input value={imageGradient} onChange={(e) => setImageGradient(e.target.value)} placeholder="from-orange-400 to-pink-500" className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)]" />
      </div>
      <div>
        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Video URL (optional)</label>
        <input value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="https://..." type="url" className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)]" />
      </div>
      <div className="flex gap-2 pt-2">
        <button type="submit" className="px-4 py-2 rounded-xl bg-[var(--accent)] text-[var(--text-primary)] font-medium hover:opacity-90">
          Save
        </button>
        <button type="button" onClick={onCancel} className="px-4 py-2 rounded-xl border border-[var(--border)] text-[var(--text-primary)] hover:bg-[var(--border-light)]">
          Cancel
        </button>
      </div>
    </form>
  )
}

function SessionForm({
  session,
  onSave,
  onCancel,
}: {
  session: MindfulnessSessionStored | null
  onSave: (s: MindfulnessSessionStored) => void
  onCancel: () => void
}) {
  const [title, setTitle] = useState(session?.title ?? '')
  const [type, setType] = useState(session?.type ?? 'Meditation')
  const [durationMinutes, setDurationMinutes] = useState(session?.durationMinutes ?? 10)
  const [description, setDescription] = useState(session?.description ?? '')
  const [benefitsStr, setBenefitsStr] = useState((session?.benefits ?? []).join(', '))
  const [instructionsStr, setInstructionsStr] = useState((session?.instructions ?? []).join(', '))
  const [color, setColor] = useState(session?.color ?? 'text-blue-500 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400')
  const [iconName, setIconName] = useState<MindfulnessIconName>(session?.iconName ?? 'Wind')
  const [audioUrl, setAudioUrl] = useState(session?.audioUrl ?? '')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const benefits = benefitsStr.split(',').map((s) => s.trim()).filter(Boolean)
    const instructions = instructionsStr.split(',').map((s) => s.trim()).filter(Boolean)
    onSave({
      id: session?.id ?? generateId(),
      title,
      type,
      durationMinutes,
      duration: `${durationMinutes} min`,
      iconName,
      color,
      description,
      benefits,
      instructions,
      ...(audioUrl ? { audioUrl } : {}),
    })
  }

  return (
    <form onSubmit={handleSubmit} className="bg-[var(--bg-card)] p-6 rounded-xl border border-[var(--border)] space-y-4 max-w-xl">
      <h3 className="text-lg font-bold text-[var(--text-primary)]">{session ? 'Edit session' : 'New session'}</h3>
      <div>
        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Title</label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} required className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)]" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Type</label>
          <input value={type} onChange={(e) => setType(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)]" placeholder="e.g. Meditation, Breathing" />
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Duration (min)</label>
          <input type="number" min={1} value={durationMinutes} onChange={(e) => setDurationMinutes(Number(e.target.value) || 1)} className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)]" />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Icon</label>
        <select value={iconName} onChange={(e) => setIconName(e.target.value as MindfulnessIconName)} className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)]">
          {ICON_OPTIONS.map((i) => (
            <option key={i} value={i}>{i}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Color (Tailwind classes)</label>
        <input value={color} onChange={(e) => setColor(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)]" />
      </div>
      <div>
        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Description</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)]" />
      </div>
      <div>
        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Benefits (comma-separated)</label>
        <input value={benefitsStr} onChange={(e) => setBenefitsStr(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)]" />
      </div>
      <div>
        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Instructions (comma-separated)</label>
        <input value={instructionsStr} onChange={(e) => setInstructionsStr(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)]" />
      </div>
      <div>
        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Audio URL (optional)</label>
        <input value={audioUrl} onChange={(e) => setAudioUrl(e.target.value)} placeholder="https://..." type="url" className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)]" />
      </div>
      <div className="flex gap-2 pt-2">
        <button type="submit" className="px-4 py-2 rounded-xl bg-[var(--accent)] text-[var(--text-primary)] font-medium hover:opacity-90">
          Save
        </button>
        <button type="button" onClick={onCancel} className="px-4 py-2 rounded-xl border border-[var(--border)] text-[var(--text-primary)] hover:bg-[var(--border-light)]">
          Cancel
        </button>
      </div>
    </form>
  )
}

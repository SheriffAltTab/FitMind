import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LineChart,
  Line,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts'
import { Play, ChevronLeft, Pause, CheckCircle, Check } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { getToday } from '../lib/storage'
import { getSessions } from '../lib/adminStorage'
import { apiGetSessions } from '../lib/api'
import type { MindfulnessSession } from '../lib/mentalHealth'
import { MINDFULNESS_FOR_FULL } from '../lib/types'

function getLast7Days(): { date: string; dayLabel: string }[] {
  const out: { date: string; dayLabel: string }[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    out.push({
      date: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`,
      dayLabel: d.toLocaleDateString('en-US', { weekday: 'short' }),
    })
  }
  return out
}

export function MentalHealthPage() {
  const { appData, updateAppData, recordMindfulnessSession, addXpFromProgress } = useAuth()
  const [selectedSession, setSelectedSession] = useState<MindfulnessSession | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [positionSeconds, setPositionSeconds] = useState(0)
  const [sleepHoursToday, setSleepHoursToday] = useState('')
  const [sessionsFromApi, setSessionsFromApi] = useState<MindfulnessSession[] | null>(null)

  useEffect(() => {
    apiGetSessions().then((r) => setSessionsFromApi(r.list ?? []))
  }, [])

  const today = getToday()
  const last7 = getLast7Days()

  const sleepChartData = React.useMemo(() => {
    return last7.map(({ date, dayLabel }) => {
      const entry = appData?.sleepLog.find((s) => s.date === date)
      const hours = date === today && sleepHoursToday !== '' ? parseFloat(sleepHoursToday) || 0 : (entry?.hours ?? 0)
      return { day: dayLabel, fullDate: date, hours: hours || 0 }
    })
  }, [last7, appData?.sleepLog, today, sleepHoursToday])

  useEffect(() => {
    const entry = appData?.sleepLog.find((s) => s.date === today)
    if (entry) setSleepHoursToday(String(entry.hours))
  }, [today, appData?.sleepLog])

  const saveSleepToday = () => {
    const h = parseFloat(sleepHoursToday)
    if (isNaN(h) || h < 0 || h > 24) return
    updateAppData((prev) => {
      const rest = prev.sleepLog.filter((s) => s.date !== today)
      return { ...prev, sleepLog: [...rest, { date: today, hours: h }] }
    })
  }

  const durationSeconds = selectedSession ? selectedSession.durationMinutes * 60 : 0
  const progress = selectedSession
    ? appData?.mindfulnessProgress?.[selectedSession.id] ?? { percent: 0, positionSeconds: 0, durationSeconds }
    : null
  useEffect(() => {
    if (selectedSession && progress) setPositionSeconds(progress.positionSeconds)
  }, [selectedSession?.id])

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null
    if (isPlaying && selectedSession) {
      interval = setInterval(() => {
        setPositionSeconds((prev) => {
          const next = prev + 1
          if (next >= durationSeconds && interval) clearInterval(interval)
          return Math.min(next, durationSeconds)
        })
      }, 1000)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isPlaying, selectedSession?.id, durationSeconds])

  useEffect(() => {
    if (!selectedSession || !appData) return
    const percent = durationSeconds > 0 ? Math.min(100, (positionSeconds / durationSeconds) * 100) : 0
    updateAppData((prev) => ({
      ...prev,
      mindfulnessProgress: {
        ...prev.mindfulnessProgress,
        [selectedSession.id]: {
          percent,
          positionSeconds,
          durationSeconds,
        },
      },
    }))
  }, [positionSeconds, selectedSession?.id, durationSeconds])

  const handleFinishSession = () => {
    if (selectedSession) {
      updateAppData((prev) => ({
        ...prev,
        mindfulnessProgress: {
          ...prev.mindfulnessProgress,
          [selectedSession.id]: {
            percent: 100,
            positionSeconds: durationSeconds,
            durationSeconds,
          },
        },
      }))
      recordMindfulnessSession()
      const mindfulnessPercent = Math.min(100, (((appData?.mindfulnessCompletedToday ?? 0) + 1) / MINDFULNESS_FOR_FULL) * 100)
      addXpFromProgress(0, mindfulnessPercent, 0)
    }
    setSelectedSession(null)
    setIsPlaying(false)
  }

  const avgSleep =
    sleepChartData.filter((d) => d.hours > 0).length > 0
      ? (sleepChartData.reduce((a, d) => a + d.hours, 0) / sleepChartData.filter((d) => d.hours > 0).length).toFixed(1)
      : '0'

  const getProgressForSession = (s: MindfulnessSession) => appData?.mindfulnessProgress?.[s.id]?.percent ?? 0
  const getPositionForSession = (s: MindfulnessSession) => appData?.mindfulnessProgress?.[s.id]?.positionSeconds ?? 0

  const sessions = (sessionsFromApi?.length ? sessionsFromApi : getSessions()) ?? []

  return (
    <div className="space-y-8 pb-8">
      <AnimatePresence mode="wait">
        {selectedSession ? (
          <motion.div
            key="detail"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <button
              onClick={() => setSelectedSession(null)}
              className="flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
              Back to Sessions
            </button>

            <div className="bg-[var(--bg-card)] rounded-2xl p-8 border border-[var(--border)] shadow-sm">
              <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
                <div
                  className={`w-32 h-32 rounded-2xl flex items-center justify-center flex-shrink-0 ${selectedSession.color}`}
                >
                  <selectedSession.icon className="w-12 h-12" />
                </div>

                <div className="flex-1 text-center md:text-left space-y-4 w-full">
                  <div>
                    <span className="text-sm font-bold text-[var(--accent)] uppercase tracking-wider">
                      {selectedSession.type}
                    </span>
                    <h1 className="text-3xl font-bold text-[var(--text-primary)] mt-1">{selectedSession.title}</h1>
                    <p className="text-[var(--text-secondary)] mt-2">{selectedSession.description}</p>
                    {selectedSession.audioUrl && (
                      <div className="mt-4 rounded-xl overflow-hidden border border-[var(--border)] bg-[var(--bg-primary)] p-2">
                        <audio src={selectedSession.audioUrl} controls className="w-full" />
                      </div>
                    )}
                  </div>

                  <div className="bg-[var(--bg-primary)] rounded-xl p-6 w-full">
                    <div className="flex items-center justify-center gap-1 h-12 mb-6">
                      {Array.from({ length: 20 }).map((_, i) => (
                        <motion.div
                          key={i}
                          animate={{ height: isPlaying ? [10, 30, 15, 40, 20][i % 5] : 10 }}
                          transition={{ repeat: Infinity, duration: 1, delay: i * 0.1 }}
                          className="w-1.5 bg-[var(--accent)] rounded-full"
                          style={{ opacity: positionSeconds / durationSeconds > i / 20 ? 1 : 0.3 }}
                        />
                      ))}
                    </div>

                    <div className="flex items-center gap-4">
                      <span className="text-xs font-medium text-[var(--text-secondary)]">
                        {Math.floor(positionSeconds / 60)}:{(positionSeconds % 60).toString().padStart(2, '0')}
                      </span>
                      <div className="flex-1 h-1.5 bg-[var(--border)] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[var(--accent)] transition-all"
                          style={{ width: `${(positionSeconds / durationSeconds) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium text-[var(--text-secondary)]">
                        {selectedSession.duration}
                      </span>
                    </div>

                    <div className="flex justify-center gap-4 mt-6">
                      <button
                        onClick={() => setIsPlaying(!isPlaying)}
                        className="w-14 h-14 rounded-full bg-[var(--text-primary)] text-[var(--bg-card)] flex items-center justify-center hover:scale-105 transition-transform"
                      >
                        {isPlaying ? (
                          <Pause className="w-6 h-6" fill="currentColor" />
                        ) : (
                          <Play className="w-6 h-6 ml-1" fill="currentColor" />
                        )}
                      </button>
                      <button
                        onClick={handleFinishSession}
                        className="px-6 py-3 rounded-xl border border-[var(--border)] text-[var(--text-primary)] font-medium hover:bg-[var(--bg-card)] transition-colors flex items-center gap-2"
                      >
                        <CheckCircle className="w-5 h-5" />
                        Complete Session
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12 pt-8 border-t border-[var(--border)]">
                <div>
                  <h3 className="font-bold text-[var(--text-primary)] mb-4">Benefits</h3>
                  <ul className="space-y-3">
                    {selectedSession.benefits.map((benefit, i) => (
                      <li key={i} className="flex items-center gap-3 text-[var(--text-secondary)]">
                        <CheckCircle className="w-5 h-5 text-[var(--accent)]" />
                        {benefit}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="font-bold text-[var(--text-primary)] mb-4">Instructions</h3>
                  <div className="space-y-4">
                    {selectedSession.instructions.map((step, i) => (
                      <div key={i} className="flex gap-4">
                        <div className="w-6 h-6 rounded-full bg-[var(--bg-primary)] text-[var(--text-secondary)] flex items-center justify-center text-xs font-bold flex-shrink-0">
                          {i + 1}
                        </div>
                        <p className="text-[var(--text-secondary)] text-sm pt-0.5">{step}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-8">
            <div>
              <h1 className="text-3xl font-bold text-[var(--text-primary)] tracking-tight">Mental Health</h1>
              <p className="text-[var(--text-secondary)] mt-1">Track your mental wellness</p>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="bg-[var(--bg-card)] p-6 rounded-xl shadow-sm border border-[var(--border)]"
            >
              <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
                <h3 className="text-lg font-bold text-[var(--text-primary)]">Sleep Quality</h3>
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-[var(--text-secondary)]">Hours slept today:</label>
                    <input
                      type="number"
                      min="0"
                      max="24"
                      step="0.5"
                      value={sleepHoursToday}
                      onChange={(e) => setSleepHoursToday(e.target.value)}
                      onBlur={saveSleepToday}
                      className="w-20 px-2 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
                    />
                    <button
                      type="button"
                      onClick={saveSleepToday}
                      className="px-3 py-1.5 rounded-lg bg-[var(--accent)] text-[var(--text-primary)] text-sm font-medium hover:opacity-90"
                    >
                      Save
                    </button>
                  </div>
                  <div className="text-sm font-medium text-[var(--text-secondary)]">
                    Avg: <span className="text-[var(--text-primary)] font-bold">{avgSleep} hrs</span>
                  </div>
                </div>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={sleepChartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                    <XAxis
                      dataKey="day"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
                      dy={10}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
                      domain={[0, 12]}
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: '8px',
                        border: 'none',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                        backgroundColor: 'var(--bg-card)',
                        color: 'var(--text-primary)',
                      }}
                      formatter={(value: number) => [`${value} hrs`, 'Sleep']}
                      labelFormatter={(_, payload) => payload[0]?.payload?.fullDate}
                    />
                    <Line
                      type="monotone"
                      dataKey="hours"
                      stroke="var(--accent)"
                      strokeWidth={3}
                      dot={{ r: 4, fill: 'var(--accent)', strokeWidth: 2, stroke: 'var(--bg-card)' }}
                      activeDot={{ r: 6, fill: 'var(--text-primary)' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            <div>
              <h3 className="text-xl font-bold text-[var(--text-primary)] mb-4">Meditation Sessions</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {sessions.map((session, index) => {
                  const progressPercent = getProgressForSession(session)
                  const posSec = getPositionForSession(session)
                  const isCompleted = (appData?.mindfulnessProgress?.[session.id]?.percent ?? 0) >= 100
                  return (
                    <motion.div
                      key={session.id}
                      onClick={() => setSelectedSession(session)}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 + index * 0.05 }}
                      whileHover={{ scale: 1.02 }}
                      className="bg-[var(--bg-card)] p-6 rounded-xl shadow-sm border border-[var(--border)] flex flex-col group cursor-pointer"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${session.color}`}>
                          <session.icon className="w-6 h-6" />
                        </div>
                        <div className="flex items-center gap-2">
                          {isCompleted && (
                            <span className="bg-green-500/90 text-white text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                              <Check className="w-3 h-3" />
                              Completed
                            </span>
                          )}
                          <div className="px-2.5 py-1 rounded-full bg-[var(--bg-primary)] text-xs font-medium text-[var(--text-secondary)] border border-[var(--border)]">
                            {session.duration}
                          </div>
                        </div>
                      </div>

                      <h4 className="text-lg font-bold text-[var(--text-primary)] mb-1">{session.title}</h4>
                      <p className="text-sm text-[var(--text-secondary)] mb-4">{session.type}</p>

                      {!isCompleted && progressPercent > 0 && progressPercent < 100 && (
                        <div className="mb-4">
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-[var(--text-secondary)]">Progress</span>
                            <span className="font-medium text-[var(--text-primary)]">
                              {Math.round(progressPercent)}% • {Math.floor(posSec / 60)}:
                              {(posSec % 60).toString().padStart(2, '0')}
                            </span>
                          </div>
                          <div className="h-1.5 w-full bg-[var(--bg-primary)] rounded-full overflow-hidden">
                            <div
                              className="h-full bg-[var(--accent)] rounded-full"
                              style={{ width: `${progressPercent}%` }}
                            />
                          </div>
                        </div>
                      )}

                      <div className="mt-auto flex items-center justify-between pt-4 border-t border-[var(--border)]">
                        <span className="text-xs text-[var(--text-secondary)]">Tap to open</span>
                        <button className="w-8 h-8 rounded-full bg-[var(--bg-primary)] group-hover:bg-[var(--accent)] flex items-center justify-center transition-colors">
                          <Play className="w-3.5 h-3.5 text-[var(--text-primary)] ml-0.5" />
                        </button>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

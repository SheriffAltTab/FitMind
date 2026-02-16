import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, Clock, Flame, BarChart, ChevronLeft, Check, Timer } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { getToday } from '../lib/storage'
import { getWorkouts } from '../lib/adminStorage'
import { apiGetWorkouts } from '../lib/api'
import { categories, type WorkoutItem } from '../lib/workouts'

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function FitnessPage() {
  const { appData, updateAppData, recordWorkoutDay, addXpFromProgress } = useAuth()
  const today = getToday()
  const [activeCategory, setActiveCategory] = useState('All')
  const [selectedWorkout, setSelectedWorkout] = useState<WorkoutItem | null>(null)
  const [isTimerRunning, setIsTimerRunning] = useState(false)
  const [positionSeconds, setPositionSeconds] = useState(0)
  const [completedThisSession, setCompletedThisSession] = useState(false)
  const [showRepeatConfirm, setShowRepeatConfirm] = useState(false)
  const [workoutsFromApi, setWorkoutsFromApi] = useState<WorkoutItem[] | null>(null)
  const hasAutoFinished = useRef(false)

  useEffect(() => {
    apiGetWorkouts().then((r) => setWorkoutsFromApi(r.list ?? []))
  }, [])

  const progress = selectedWorkout
    ? appData?.exerciseProgress?.[selectedWorkout.id] ?? { percent: 0, positionSeconds: 0, durationSeconds: selectedWorkout.durationMinutes * 60 }
    : null
  const durationSeconds = selectedWorkout ? selectedWorkout.durationMinutes * 60 : 0
  const completedToday = selectedWorkout ? (appData?.workoutsByDay?.[today] ?? []).includes(selectedWorkout.title) : false
  const isFinished = completedThisSession || (completedToday && positionSeconds >= durationSeconds && durationSeconds > 0)

  useEffect(() => {
    if (!selectedWorkout) return
    const dur = selectedWorkout.durationMinutes * 60
    const alreadyCompletedToday = (appData?.workoutsByDay?.[today] ?? []).includes(selectedWorkout.title)
    if (alreadyCompletedToday) {
      setPositionSeconds(dur)
      setCompletedThisSession(true)
    } else {
      setPositionSeconds(progress?.positionSeconds ?? 0)
      setCompletedThisSession(false)
    }
    setShowRepeatConfirm(false)
    hasAutoFinished.current = false
  }, [selectedWorkout?.id, selectedWorkout?.title, selectedWorkout?.durationMinutes, today, appData?.workoutsByDay])

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null
    if (isTimerRunning && selectedWorkout && !isFinished) {
      interval = setInterval(() => {
        setPositionSeconds((prev) => {
          const next = prev + 1
          if (next >= durationSeconds) {
            if (interval) clearInterval(interval)
            return durationSeconds
          }
          return next
        })
      }, 1000)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isTimerRunning, selectedWorkout?.id, durationSeconds, isFinished])

  useEffect(() => {
    if (!selectedWorkout || !appData || isFinished) return
    const percent = durationSeconds > 0 ? Math.min(100, (positionSeconds / durationSeconds) * 100) : 0
    updateAppData((prev) => ({
      ...prev,
      exerciseProgress: {
        ...prev.exerciseProgress,
        [selectedWorkout.id]: {
          percent,
          positionSeconds,
          durationSeconds,
        },
      },
    }))
  }, [positionSeconds, selectedWorkout?.id, durationSeconds, isFinished])

  useEffect(() => {
    if (!selectedWorkout || hasAutoFinished.current || durationSeconds === 0) return
    if (positionSeconds >= durationSeconds && isTimerRunning) {
      hasAutoFinished.current = true
      recordWorkoutDay(selectedWorkout.title)
      updateAppData((prev) => ({
        ...prev,
        exerciseProgress: {
          ...prev.exerciseProgress,
          [selectedWorkout.id]: {
            percent: 100,
            positionSeconds: durationSeconds,
            durationSeconds,
          },
        },
      }))
      const workoutsPercent = Math.min(100, (((appData?.workoutsCompletedToday ?? 0) + 1) / 3) * 100)
      addXpFromProgress(workoutsPercent, 0, 0)
      setCompletedThisSession(true)
      setIsTimerRunning(false)
      setPositionSeconds(durationSeconds)
    }
  }, [positionSeconds, durationSeconds, isTimerRunning, selectedWorkout, appData?.workoutsCompletedToday, recordWorkoutDay, updateAppData, addXpFromProgress])

  function completeWorkout() {
    if (!selectedWorkout) return
    recordWorkoutDay(selectedWorkout.title)
    updateAppData((prev) => ({
      ...prev,
      exerciseProgress: {
        ...prev.exerciseProgress,
        [selectedWorkout.id]: {
          percent: 100,
          positionSeconds: durationSeconds,
          durationSeconds,
        },
      },
    }))
    const workoutsPercent = Math.min(100, (((appData?.workoutsCompletedToday ?? 0) + 1) / 3) * 100)
    addXpFromProgress(workoutsPercent, 0, 0)
    setCompletedThisSession(true)
    setIsTimerRunning(false)
    setPositionSeconds(durationSeconds)
  }

  const handleStartWorkout = () => {
    if (completedToday && !completedThisSession && positionSeconds === 0) {
      setShowRepeatConfirm(true)
      return
    }
    setIsTimerRunning(!isTimerRunning)
  }

  const handleFinishWorkout = () => {
    if (isFinished) return
    completeWorkout()
  }

  const handleConfirmRepeat = (repeat: boolean) => {
    setShowRepeatConfirm(false)
    if (repeat && selectedWorkout) {
      setCompletedThisSession(false)
      setPositionSeconds(0)
      hasAutoFinished.current = false
      setIsTimerRunning(true)
    }
  }

  const getProgressForWorkout = (w: WorkoutItem) => appData?.exerciseProgress?.[w.id]?.percent ?? 0
  const getPositionForWorkout = (w: WorkoutItem) => appData?.exerciseProgress?.[w.id]?.positionSeconds ?? 0

  const workouts = (workoutsFromApi?.length ? workoutsFromApi : getWorkouts()) ?? []
  const filteredWorkouts = activeCategory === 'All' ? workouts : workouts.filter((w) => w.category === activeCategory)

  return (
    <div className="space-y-8 pb-8 relative">
      <AnimatePresence mode="wait">
        {selectedWorkout ? (
          <motion.div
            key="detail"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <button
              onClick={() => {
                setIsTimerRunning(false)
                setSelectedWorkout(null)
              }}
              className="flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
              Back to Library
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div
                  className={`aspect-video w-full rounded-2xl bg-gradient-to-br ${selectedWorkout.imageGradient} relative flex flex-col justify-end shadow-lg overflow-hidden`}
                >
                  <div className="absolute inset-0 bg-black/20 rounded-2xl" />
                  {!isFinished && (
                    <button
                      onClick={handleStartWorkout}
                      className="absolute inset-0 z-10 flex items-center justify-center cursor-pointer"
                    >
                      <div className="w-20 h-20 rounded-full bg-white/30 backdrop-blur-md flex items-center justify-center hover:scale-110 transition-transform">
                        <Play
                          className={`w-8 h-8 text-white ${isTimerRunning ? 'hidden' : 'block ml-1'}`}
                          fill="white"
                        />
                        <Timer className={`w-8 h-8 text-white ${isTimerRunning ? 'block' : 'hidden'}`} />
                      </div>
                    </button>
                  )}
                  <div className="relative z-10 p-4 bg-gradient-to-t from-black/60 to-transparent">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-white text-sm font-medium tabular-nums">
                        {formatDuration(positionSeconds)} / {formatDuration(durationSeconds)}
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-white/30 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-white/90 rounded-full transition-all duration-300"
                        style={{ width: `${durationSeconds > 0 ? (positionSeconds / durationSeconds) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                </div>
                {selectedWorkout.videoUrl && (
                  <div className="rounded-2xl overflow-hidden border border-[var(--border)] bg-black">
                    {selectedWorkout.videoUrl.includes('youtube.com') || selectedWorkout.videoUrl.includes('youtu.be') ? (
                      <iframe
                        title="Workout video"
                        src={selectedWorkout.videoUrl.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/')}
                        className="aspect-video w-full"
                        allowFullScreen
                      />
                    ) : (
                      <video src={selectedWorkout.videoUrl} controls className="aspect-video w-full" />
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-6">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="px-3 py-1 rounded-full bg-[var(--accent)]/20 text-[var(--text-primary)] text-sm font-bold">
                      {selectedWorkout.category}
                    </span>
                    <div
                      className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${selectedWorkout.difficultyColor}`}
                    >
                      <BarChart className="w-3 h-3" />
                      {selectedWorkout.difficulty}
                    </div>
                  </div>
                  <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-4">
                    {selectedWorkout.title}
                  </h1>
                  <div className="flex gap-6 text-[var(--text-secondary)]">
                    <div className="flex items-center gap-2">
                      <Clock className="w-5 h-5" />
                      <span>{selectedWorkout.duration} ({formatDuration(durationSeconds)})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Flame className="w-5 h-5" />
                      <span>{selectedWorkout.calories}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="font-bold text-[var(--text-primary)] mb-2">Description</h3>
                    <p className="text-[var(--text-secondary)] leading-relaxed">
                      {selectedWorkout.description}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h3 className="font-bold text-[var(--text-primary)] mb-2">Muscles Worked</h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedWorkout.muscles.map((m) => (
                          <span
                            key={m}
                            className="px-2 py-1 bg-[var(--bg-primary)] rounded-md text-xs text-[var(--text-secondary)] border border-[var(--border)]"
                          >
                            {m}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h3 className="font-bold text-[var(--text-primary)] mb-2">Equipment</h3>
                      <ul className="list-disc list-inside text-[var(--text-secondary)] text-sm">
                        {selectedWorkout.equipment.map((e) => (
                          <li key={e}>{e}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  {!isFinished ? (
                    <>
                      <button
                        onClick={handleStartWorkout}
                        className={`flex-1 py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${isTimerRunning ? 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400' : 'bg-[var(--accent)] text-[var(--text-primary)] hover:opacity-90'}`}
                      >
                        {isTimerRunning ? (
                          <>
                            Pause Workout <Timer className="w-5 h-5" />
                          </>
                        ) : (
                          <>
                            Start Workout <Play className="w-5 h-5" />
                          </>
                        )}
                      </button>
                      <button
                        onClick={handleFinishWorkout}
                        className="px-6 py-4 rounded-xl border border-[var(--border)] text-[var(--text-primary)] font-bold hover:bg-[var(--bg-primary)] transition-colors flex items-center gap-2"
                      >
                        Finish <Check className="w-5 h-5" />
                      </button>
                    </>
                  ) : (
                    <div className="flex gap-4 w-full">
                      <button
                        disabled
                        className="flex-1 py-4 rounded-xl font-bold flex items-center justify-center gap-2 bg-[var(--border-light)] text-[var(--text-secondary)] cursor-default"
                      >
                        Finished <Check className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => setShowRepeatConfirm(true)}
                        className="px-6 py-4 rounded-xl border border-[var(--border)] text-[var(--text-primary)] font-bold hover:bg-[var(--bg-primary)] transition-colors"
                      >
                        Do again
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {showRepeatConfirm && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-[var(--bg-card)] rounded-2xl p-6 max-w-md w-full shadow-xl border border-[var(--border)]"
                >
                  <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2">Repeat workout?</h3>
                  <p className="text-[var(--text-secondary)] mb-6">
                    You have already completed this workout today. Do you want to do it again?
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleConfirmRepeat(false)}
                      className="flex-1 py-3 rounded-xl border border-[var(--border)] text-[var(--text-primary)] font-medium hover:bg-[var(--bg-primary)]"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleConfirmRepeat(true)}
                      className="flex-1 py-3 rounded-xl bg-[var(--accent)] text-[var(--text-primary)] font-bold hover:opacity-90"
                    >
                      Yes, repeat
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-8"
          >
            <div>
              <h1 className="text-3xl font-bold text-[var(--text-primary)] tracking-tight">
                Fitness
              </h1>
              <p className="text-[var(--text-secondary)] mt-1">Your workout library</p>
            </div>

            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${activeCategory === cat ? 'bg-[var(--accent)] text-[var(--text-primary)] shadow-sm' : 'bg-[var(--bg-card)] text-[var(--text-secondary)] hover:bg-[var(--bg-primary)] border border-[var(--border)]'}`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredWorkouts.map((workout) => {
                const progressPercent = getProgressForWorkout(workout)
                const posSec = getPositionForWorkout(workout)
                const durationSec = workout.durationMinutes * 60
                const completedToday = (appData?.workoutsByDay?.[today] ?? []).includes(workout.title)
                const isCompleted = completedToday || progressPercent >= 100
                return (
                  <motion.div
                    layout
                    key={workout.id}
                    onClick={() => setSelectedWorkout(workout)}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    whileHover={{ scale: 1.02 }}
                    transition={{ duration: 0.2 }}
                    className="bg-[var(--bg-card)] rounded-xl shadow-sm border border-[var(--border)] overflow-hidden group cursor-pointer"
                  >
                    <div
                      className={`h-40 w-full bg-gradient-to-br ${workout.imageGradient} relative p-4 flex items-end justify-between`}
                    >
                      <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors" />
                      <div className="relative z-10 flex items-center gap-2">
                        {isCompleted && (
                          <span className="bg-green-500/90 text-white text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                            <Check className="w-3 h-3" />
                            Completed
                          </span>
                        )}
                        <div className="bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-[#2D3436]">
                          {workout.category}
                        </div>
                      </div>
                      <div className="relative z-10 w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0">
                        <Play className="w-4 h-4 text-[#2D3436] ml-0.5" />
                      </div>
                    </div>

                    <div className="p-5">
                      <h3 className="text-lg font-bold text-[var(--text-primary)] mb-3">
                        {workout.title}
                      </h3>

                      <div className="flex flex-wrap gap-3 mb-4">
                        <div className="flex items-center gap-1.5 text-xs font-medium text-[var(--text-secondary)]">
                          <Clock className="w-3.5 h-3.5" />
                          {workout.duration} ({formatDuration(durationSec)})
                        </div>
                        <div className="flex items-center gap-1.5 text-xs font-medium text-[var(--text-secondary)]">
                          <Flame className="w-3.5 h-3.5" />
                          {workout.calories}
                        </div>
                        <div
                          className={`flex items-center gap-1.5 text-xs font-bold px-2 py-0.5 rounded-full ${workout.difficultyColor}`}
                        >
                          <BarChart className="w-3 h-3" />
                          {workout.difficulty}
                        </div>
                      </div>

                      {!isCompleted && progressPercent > 0 && progressPercent < 100 && (
                        <div className="mt-2">
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-[var(--text-secondary)]">Progress</span>
                            <span className="font-medium text-[var(--text-primary)]">
                              {Math.round(progressPercent)}% • Stopped at {formatDuration(posSec)} / {formatDuration(durationSec)}
                            </span>
                          </div>
                          <div className="h-1.5 w-full bg-[var(--bg-primary)] rounded-full overflow-hidden">
                            <div
                              className="h-full bg-[var(--accent)] rounded-full transition-all"
                              style={{ width: `${progressPercent}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )
              })}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

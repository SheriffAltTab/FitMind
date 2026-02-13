import type { WorkoutItem } from './workouts'
import { workouts } from './workouts'
import type { MindfulnessSessionStored } from './mentalHealth'
import { sessionsStoredDefault, storedSessionToUI } from './mentalHealth'
import type { MindfulnessSession } from './mentalHealth'

const WORKOUTS_KEY = 'fitmind_workouts'
const SESSIONS_KEY = 'fitmind_mindfulness_sessions'

export function getStoredWorkouts(): WorkoutItem[] {
  try {
    const raw = localStorage.getItem(WORKOUTS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as WorkoutItem[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function saveStoredWorkouts(items: WorkoutItem[]): void {
  localStorage.setItem(WORKOUTS_KEY, JSON.stringify(items))
}

function isWorkoutValid(w: unknown): w is WorkoutItem {
  if (!w || typeof w !== 'object') return false
  const o = w as Record<string, unknown>
  return (
    typeof o.id === 'string' &&
    typeof o.title === 'string' &&
    typeof o.durationMinutes === 'number' &&
    !Number.isNaN(o.durationMinutes) &&
    typeof o.category === 'string' &&
    typeof o.duration === 'string' &&
    Array.isArray(o.muscles) &&
    Array.isArray(o.equipment)
  )
}

/** Returns workouts from storage, or default list if storage is empty or contains invalid data. Restores default library when stored data would show NaN or broken cards. */
export function getWorkouts(): WorkoutItem[] {
  const stored = getStoredWorkouts()
  const allValid = stored.length > 0 && stored.every(isWorkoutValid)
  if (allValid) return stored
  // Порожнє або пошкоджене сховище — повертаємо повний дефолтний список як раніше і перезаписуємо storage
  saveStoredWorkouts(workouts)
  return workouts
}

export function getStoredSessions(): MindfulnessSessionStored[] {
  try {
    const raw = localStorage.getItem(SESSIONS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as MindfulnessSessionStored[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function saveStoredSessions(items: MindfulnessSessionStored[]): void {
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(items))
}

/** Returns sessions from storage as UI type, or default list if storage is empty. */
export function getSessions(): MindfulnessSession[] {
  const stored = getStoredSessions()
  if (stored.length > 0) return stored.map(storedSessionToUI)
  return sessionsStoredDefault.map(storedSessionToUI)
}

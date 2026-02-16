import {
  dbGetUsers,
  dbSaveUsers,
  dbGetAppData,
  dbSaveAppData,
  dbDeleteAppData,
  dbGetStore,
  dbSetStore,
} from './db.js'

const RANK_PENALTY_PER_MISSED_DAY = 5

export function getToday() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function getDefaultAppData() {
  const today = getToday()
  return {
    streak: 0,
    lastActivityDate: null,
    rankPoints: 0,
    workoutDays: [],
    sleepLog: [],
    foodLog: [],
    exerciseProgress: {},
    mindfulnessProgress: {},
    dailyProgressResetDate: today,
    workoutsCompletedToday: 0,
    mindfulnessCompletedToday: 0,
    nutritionPercentToday: 0,
    xp: 0,
    level: 1,
    workoutsByDay: {},
    weightHistory: [],
    streakHistory: [],
    rankHistory: [],
    highestStreak: 0,
  }
}

function recomputeStreakAndRank(prev) {
  const today = getToday()
  const days = [...new Set(prev.workoutDays)].sort()
  if (days.length === 0) return { streak: 0, rankPoints: prev.rankPoints, lastActivityDate: null }
  const last = days[days.length - 1]
  const lastDate = new Date(last + 'T12:00:00')
  const todayDate = new Date(today + 'T12:00:00')
  const diffDays = Math.round((todayDate.getTime() - lastDate.getTime()) / (24 * 60 * 60 * 1000))
  let streak = 0
  let rankPoints = prev.rankPoints
  if (diffDays === 0) {
    let run = 0
    for (let i = days.length - 1; i >= 0; i--) {
      const d = new Date(days[i] + 'T12:00:00')
      const prevD = i > 0 ? new Date(days[i - 1] + 'T12:00:00') : null
      const gap = prevD ? Math.round((d.getTime() - prevD.getTime()) / (24 * 60 * 60 * 1000)) : 0
      if (gap === 1) run++
      else if (gap === 0) continue
      else break
    }
    streak = run + 1
  } else if (diffDays >= 1) {
    rankPoints = Math.max(0, prev.rankPoints - diffDays * RANK_PENALTY_PER_MISSED_DAY)
  }
  return { streak, rankPoints, lastActivityDate: last }
}

// --- Users ---
export function getUsers() {
  return dbGetUsers()
}

export function saveUsers(users) {
  dbSaveUsers(users)
}

// --- AppData per user ---
export function getAppData(userId) {
  const raw = dbGetAppData(userId)
  if (!raw) return getDefaultAppData()
  let data = JSON.parse(raw)
  const today = getToday()
  if (data.dailyProgressResetDate !== today) {
    data = {
      ...data,
      dailyProgressResetDate: today,
      workoutsCompletedToday: 0,
      mindfulnessCompletedToday: 0,
      nutritionPercentToday: 0,
    }
    saveAppData(userId, data)
  }
  const computed = recomputeStreakAndRank(data)
  const highestStreak = Math.max(data.highestStreak ?? 0, computed.streak)
  data = { ...data, ...computed, highestStreak }
  return data
}

export function saveAppData(userId, data) {
  dbSaveAppData(userId, JSON.stringify(data))
}

export function getRankPointsForUser(userId) {
  const raw = dbGetAppData(userId)
  if (!raw) return 0
  try {
    const data = JSON.parse(raw)
    return typeof data.rankPoints === 'number' ? data.rankPoints : 0
  } catch {
    return 0
  }
}

export function deleteUserData(userId) {
  dbDeleteAppData(userId)
}

// --- Workouts & Sessions (admin) ---
export function getWorkouts() {
  const raw = dbGetStore('workouts')
  if (!raw) return []
  try {
    const arr = JSON.parse(raw)
    return Array.isArray(arr) ? arr : []
  } catch {
    return []
  }
}

export function saveWorkouts(items) {
  dbSetStore('workouts', JSON.stringify(items))
}

export function getSessions() {
  const raw = dbGetStore('sessions')
  if (!raw) return []
  try {
    const arr = JSON.parse(raw)
    return Array.isArray(arr) ? arr : []
  } catch {
    return []
  }
}

export function saveSessions(items) {
  dbSetStore('sessions', JSON.stringify(items))
}

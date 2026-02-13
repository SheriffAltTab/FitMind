import type { User, AppData, FoodEntry, UserRole } from './types'
import { RANK_PENALTY_PER_MISSED_DAY, STREAK_POINTS_PER_DAY } from './types'

const USERS_KEY = 'fitmind_users'
const CURRENT_USER_ID_KEY = 'fitmind_current_user_id'

export function getToday(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function getDefaultAppData(): AppData {
  return {
    streak: 0,
    lastActivityDate: null,
    rankPoints: 0,
    workoutDays: [],
    sleepLog: [],
    foodLog: [],
    exerciseProgress: {},
    mindfulnessProgress: {},
    dailyProgressResetDate: getToday(),
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

export function recomputeStreakAndRank(prev: AppData): Pick<AppData, 'streak' | 'rankPoints' | 'lastActivityDate'> {
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

export function getUsers(): User[] {
  try {
    const raw = localStorage.getItem(USERS_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function saveUsers(users: User[]): void {
  localStorage.setItem(USERS_KEY, JSON.stringify(users))
}

export function getCurrentUserId(): string | null {
  return localStorage.getItem(CURRENT_USER_ID_KEY)
}

export function setCurrentUserId(id: string | null): void {
  if (id) localStorage.setItem(CURRENT_USER_ID_KEY, id)
  else localStorage.removeItem(CURRENT_USER_ID_KEY)
}

export function getAppData(userId: string): AppData {
  try {
    const raw = localStorage.getItem(`fitmind_data_${userId}`)
    let data: AppData = raw ? JSON.parse(raw) : getDefaultAppData()
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
    const { streak, rankPoints, lastActivityDate } = recomputeStreakAndRank(data)
    const highestStreak = Math.max(data.highestStreak ?? 0, streak)
    data = { ...data, streak, rankPoints, lastActivityDate, highestStreak }
    return data
  } catch {
    return getDefaultAppData()
  }
}

export function saveAppData(userId: string, data: AppData): void {
  localStorage.setItem(`fitmind_data_${userId}`, JSON.stringify(data))
}

/** Read-only: get stored rankPoints for a user (for cross-user comparison; uses saved value, no penalty). */
export function getRankPointsForUser(userId: string): number {
  try {
    const raw = localStorage.getItem(`fitmind_data_${userId}`)
    if (!raw) return 0
    const data = JSON.parse(raw) as AppData
    return typeof data.rankPoints === 'number' ? data.rankPoints : 0
  } catch {
    return 0
  }
}

/** Percentage of all users who have more rank points than the given value. Uses unique user ids. */
export function getTopPercentFromAllUsers(currentUserRankPoints: number): number {
  const users = getUsers()
  const uniqueById = Array.from(new Map(users.map((u) => [u.id, u])).values())
  if (uniqueById.length === 0) return 0
  const allPts = Array.from(uniqueById).map((u) => getRankPointsForUser(u.id))
  const countHigher = allPts.filter((p) => p > currentUserRankPoints).length
  return Math.round((countHigher / allPts.length) * 100)
}

export function getTodayFoodEntries(userId: string): FoodEntry[] {
  const data = getAppData(userId)
  const today = getToday()
  const dayLog = data.foodLog.find((f) => f.date === today)
  return dayLog ? dayLog.entries : []
}

export function appendFoodEntry(userId: string, entry: Omit<FoodEntry, 'id'>): void {
  const data = getAppData(userId)
  const today = getToday()
  const newEntry: FoodEntry = { ...entry, id: String(Date.now()) }
  const existing = data.foodLog.find((f) => f.date === today)
  if (existing) existing.entries.push(newEntry)
  else data.foodLog.push({ date: today, entries: [newEntry] })
  saveAppData(userId, data)
}

export function getAllUserData(user: User): Record<string, unknown> {
  const appData = getAppData(user.id)
  return {
    user: { id: user.id, email: user.email, name: user.name, height: user.height, weight: user.weight, age: user.age, dailyCalorieGoal: user.dailyCalorieGoal, theme: user.theme, notifications: user.notifications, createdAt: user.createdAt },
    appData,
  }
}

export function deleteUser(userId: string): void {
  const users = getUsers().filter((u) => u.id !== userId)
  saveUsers(users)
  localStorage.removeItem(`fitmind_data_${userId}`)
  setCurrentUserId(null)
}

export function setUserRole(userId: string, role: UserRole): void {
  const users = getUsers().map((u) => (u.id === userId ? { ...u, role } : u))
  saveUsers(users)
}

export function setUserBanned(userId: string, banned: boolean): void {
  const users = getUsers().map((u) => (u.id === userId ? { ...u, banned } : u))
  saveUsers(users)
}

export type UserRole = 'user' | 'admin'

export interface User {
  id: string
  email: string
  password: string
  name: string
  height: number
  weight: number
  age: number
  dailyCalorieGoal: number
  theme: 'light' | 'dark'
  notifications: NotificationPrefs
  createdAt: string
  lastPasswordChange?: string
  role?: UserRole
  banned?: boolean
}

export interface NotificationPrefs {
  workouts: boolean
  mindfulness: boolean
  nutrition: boolean
  reminders: boolean
}

export interface AppData {
  streak: number
  lastActivityDate: string | null
  rankPoints: number
  workoutDays: string[]
  sleepLog: { date: string; hours: number }[]
  foodLog: { date: string; entries: FoodEntry[] }[]
  exerciseProgress: Record<string, { percent: number; positionSeconds: number; durationSeconds: number }>
  mindfulnessProgress: Record<string, { percent: number; positionSeconds: number; durationSeconds: number }>
  dailyProgressResetDate: string
  workoutsCompletedToday: number
  mindfulnessCompletedToday: number
  nutritionPercentToday: number
  xp: number
  level: number
  workoutsByDay: Record<string, string[]>
  weightHistory: { date: string; weight: number }[]
  streakHistory: { date: string; value: number }[]
  rankHistory: { date: string; value: number }[]
  highestStreak: number
}

export interface FoodEntry {
  id: string
  time: string
  meal: string
  food: string
  calories: number
  protein: string
  carbs: string
  fats: string
}

export const RANK_NAMES = ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond'] as const
export const XP_PER_LEVEL = 100
export const RANK_THRESHOLD = 50
export const STREAK_POINTS_PER_DAY = 1
export const RANK_PENALTY_PER_MISSED_DAY = 5
export const XP_PER_10_PERCENT = 5
export const WORKOUTS_FOR_FULL = 3
export const MINDFULNESS_FOR_FULL = 3

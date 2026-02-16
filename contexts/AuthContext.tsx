import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import type { User, AppData } from '../lib/types'
import { getToday } from '../lib/storage'
import {
  getToken,
  setToken,
  clearToken,
  apiLogin,
  apiSignup,
  apiGetMe,
  apiGetAppData,
  apiPutAppData,
  apiPatchUser,
  apiDeleteAccount,
} from '../lib/api'
import {
  RANK_THRESHOLD,
  RANK_PENALTY_PER_MISSED_DAY,
  STREAK_POINTS_PER_DAY,
  XP_PER_10_PERCENT,
  WORKOUTS_FOR_FULL,
  MINDFULNESS_FOR_FULL,
  RANK_NAMES,
} from '../lib/types'

type AuthResult = { success: boolean; error?: string }

type AuthContextType = {
  user: User | null
  appData: AppData | null
  isReady: boolean
  isAdmin: boolean
  login: (email: string, password: string) => AuthResult | Promise<AuthResult>
  signup: (data: { email: string; password: string; name: string; height: number; weight: number; age: number }) => AuthResult | Promise<AuthResult>
  logout: () => void
  deleteAccount: () => void
  updateUser: (partial: Partial<User>) => void
  updateAppData: (updater: (prev: AppData) => AppData) => void
  recordWorkoutDay: (workoutTitle?: string) => void
  recordMindfulnessSession: () => void
  recordNutritionPercent: (percent: number) => void
  addXpFromProgress: (workoutsPercent: number, mindfulnessPercent: number, nutritionPercent: number) => void
  getRankName: (rankPoints: number) => string
}

const defaultAppData: AppData = {
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

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [appData, setAppDataState] = useState<AppData | null>(null)
  const [isReady, setIsReady] = useState(false)

  const loadSession = useCallback(async () => {
    const token = getToken()
    if (!token) {
      setUser(null)
      setAppDataState(null)
      setIsReady(true)
      return
    }
    const { user: me } = await apiGetMe()
    if (!me) {
      clearToken()
      setUser(null)
      setAppDataState(null)
      setIsReady(true)
      return
    }
    setUser(me)
    const { data } = await apiGetAppData()
    setAppDataState(data ?? defaultAppData)
    setIsReady(true)
  }, [])

  useEffect(() => {
    loadSession()
  }, [loadSession])

  const updateAppData = useCallback(
    (updater: (prev: AppData) => AppData) => {
      if (!user) return
      setAppDataState((prev) => {
        const next = updater(prev ?? defaultAppData)
        apiPutAppData(next).then((r) => {
          if (r.data) setAppDataState(r.data)
        })
        return next
      })
    },
    [user]
  )

  useEffect(() => {
    if (!user || !appData) return
    if ((appData.weightHistory ?? []).length > 0) return
    updateAppData((prev) => ({ ...prev, weightHistory: [{ date: getToday(), weight: user.weight }] }))
  }, [user?.id, user?.weight, appData, updateAppData])

  const login = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    const result = await apiLogin(email, password)
    if (!result.success) return result
    if (result.token) setToken(result.token)
    if (result.user) setUser(result.user)
    const { data } = await apiGetAppData()
    setAppDataState(data ?? defaultAppData)
    return { success: true }
  }, [])

  const signup = useCallback(
    async (data: { email: string; password: string; name: string; height: number; weight: number; age: number }): Promise<AuthResult> => {
      const result = await apiSignup(data)
      if (!result.success) return result
      if (result.token) setToken(result.token)
      if (result.user) setUser(result.user)
      const { data: app } = await apiGetAppData()
      setAppDataState(app ?? defaultAppData)
      return { success: true }
    },
    []
  )

  const logout = useCallback(() => {
    clearToken()
    setUser(null)
    setAppDataState(null)
  }, [])

  const deleteAccount = useCallback(async () => {
    if (!user) return
    await apiDeleteAccount()
    clearToken()
    setUser(null)
    setAppDataState(null)
  }, [user])

  const updateUser = useCallback(
    (partial: Partial<User>) => {
      apiPatchUser(partial).then((r) => {
        if (r.user) setUser(r.user)
      })
      if (partial.weight != null && typeof partial.weight === 'number') {
        updateAppData((prev) => {
          const list = [...(prev.weightHistory ?? []), { date: getToday(), weight: partial.weight as number }]
          return { ...prev, weightHistory: list.slice(-20) }
        })
      }
    },
    [updateAppData]
  )

  const recomputeStreakAndRank = useCallback(() => {
    const today = getToday()
    updateAppData((prev) => {
      const days = [...new Set(prev.workoutDays)].sort()
      if (days.length === 0) {
        const computed = { streak: 0, rankPoints: prev.rankPoints, lastActivityDate: null as string | null }
        const highestStreak = prev.highestStreak ?? 0
        const streakHistory = [...(prev.streakHistory ?? []), { date: today, value: 0 }].slice(-20)
        const rankHistory = [...(prev.rankHistory ?? []), { date: today, value: prev.rankPoints }].slice(-20)
        return { ...prev, ...computed, highestStreak, streakHistory, rankHistory }
      }
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
        rankPoints = prev.rankPoints
      } else if (diffDays >= 1) {
        rankPoints = Math.max(0, prev.rankPoints - diffDays * RANK_PENALTY_PER_MISSED_DAY)
      }
      const highestStreak = Math.max(prev.highestStreak ?? 0, streak)
      const streakHistory = [...(prev.streakHistory ?? []), { date: today, value: streak }].slice(-20)
      const rankHistory = [...(prev.rankHistory ?? []), { date: today, value: rankPoints }].slice(-20)
      return { ...prev, streak, rankPoints, lastActivityDate: last, highestStreak, streakHistory, rankHistory }
    })
  }, [updateAppData])

  const recordWorkoutDay = useCallback(
    (workoutTitle?: string) => {
      const today = getToday()
      updateAppData((prev) => {
        const isNewDay = !prev.workoutDays.includes(today)
        const workoutDays = isNewDay ? [...prev.workoutDays, today] : prev.workoutDays
        const workoutsByDay = { ...prev.workoutsByDay }
        if (!workoutsByDay[today]) workoutsByDay[today] = []
        if (workoutTitle && !workoutsByDay[today].includes(workoutTitle)) {
          workoutsByDay[today] = [...workoutsByDay[today], workoutTitle]
        }
        const rankPoints = isNewDay ? prev.rankPoints + STREAK_POINTS_PER_DAY : prev.rankPoints
        return {
          ...prev,
          workoutDays,
          lastActivityDate: today,
          rankPoints,
          workoutsCompletedToday: Math.min(prev.workoutsCompletedToday + 1, WORKOUTS_FOR_FULL),
          workoutsByDay,
        }
      })
      recomputeStreakAndRank()
    },
    [updateAppData, recomputeStreakAndRank]
  )

  const recordMindfulnessSession = useCallback(() => {
    updateAppData((prev) => ({
      ...prev,
      mindfulnessCompletedToday: Math.min(prev.mindfulnessCompletedToday + 1, MINDFULNESS_FOR_FULL),
    }))
  }, [updateAppData])

  const recordNutritionPercent = useCallback(
    (percent: number) => {
      updateAppData((prev) => {
        const newP = Math.min(100, percent)
        const oldSteps = Math.floor(prev.nutritionPercentToday / 10)
        const newSteps = Math.floor(newP / 10)
        const xpGain = Math.max(0, (newSteps - oldSteps) * XP_PER_10_PERCENT)
        let xp = prev.xp + xpGain
        let level = prev.level
        const xpNeeded = level * 100
        while (xp >= xpNeeded) {
          xp -= level * 100
          level++
        }
        return { ...prev, nutritionPercentToday: newP, xp, level }
      })
    },
    [updateAppData]
  )

  const addXpFromProgress = useCallback(
    (workoutsPercent: number, mindfulnessPercent: number, nutritionPercent: number) => {
      updateAppData((prev) => {
        const steps = Math.floor(workoutsPercent / 10) + Math.floor(mindfulnessPercent / 10) + Math.floor(nutritionPercent / 10)
        const xpGain = steps * XP_PER_10_PERCENT
        let xp = prev.xp + xpGain
        let level = prev.level
        const xpNeeded = level * 100
        while (xp >= xpNeeded) {
          xp -= level * 100
          level++
        }
        return { ...prev, xp, level }
      })
    },
    [updateAppData]
  )

  const getRankName = useCallback((rankPoints: number) => {
    const index = Math.min(Math.floor(rankPoints / RANK_THRESHOLD), RANK_NAMES.length - 1)
    return RANK_NAMES[Math.max(0, index)]
  }, [])

  const value: AuthContextType = {
    user,
    appData,
    isReady,
    isAdmin: user?.role === 'admin',
    login,
    signup,
    logout,
    deleteAccount,
    updateUser,
    updateAppData,
    recordWorkoutDay,
    recordMindfulnessSession,
    recordNutritionPercent,
    addXpFromProgress,
    getRankName,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (ctx === undefined) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

import type { User, AppData } from './types'
import type { WorkoutItem } from './workouts'
import type { MindfulnessSessionStored } from './mentalHealth'
import { storedSessionToUI } from './mentalHealth'
import type { MindfulnessSession } from './mentalHealth'

const TOKEN_KEY = 'fitmind_token'

/** У dev — localhost:3001, у продакшені — той самий хост (порожній рядок), якщо VITE_API_URL не задано. */
function getBaseUrl(): string {
  const env = import.meta.env.VITE_API_URL as string | undefined
  if (env !== undefined && env !== '') return env
  return import.meta.env.DEV ? 'http://localhost:3001' : ''
}

export function isApiEnabled(): boolean {
  return true
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY)
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown
): Promise<{ data?: T; error?: string; status: number }> {
  const base = getBaseUrl()
  const url = base ? `${base.replace(/\/$/, '')}${path}` : path
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  const token = getToken()
  if (token) headers['Authorization'] = `Bearer ${token}`
  const res = await fetch(url, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
  let data: T | undefined
  const text = await res.text()
  if (text) {
    try {
      data = JSON.parse(text) as T
    } catch {
      data = undefined
    }
  }
  const err = data && typeof data === 'object' && 'error' in data ? (data as { error: string }).error : undefined
  if (!res.ok) {
    return { error: err || res.statusText || String(res.status), status: res.status, data }
  }
  return { data: data as T, status: res.status }
}

// --- Auth ---
export async function apiLogin(email: string, password: string): Promise<{ success: boolean; user?: User; token?: string; error?: string }> {
  const res = await request<{ success: boolean; user?: User; token?: string; error?: string }>('POST', '/api/auth/login', { email, password })
  if (res.error || !res.data) return { success: false, error: res.error || 'Request failed' }
  const d = res.data
  if (!d.success) return { success: false, error: d.error }
  return { success: true, user: d.user ?? undefined, token: d.token ?? undefined }
}

export async function apiSignup(body: {
  email: string
  password: string
  name: string
  height: number
  weight: number
  age: number
}): Promise<{ success: boolean; user?: User; token?: string; error?: string }> {
  const res = await request<{ success: boolean; user?: User; token?: string; error?: string }>('POST', '/api/auth/signup', body)
  if (res.error || !res.data) return { success: false, error: res.error || 'Request failed' }
  const d = res.data
  if (!d.success) return { success: false, error: d.error }
  return { success: true, user: d.user ?? undefined, token: d.token ?? undefined }
}

export async function apiGetMe(): Promise<{ user?: User; error?: string }> {
  const res = await request<User>('GET', '/api/auth/me')
  if (res.error || res.status === 401) return { error: res.error || 'Unauthorized' }
  return { user: res.data ?? undefined }
}

// --- User ---
export async function apiPatchUser(partial: Partial<User>): Promise<{ user?: User; error?: string }> {
  const res = await request<User>('PATCH', '/api/user', partial)
  if (res.error) return { error: res.error }
  return { user: res.data ?? undefined }
}

// --- App data ---
export async function apiGetAppData(): Promise<{ data?: AppData; error?: string }> {
  const res = await request<AppData>('GET', '/api/app-data')
  if (res.error) return { error: res.error }
  return { data: res.data ?? undefined }
}

export async function apiPutAppData(data: Partial<AppData>): Promise<{ data?: AppData; error?: string }> {
  const res = await request<AppData>('PUT', '/api/app-data', data)
  if (res.error) return { error: res.error }
  return { data: res.data ?? undefined }
}

// --- Workouts & Sessions (public read) ---
export async function apiGetWorkouts(): Promise<{ list?: WorkoutItem[]; error?: string }> {
  const res = await request<WorkoutItem[]>('GET', '/api/workouts')
  if (res.error) return { error: res.error }
  return { list: Array.isArray(res.data) ? res.data : [] }
}

export async function apiGetSessions(): Promise<{ list?: MindfulnessSession[]; error?: string }> {
  const res = await request<MindfulnessSessionStored[]>('GET', '/api/sessions')
  if (res.error) return { error: res.error }
  const stored = Array.isArray(res.data) ? res.data : []
  return { list: stored.map(storedSessionToUI) }
}

/** For Admin: returns sessions in stored shape (with iconName). */
export async function apiGetSessionsStored(): Promise<{ list?: MindfulnessSessionStored[]; error?: string }> {
  const res = await request<MindfulnessSessionStored[]>('GET', '/api/sessions')
  if (res.error) return { error: res.error }
  return { list: Array.isArray(res.data) ? res.data : [] }
}

// --- Admin ---
export async function apiPutWorkouts(items: WorkoutItem[]): Promise<{ list?: WorkoutItem[]; error?: string }> {
  const res = await request<WorkoutItem[]>('PUT', '/api/workouts', items)
  if (res.error) return { error: res.error }
  return { list: res.data ?? undefined }
}

export async function apiPutSessions(items: MindfulnessSessionStored[]): Promise<{ list?: MindfulnessSessionStored[]; error?: string }> {
  const res = await request<MindfulnessSessionStored[]>('PUT', '/api/sessions', items)
  if (res.error) return { error: res.error }
  return { list: res.data ?? undefined }
}

export async function apiGetAdminUsers(): Promise<{ users?: User[]; error?: string }> {
  const res = await request<User[]>('GET', '/api/admin/users')
  if (res.error) return { error: res.error }
  return { users: Array.isArray(res.data) ? res.data : [] }
}

export async function apiPatchAdminUser(
  userId: string,
  patch: { role?: string; banned?: boolean }
): Promise<{ user?: User; error?: string }> {
  const res = await request<User>('PATCH', `/api/admin/users/${userId}`, patch)
  if (res.error) return { error: res.error }
  return { user: res.data ?? undefined }
}

export async function apiGetAdminDemographics(): Promise<{
  workoutChart?: { name: string; count: number }[]
  sessionChart?: { name: string; count: number }[]
  error?: string
}> {
  const res = await request<{ workoutChart: { name: string; count: number }[]; sessionChart: { name: string; count: number }[] }>(
    'GET',
    '/api/admin/demographics'
  )
  if (res.error) return { error: res.error }
  return {
    workoutChart: res.data?.workoutChart ?? [],
    sessionChart: res.data?.sessionChart ?? [],
  }
}

// --- Top percent (rank) ---
export async function apiGetTopPercent(): Promise<{ percent?: number; error?: string }> {
  const res = await request<number>('GET', '/api/top-percent')
  if (res.error) return { error: res.error }
  return { percent: typeof res.data === 'number' ? res.data : 0 }
}

// --- Delete account ---
export async function apiDeleteAccount(): Promise<{ error?: string }> {
  const res = await request<unknown>('DELETE', '/api/user')
  return res.error ? { error: res.error } : {}
}

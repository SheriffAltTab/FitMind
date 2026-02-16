import express from 'express'
import cors from 'cors'
import jwt from 'jsonwebtoken'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'
import { initDb } from './db.js'
import {
  getToday,
  getUsers,
  saveUsers,
  getAppData,
  saveAppData,
  getRankPointsForUser,
  deleteUserData,
  getWorkouts,
  saveWorkouts,
  getSessions,
  saveSessions,
} from './store.js'

const JWT_SECRET = process.env.JWT_SECRET || 'fitmind-dev-secret-change-in-production'
const PORT = process.env.PORT || 3001

const app = express()
app.use(cors({ origin: true, credentials: true }))
app.use(express.json())

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2)
}

const defaultNotifications = {
  workouts: true,
  mindfulness: true,
  nutrition: true,
  reminders: true,
}

function authMiddleware(req, res, next) {
  const auth = req.headers.authorization
  const token = auth?.startsWith('Bearer ') ? auth.slice(7) : null
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  try {
    const payload = jwt.verify(token, JWT_SECRET)
    req.userId = payload.userId
    req.user = getUsers().find((u) => u.id === payload.userId)
    if (!req.user) return res.status(401).json({ error: 'User not found' })
    if (req.user.banned) return res.status(403).json({ error: 'Account suspended' })
    next()
  } catch {
    return res.status(401).json({ error: 'Invalid token' })
  }
}

function adminMiddleware(req, res, next) {
  if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Admin only' })
  next()
}

// --- Auth ---
app.post('/api/auth/signup', (req, res) => {
  const { email, password, name, height, weight, age } = req.body || {}
  if (!email || !password || !name || height == null || weight == null || age == null) {
    return res.status(400).json({ error: 'Missing fields' })
  }
  const users = getUsers()
  if (users.some((u) => u.email.toLowerCase() === String(email).toLowerCase())) {
    return res.status(400).json({ success: false, error: 'An account with this email already exists' })
  }
  const isFirstUser = users.length === 0
  const newUser = {
    id: generateId(),
    email: String(email).trim(),
    password: String(password),
    name: String(name).trim(),
    height: Number(height) || 170,
    weight: Number(weight) || 70,
    age: Number(age) || 25,
    dailyCalorieGoal: 2200,
    theme: 'light',
    notifications: defaultNotifications,
    createdAt: new Date().toISOString(),
    role: isFirstUser ? 'admin' : 'user',
    banned: false,
  }
  saveUsers([...users, newUser])
  saveAppData(newUser.id, {
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
  })
  const token = jwt.sign({ userId: newUser.id }, JWT_SECRET)
  const { password: _, ...userWithoutPassword } = newUser
  return res.json({ success: true, user: userWithoutPassword, token })
})

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body || {}
  const users = getUsers()
  const u = users.find((x) => x.email.toLowerCase() === String(email).toLowerCase())
  if (!u || u.password !== password) {
    return res.status(400).json({ success: false, error: 'Invalid email or password' })
  }
  if (u.banned) {
    return res.status(403).json({ success: false, error: 'This account has been suspended.' })
  }
  const token = jwt.sign({ userId: u.id }, JWT_SECRET)
  const { password: _, ...userWithoutPassword } = u
  return res.json({ success: true, user: userWithoutPassword, token })
})

app.get('/api/auth/me', authMiddleware, (req, res) => {
  const { password: _, ...userWithoutPassword } = req.user
  res.json(userWithoutPassword)
})

// --- User update ---
app.patch('/api/user', authMiddleware, (req, res) => {
  const users = getUsers()
  const idx = users.findIndex((u) => u.id === req.userId)
  if (idx === -1) return res.status(404).json({ error: 'User not found' })
  const allowed = ['name', 'email', 'password', 'height', 'weight', 'age', 'dailyCalorieGoal', 'theme', 'notifications', 'lastPasswordChange']
  for (const key of Object.keys(req.body || {})) {
    if (allowed.includes(key)) users[idx][key] = req.body[key]
  }
  saveUsers(users)
  const { password: _, ...userWithoutPassword } = users[idx]
  res.json(userWithoutPassword)
})

// --- App data ---
app.get('/api/app-data', authMiddleware, (req, res) => {
  const data = getAppData(req.userId)
  res.json(data)
})

app.put('/api/app-data', authMiddleware, (req, res) => {
  const data = req.body
  if (!data || typeof data !== 'object') return res.status(400).json({ error: 'Invalid body' })
  saveAppData(req.userId, { ...getAppData(req.userId), ...data })
  res.json(getAppData(req.userId))
})

// --- Workouts (public read; admin write) ---
app.get('/api/workouts', (req, res) => {
  const list = getWorkouts()
  res.json(list)
})

app.put('/api/workouts', authMiddleware, adminMiddleware, (req, res) => {
  const list = req.body
  if (!Array.isArray(list)) return res.status(400).json({ error: 'Expected array' })
  saveWorkouts(list)
  res.json(getWorkouts())
})

// --- Sessions (public read; admin write) ---
app.get('/api/sessions', (req, res) => {
  res.json(getSessions())
})

app.put('/api/sessions', authMiddleware, adminMiddleware, (req, res) => {
  const list = req.body
  if (!Array.isArray(list)) return res.status(400).json({ error: 'Expected array' })
  saveSessions(list)
  res.json(getSessions())
})

// --- Admin: users ---
app.get('/api/admin/users', authMiddleware, adminMiddleware, (req, res) => {
  const users = getUsers().map(({ password: _, ...u }) => u)
  res.json(users)
})

app.patch('/api/admin/users/:id', authMiddleware, adminMiddleware, (req, res) => {
  const { id } = req.params
  const { role, banned } = req.body || {}
  const users = getUsers()
  const idx = users.findIndex((u) => u.id === id)
  if (idx === -1) return res.status(404).json({ error: 'User not found' })
  if (role !== undefined) users[idx].role = role
  if (banned !== undefined) users[idx].banned = banned
  saveUsers(users)
  const { password: _, ...u } = users[idx]
  res.json(u)
})

// --- Admin: demographics ---
app.get('/api/admin/demographics', authMiddleware, adminMiddleware, (req, res) => {
  const users = getUsers()
  const workoutCounts = {}
  const sessionCounts = {}
  for (const u of users) {
    const data = getAppData(u.id)
    for (const day of Object.keys(data.workoutsByDay || {})) {
      for (const title of data.workoutsByDay[day] || []) {
        workoutCounts[title] = (workoutCounts[title] || 0) + 1
      }
    }
    for (const [sid, prog] of Object.entries(data.mindfulnessProgress || {})) {
      if ((prog?.percent ?? 0) >= 100) sessionCounts[sid] = (sessionCounts[sid] || 0) + 1
    }
  }
  const workoutChart = Object.entries(workoutCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 15)
  const sessionChart = Object.entries(sessionCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 15)
  res.json({ workoutChart, sessionChart })
})

// --- Delete account ---
app.delete('/api/user', authMiddleware, (req, res) => {
  const users = getUsers().filter((u) => u.id !== req.userId)
  saveUsers(users)
  deleteUserData(req.userId)
  res.json({ success: true })
})

// --- Top percent (for rank card) ---
app.get('/api/top-percent', authMiddleware, (req, res) => {
  const users = getUsers()
  const unique = Array.from(new Map(users.map((u) => [u.id, u])).values())
  if (unique.length === 0) return res.json(0)
  const pts = [...unique].map((u) => getRankPointsForUser(u.id))
  const myData = getAppData(req.userId)
  const myPts = myData.rankPoints ?? 0
  const countHigher = pts.filter((p) => p > myPts).length
  const percent = Math.round((countHigher / pts.length) * 100)
  res.json(percent)
})

// Віддача зібраного фронту (для хостингу: спочатку npm run build у корені проєкту)
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const distPath = path.join(__dirname, '..', 'dist')
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath))
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'))
  })
}

initDb()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`FitMind API running at http://localhost:${PORT}`)
      if (fs.existsSync(distPath)) console.log('Serving frontend from dist/')
      console.log('Database: SQLite (backend/data/fitmind.db)')
    })
  })
  .catch((err) => {
    console.error('Database init failed:', err)
    process.exit(1)
  })

import initSqlJs from 'sql.js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DATA_DIR = path.join(__dirname, 'data')
const DB_PATH = path.join(DATA_DIR, 'fitmind.db')

let db = null
let SQL = null

export async function initDb() {
  if (db) return db
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })
  SQL = await initSqlJs()
  if (fs.existsSync(DB_PATH)) {
    const buf = fs.readFileSync(DB_PATH)
    db = new SQL.Database(buf)
  } else {
    db = new SQL.Database()
  }
  runMigrations()
  return db
}

function runMigrations() {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      height REAL NOT NULL DEFAULT 170,
      weight REAL NOT NULL DEFAULT 70,
      age INTEGER NOT NULL DEFAULT 25,
      daily_calorie_goal INTEGER NOT NULL DEFAULT 2200,
      theme TEXT NOT NULL DEFAULT 'light',
      notifications TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL,
      last_password_change TEXT,
      role TEXT NOT NULL DEFAULT 'user',
      banned INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS app_data (
      user_id TEXT PRIMARY KEY,
      data TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS store (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
  `)
  persistDb()
}

function persistDb() {
  if (!db) return
  try {
    const data = db.export()
    const buffer = Buffer.from(data)
    fs.writeFileSync(DB_PATH, buffer)
  } catch (e) {
    console.error('Failed to persist DB:', e.message)
  }
}

function getDb() {
  if (!db) throw new Error('Database not initialized. Call initDb() first.')
  return db
}

export function dbGetUsers() {
  const database = getDb()
  const res = database.exec('SELECT * FROM users')
  if (!res.length || !res[0].values.length) return []
  const cols = res[0].columns
  const rows = res[0].values
  return rows.map((row) => {
    const o = {}
    cols.forEach((c, i) => (o[c] = row[i]))
    return {
      id: o.id,
      email: o.email,
      password: o.password,
      name: o.name,
      height: o.height,
      weight: o.weight,
      age: o.age,
      dailyCalorieGoal: o.daily_calorie_goal,
      theme: o.theme,
      notifications: JSON.parse(o.notifications || '{}'),
      createdAt: o.created_at,
      lastPasswordChange: o.last_password_change ?? undefined,
      role: o.role,
      banned: Boolean(o.banned),
    }
  })
}

export function dbSaveUsers(users) {
  const database = getDb()
  const insert = database.prepare(`
    INSERT OR REPLACE INTO users (id, email, password, name, height, weight, age, daily_calorie_goal, theme, notifications, created_at, last_password_change, role, banned)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)
  const current = database.exec('SELECT id FROM users')
  const currentIds = current[0]?.values?.map((r) => r[0]) ?? []
  const newIds = new Set(users.map((u) => u.id))
  const deleteOne = database.prepare('DELETE FROM users WHERE id = ?')
  database.run('BEGIN TRANSACTION')
  try {
    for (const id of currentIds) {
      if (!newIds.has(id)) {
        deleteOne.bind([id])
        deleteOne.step()
        deleteOne.reset()
      }
    }
    deleteOne.free()
    for (const u of users) {
      insert.bind([
        u.id,
        u.email,
        u.password ?? '',
        u.name,
        u.height ?? 170,
        u.weight ?? 70,
        u.age ?? 25,
        u.dailyCalorieGoal ?? 2200,
        u.theme ?? 'light',
        JSON.stringify(u.notifications ?? {}),
        u.createdAt ?? new Date().toISOString(),
        u.lastPasswordChange ?? null,
        u.role ?? 'user',
        u.banned ? 1 : 0,
      ])
      insert.step()
      insert.reset()
    }
    insert.free()
    database.run('COMMIT')
  } catch (e) {
    database.run('ROLLBACK')
    throw e
  }
  persistDb()
}

export function dbGetAppData(userId) {
  const database = getDb()
  const stmt = database.prepare('SELECT data FROM app_data WHERE user_id = ?')
  stmt.bind([userId])
  const row = stmt.step() ? stmt.getAsObject() : null
  stmt.free()
  return row ? row.data : null
}

export function dbSaveAppData(userId, dataJson) {
  const database = getDb()
  const stmt = database.prepare('INSERT OR REPLACE INTO app_data (user_id, data) VALUES (?, ?)')
  stmt.bind([userId, dataJson])
  stmt.step()
  stmt.free()
  persistDb()
}

export function dbDeleteAppData(userId) {
  const database = getDb()
  const stmt = database.prepare('DELETE FROM app_data WHERE user_id = ?')
  stmt.bind([userId])
  stmt.step()
  stmt.free()
  persistDb()
}

export function dbGetStore(key) {
  const database = getDb()
  const stmt = database.prepare('SELECT value FROM store WHERE key = ?')
  stmt.bind([key])
  const row = stmt.step() ? stmt.getAsObject() : null
  stmt.free()
  return row ? row.value : null
}

export function dbSetStore(key, value) {
  const database = getDb()
  const stmt = database.prepare('INSERT OR REPLACE INTO store (key, value) VALUES (?, ?)')
  stmt.bind([key, value])
  stmt.step()
  stmt.free()
  persistDb()
}

export function dbClose() {
  if (db) {
    persistDb()
    db.close()
    db = null
  }
}

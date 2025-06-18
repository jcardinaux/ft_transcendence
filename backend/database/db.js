import Database from 'better-sqlite3'
import path from 'path'

const db = new Database(path.resolve('database/data.db'))

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    avatar TEXT,
    totp_secret TEXT,
    twofa_enabled BOOLEAN DEFAULT 0
  )
`)

export default db
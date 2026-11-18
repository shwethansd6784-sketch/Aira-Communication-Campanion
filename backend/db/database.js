// database.js - Persistent SQLite database for Aira
const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'aira.db');
const db = new Database(dbPath);

// Enable WAL mode for better concurrency and write speed
db.pragma('journal_mode = WAL');

function initializeDatabase() {
  // Practice sessions
  db.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      situation TEXT NOT NULL,
      mode TEXT NOT NULL,
      difficulty TEXT NOT NULL,
      started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      ended_at DATETIME,
      duration_seconds INTEGER DEFAULT 0,
      message_count INTEGER DEFAULT 0,
      grammar_score REAL DEFAULT 0,
      fluency_score REAL DEFAULT 0,
      relevance_score REAL DEFAULT 0,
      vocabulary_score REAL DEFAULT 0,
      overall_score REAL DEFAULT 0,
      feedback_summary TEXT
    )
  `);

  // Messages table for full session transcript and evaluation details
  db.exec(`
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT NOT NULL,
      speaker TEXT NOT NULL,
      text TEXT NOT NULL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      evaluation TEXT,
      FOREIGN KEY (session_id) REFERENCES sessions(id)
    )
  `);

  // Personal vocabulary notebook
  db.exec(`
    CREATE TABLE IF NOT EXISTS vocabulary (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      word TEXT NOT NULL UNIQUE,
      meaning TEXT NOT NULL,
      example TEXT,
      pronunciation TEXT,
      saved_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Daily learning goals
  db.exec(`
    CREATE TABLE IF NOT EXISTS goals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      target INTEGER NOT NULL,
      current INTEGER DEFAULT 0,
      date TEXT NOT NULL,
      completed INTEGER DEFAULT 0
    )
  `);

  // Daily aggregated stats
  db.exec(`
    CREATE TABLE IF NOT EXISTS daily_stats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      situation TEXT,
      sessions_count INTEGER DEFAULT 0,
      total_minutes INTEGER DEFAULT 0,
      avg_score REAL DEFAULT 0
    )
  `);

  console.log('✅ SQLite database initialized at:', dbPath);
}

initializeDatabase();

module.exports = db;

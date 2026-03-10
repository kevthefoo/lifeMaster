import Database from "better-sqlite3";
import path from "path";

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (db) return db;

  const dbPath = path.join(process.cwd(), "life-master.db");
  db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  db.exec(`
    CREATE TABLE IF NOT EXISTS time_blocks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      date TEXT NOT NULL,
      start_time TEXT,
      duration INTEGER NOT NULL,
      note TEXT DEFAULT '',
      location TEXT DEFAULT '',
      link TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      list_type TEXT NOT NULL CHECK(list_type IN ('daily', 'weekly', 'monthly')),
      priority TEXT NOT NULL DEFAULT 'medium' CHECK(priority IN ('low', 'medium', 'high')),
      deadline TEXT,
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'completed')),
      note TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS habits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      target_value REAL NOT NULL,
      unit TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS recurring_blocks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      start_time TEXT,
      duration INTEGER NOT NULL,
      note TEXT DEFAULT '',
      location TEXT DEFAULT '',
      link TEXT DEFAULT '',
      repeat_type TEXT NOT NULL DEFAULT 'weekly' CHECK(repeat_type IN ('daily', 'weekly', 'monthly', 'yearly')),
      repeat_interval INTEGER NOT NULL DEFAULT 1,
      repeat_days TEXT NOT NULL DEFAULT '',
      repeat_start TEXT NOT NULL DEFAULT '',
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS habit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      habit_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      value REAL NOT NULL DEFAULT 0,
      FOREIGN KEY (habit_id) REFERENCES habits(id) ON DELETE CASCADE,
      UNIQUE(habit_id, date)
    );

    CREATE TABLE IF NOT EXISTS bombs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      deadline TEXT NOT NULL,
      deadline_time TEXT,
      priority TEXT NOT NULL DEFAULT 'medium' CHECK(priority IN ('low', 'medium', 'high')),
      note TEXT DEFAULT '',
      status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'exploded', 'defused')),
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);

  // Add location and link columns if missing (migration for existing databases)
  const timeBlockCols = db.prepare("PRAGMA table_info(time_blocks)").all() as { name: string }[];
  const timeBlockColNames = timeBlockCols.map((c) => c.name);
  if (!timeBlockColNames.includes("location")) {
    db.exec("ALTER TABLE time_blocks ADD COLUMN location TEXT DEFAULT ''");
  }
  if (!timeBlockColNames.includes("link")) {
    db.exec("ALTER TABLE time_blocks ADD COLUMN link TEXT DEFAULT ''");
  }
  const recurringCols = db.prepare("PRAGMA table_info(recurring_blocks)").all() as { name: string }[];
  const recurringColNames = recurringCols.map((c) => c.name);
  if (!recurringColNames.includes("location")) {
    db.exec("ALTER TABLE recurring_blocks ADD COLUMN location TEXT DEFAULT ''");
  }
  if (!recurringColNames.includes("link")) {
    db.exec("ALTER TABLE recurring_blocks ADD COLUMN link TEXT DEFAULT ''");
  }

  return db;
}

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
      list_type TEXT NOT NULL DEFAULT 'pool',
      priority TEXT NOT NULL DEFAULT 'medium' CHECK(priority IN ('low', 'medium', 'high')),
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'completed')),
      note TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS habits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      habit_type TEXT NOT NULL DEFAULT 'checkbox' CHECK(habit_type IN ('checkbox', 'measurable')),
      target_value REAL NOT NULL DEFAULT 1,
      unit TEXT NOT NULL DEFAULT '',
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

    CREATE TABLE IF NOT EXISTS subscriptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      amount REAL NOT NULL,
      currency TEXT NOT NULL DEFAULT 'USD',
      billing_cycle TEXT NOT NULL DEFAULT 'monthly' CHECK(billing_cycle IN ('weekly', 'monthly', 'yearly')),
      category TEXT NOT NULL DEFAULT 'other',
      next_billing_date TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'paused', 'cancelled')),
      note TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);

  // Migrate tasks table: remove list_type constraint and deadline column
  const taskCols = db.prepare("PRAGMA table_info(tasks)").all() as { name: string }[];
  const taskColNames = taskCols.map((c) => c.name);
  if (taskColNames.includes("deadline")) {
    db.exec(`
      CREATE TABLE IF NOT EXISTS tasks_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        list_type TEXT NOT NULL DEFAULT 'pool',
        priority TEXT NOT NULL DEFAULT 'medium' CHECK(priority IN ('low', 'medium', 'high')),
        status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'completed')),
        note TEXT DEFAULT '',
        created_at TEXT DEFAULT (datetime('now'))
      );
      INSERT INTO tasks_new (id, title, list_type, priority, status, note, created_at)
        SELECT id, title, 'pool', priority, status, note, created_at FROM tasks;
      DROP TABLE tasks;
      ALTER TABLE tasks_new RENAME TO tasks;
    `);
  }

  // Migrate habits table: add habit_type column for existing databases
  const habitCols = db.prepare("PRAGMA table_info(habits)").all() as { name: string }[];
  const habitColNames = habitCols.map((c) => c.name);
  if (!habitColNames.includes("habit_type")) {
    db.exec("ALTER TABLE habits ADD COLUMN habit_type TEXT NOT NULL DEFAULT 'measurable'");
  }

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

import Database from "better-sqlite3";
import fs from "fs";
import path from "path";

let db;

function dataDir() {
  const dir = path.join(process.cwd(), "data");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
}

export function getDb() {
  if (db) return db;
  db = new Database(path.join(dataDir(), "janespace.sqlite"));
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  migrate(db);
  return db;
}

function migrate(database) {
  database.exec(`
    CREATE TABLE IF NOT EXISTS employees (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      employeeCode TEXT NOT NULL UNIQUE,
      phone TEXT,
      token TEXT NOT NULL UNIQUE,
      status TEXT NOT NULL DEFAULT 'active',
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS time_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employeeId INTEGER NOT NULL,
      date TEXT NOT NULL,
      clockInAt TEXT NOT NULL,
      clockOutAt TEXT,
      totalHours REAL,
      note TEXT,
      source TEXT NOT NULL DEFAULT 'scan',
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      FOREIGN KEY (employeeId) REFERENCES employees(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_time_records_employee ON time_records(employeeId);
    CREATE INDEX IF NOT EXISTS idx_time_records_date ON time_records(date);
    CREATE INDEX IF NOT EXISTS idx_time_records_open ON time_records(employeeId, clockOutAt);

    CREATE TABLE IF NOT EXISTS weekly_reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      weekStart TEXT NOT NULL,
      weekEnd TEXT NOT NULL,
      totalWorkers INTEGER NOT NULL,
      totalHours REAL NOT NULL,
      imagePath TEXT NOT NULL,
      createdAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS employee_weekly_reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employeeId INTEGER NOT NULL,
      weekStart TEXT NOT NULL,
      weekEnd TEXT NOT NULL,
      daysWorked INTEGER NOT NULL DEFAULT 0,
      totalHours REAL NOT NULL DEFAULT 0,
      averageDailyHours REAL NOT NULL DEFAULT 0,
      longestShiftHours REAL NOT NULL DEFAULT 0,
      completedShiftCount INTEGER NOT NULL DEFAULT 0,
      exceptionCount INTEGER NOT NULL DEFAULT 0,
      dailyRowsJson TEXT NOT NULL,
      generatedAt TEXT NOT NULL,
      FOREIGN KEY (employeeId) REFERENCES employees(id) ON DELETE CASCADE
    );

    CREATE UNIQUE INDEX IF NOT EXISTS idx_employee_weekly_reports_employee_week
      ON employee_weekly_reports(employeeId, weekStart, weekEnd);
  `);

  addColumn(database, "time_records", "clockInLatitude", "REAL");
  addColumn(database, "time_records", "clockInLongitude", "REAL");
  addColumn(database, "time_records", "clockInDistanceMeters", "REAL");
  addColumn(database, "time_records", "clockInAccuracyMeters", "REAL");
  addColumn(database, "time_records", "clockOutLatitude", "REAL");
  addColumn(database, "time_records", "clockOutLongitude", "REAL");
  addColumn(database, "time_records", "clockOutDistanceMeters", "REAL");
  addColumn(database, "time_records", "clockOutAccuracyMeters", "REAL");
}

function addColumn(database, table, column, definition) {
  const columns = database.prepare(`PRAGMA table_info(${table})`).all();
  if (columns.some((item) => item.name === column)) return;
  database.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
}

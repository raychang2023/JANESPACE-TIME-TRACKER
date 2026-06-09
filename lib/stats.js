import { getDb } from "@/lib/db";
import { getWeekRange, toSydneyDate } from "@/lib/time";

export function getOpenRecord(employeeId) {
  return getDb()
    .prepare(
      "SELECT * FROM time_records WHERE employeeId = ? AND clockOutAt IS NULL ORDER BY clockInAt DESC LIMIT 1"
    )
    .get(employeeId);
}

export function getTodayTotalHours(employeeId, date = toSydneyDate()) {
  const row = getDb()
    .prepare(
      "SELECT COALESCE(SUM(totalHours), 0) AS total FROM time_records WHERE employeeId = ? AND date = ? AND clockOutAt IS NOT NULL"
    )
    .get(employeeId, date);
  return Number(row?.total || 0);
}

export function getDashboardStats() {
  const db = getDb();
  const today = toSydneyDate();
  const { weekStart, weekEnd } = getWeekRange();

  const todayAttendance = db
    .prepare("SELECT COUNT(DISTINCT employeeId) AS count FROM time_records WHERE date = ?")
    .get(today).count;
  const todayHours = db
    .prepare("SELECT COALESCE(SUM(totalHours), 0) AS total FROM time_records WHERE date = ? AND clockOutAt IS NOT NULL")
    .get(today).total;
  const workingNow = db
    .prepare("SELECT COUNT(*) AS count FROM time_records WHERE clockOutAt IS NULL")
    .get().count;
  const todayExceptions = db
    .prepare("SELECT COUNT(*) AS count FROM time_records WHERE date = ? AND (clockOutAt IS NULL OR note IS NOT NULL AND note != '')")
    .get(today).count;

  const weekly = getWeeklyStats(weekStart, weekEnd);
  return {
    today: {
      date: today,
      attendanceCount: todayAttendance,
      totalHours: Number(todayHours || 0),
      workingNow,
      exceptionCount: todayExceptions
    },
    week: weekly
  };
}

export function getWeeklyStats(weekStart, weekEnd) {
  const db = getDb();
  const rows = db
    .prepare(
      `
      SELECT
        e.id,
        e.name,
        e.employeeCode,
        COUNT(DISTINCT tr.date) AS daysWorked,
        COALESCE(SUM(CASE WHEN tr.clockOutAt IS NOT NULL THEN tr.totalHours ELSE 0 END), 0) AS totalHours,
        SUM(CASE WHEN tr.note IS NOT NULL AND tr.note != '' THEN 1 ELSE 0 END) AS notesCount
      FROM time_records tr
      JOIN employees e ON e.id = tr.employeeId
      WHERE tr.date BETWEEN ? AND ?
      GROUP BY e.id
      ORDER BY totalHours DESC, e.name ASC
    `
    )
    .all(weekStart, weekEnd)
    .map((row) => ({
      ...row,
      totalHours: Number(row.totalHours || 0),
      averageDailyHours: row.daysWorked ? Number((row.totalHours / row.daysWorked).toFixed(2)) : 0
    }));

  const totalWorkers = rows.length;
  const totalHours = Number(rows.reduce((sum, row) => sum + row.totalHours, 0).toFixed(2));
  const totalAttendanceDays = rows.reduce((sum, row) => sum + row.daysWorked, 0);
  const topWorkerByHours = rows[0] || null;

  return {
    weekStart,
    weekEnd,
    totalWorkers,
    totalHours,
    totalAttendanceDays,
    averageHoursPerWorker: totalWorkers ? Number((totalHours / totalWorkers).toFixed(2)) : 0,
    topWorkerByHours,
    employeeRows: rows
  };
}

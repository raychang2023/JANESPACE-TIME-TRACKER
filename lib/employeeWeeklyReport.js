import { getDb } from "@/lib/db";
import { dateToDisplay, getBrisbaneWeekRange, nowIso, toBrisbaneDate, weekNumber } from "@/lib/time";

const WEEK_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

function addDays(dateString, days) {
  const date = new Date(`${dateString}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function emptyDailyRows(weekStart) {
  return WEEK_DAYS.map((dayName, index) => ({
    dayName,
    date: addDays(weekStart, index),
    hours: 0
  }));
}

function normalizeReport(row) {
  if (!row) return null;
  return {
    id: row.id,
    employeeId: row.employeeId,
    weekStart: row.weekStart,
    weekEnd: row.weekEnd,
    weekNumber: weekNumber(row.weekStart),
    weekDisplay: `${dateToDisplay(row.weekStart)} - ${dateToDisplay(row.weekEnd)}`,
    daysWorked: Number(row.daysWorked || 0),
    totalHours: Number(row.totalHours || 0),
    averageDailyHours: Number(row.averageDailyHours || 0),
    longestShiftHours: Number(row.longestShiftHours || 0),
    completedShiftCount: Number(row.completedShiftCount || 0),
    exceptionCount: Number(row.exceptionCount || 0),
    dailyRows: JSON.parse(row.dailyRowsJson || "[]"),
    generatedAt: row.generatedAt
  };
}

export function buildEmployeeWeeklyReport(employee, weekStart, weekEnd) {
  const db = getDb();
  const records = db
    .prepare(
      `
      SELECT *
      FROM time_records
      WHERE employeeId = ?
      ORDER BY clockInAt ASC
    `
    )
    .all(employee.id);

  const dailyRows = emptyDailyRows(weekStart);
  const dailyMap = new Map(dailyRows.map((row) => [row.date, row]));
  let completedShiftCount = 0;
  let exceptionCount = 0;
  let longestShiftHours = 0;

  for (const record of records) {
    const brisbaneDate = toBrisbaneDate(record.clockInAt);
    if (brisbaneDate < weekStart || brisbaneDate > weekEnd) continue;

    if (!record.clockOutAt) {
      exceptionCount += 1;
      continue;
    }

    const hours = Number(record.totalHours || 0);
    completedShiftCount += 1;
    longestShiftHours = Math.max(longestShiftHours, hours);
    const day = dailyMap.get(brisbaneDate);
    if (day) {
      day.hours = Number((day.hours + hours).toFixed(2));
    }
  }

  const daysWorked = dailyRows.filter((row) => row.hours > 0).length;
  const totalHours = Number(dailyRows.reduce((sum, row) => sum + row.hours, 0).toFixed(2));
  const averageDailyHours = daysWorked ? Number((totalHours / daysWorked).toFixed(2)) : 0;

  return {
    employeeId: employee.id,
    weekStart,
    weekEnd,
    daysWorked,
    totalHours,
    averageDailyHours,
    longestShiftHours: Number(longestShiftHours.toFixed(2)),
    completedShiftCount,
    exceptionCount,
    dailyRows
  };
}

export function generateEmployeeWeeklyReports(weekStart, weekEnd) {
  const db = getDb();
  const range = weekStart && weekEnd ? { weekStart, weekEnd } : getBrisbaneWeekRange();
  const employees = db.prepare("SELECT * FROM employees WHERE status = 'active' ORDER BY name ASC").all();
  const generatedAt = nowIso();

  const save = db.prepare(
    `
    INSERT INTO employee_weekly_reports (
      employeeId,
      weekStart,
      weekEnd,
      daysWorked,
      totalHours,
      averageDailyHours,
      longestShiftHours,
      completedShiftCount,
      exceptionCount,
      dailyRowsJson,
      generatedAt
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(employeeId, weekStart, weekEnd)
    DO UPDATE SET
      daysWorked = excluded.daysWorked,
      totalHours = excluded.totalHours,
      averageDailyHours = excluded.averageDailyHours,
      longestShiftHours = excluded.longestShiftHours,
      completedShiftCount = excluded.completedShiftCount,
      exceptionCount = excluded.exceptionCount,
      dailyRowsJson = excluded.dailyRowsJson,
      generatedAt = excluded.generatedAt
  `
  );

  const reports = employees.map((employee) => {
    const report = buildEmployeeWeeklyReport(employee, range.weekStart, range.weekEnd);
    save.run(
      report.employeeId,
      report.weekStart,
      report.weekEnd,
      report.daysWorked,
      report.totalHours,
      report.averageDailyHours,
      report.longestShiftHours,
      report.completedShiftCount,
      report.exceptionCount,
      JSON.stringify(report.dailyRows),
      generatedAt
    );
    return report;
  });

  return {
    ...range,
    generatedAt,
    totalEmployees: employees.length,
    reports
  };
}

export function getLatestEmployeeWeeklyReportByToken(token) {
  const db = getDb();
  const employee = db.prepare("SELECT id, name, employeeCode, status FROM employees WHERE token = ?").get(token);
  if (!employee) return { employee: null, report: null };

  const row = db
    .prepare(
      `
      SELECT *
      FROM employee_weekly_reports
      WHERE employeeId = ?
      ORDER BY weekStart DESC, generatedAt DESC
      LIMIT 1
    `
    )
    .get(employee.id);

  return {
    employee,
    report: normalizeReport(row)
  };
}

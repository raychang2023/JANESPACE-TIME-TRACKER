import { getDb } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { calculateBillableHours, nowIso, sydneyLocalToIso, toSydneyDate } from "@/lib/time";

function mapRecord(row) {
  return row ? { ...row, totalHours: row.totalHours == null ? null : Number(row.totalHours) } : null;
}

export async function GET(request) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date") || "";
  const employeeId = searchParams.get("employeeId") || "";
  const clauses = [];
  const args = [];
  if (date) {
    clauses.push("tr.date = ?");
    args.push(date);
  }
  if (employeeId) {
    clauses.push("tr.employeeId = ?");
    args.push(employeeId);
  }

  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  const records = getDb()
    .prepare(
      `
      SELECT tr.*, e.name AS employeeName, e.employeeCode
      FROM time_records tr
      JOIN employees e ON e.id = tr.employeeId
      ${where}
      ORDER BY tr.date DESC, tr.clockInAt DESC
    `
    )
    .all(...args)
    .map(mapRecord);
  return Response.json({ records });
}

export async function POST(request) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const body = await request.json().catch(() => ({}));
  const employeeId = Number(body.employeeId);
  const clockInAt = body.clockInAt ? sydneyLocalToIso(body.clockInAt) : "";
  const clockOutAt = body.clockOutAt ? sydneyLocalToIso(body.clockOutAt) : null;
  const note = String(body.note || "").trim();

  if (!employeeId || !clockInAt) {
    return Response.json({ error: "Employee and clock in time are required" }, { status: 400 });
  }
  const employee = getDb().prepare("SELECT id FROM employees WHERE id = ?").get(employeeId);
  if (!employee) return Response.json({ error: "Employee not found" }, { status: 404 });

  const totalHours = clockOutAt ? calculateBillableHours(clockInAt, clockOutAt) : null;
  if (clockOutAt && totalHours == null) {
    return Response.json({ error: "Clock out must be after clock in" }, { status: 400 });
  }

  const now = nowIso();
  const result = getDb()
    .prepare(
      `
      INSERT INTO time_records (employeeId, date, clockInAt, clockOutAt, totalHours, note, source, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, 'manual', ?, ?)
    `
    )
    .run(employeeId, toSydneyDate(clockInAt), clockInAt, clockOutAt, totalHours, note || null, now, now);
  return Response.json({ record: getDb().prepare("SELECT * FROM time_records WHERE id = ?").get(result.lastInsertRowid) });
}

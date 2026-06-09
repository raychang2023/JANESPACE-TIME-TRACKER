import { getDb } from "@/lib/db";
import { getOpenRecord, getTodayTotalHours } from "@/lib/stats";
import { toSydneyDate } from "@/lib/time";

export async function GET(_request, { params }) {
  const { token } = await params;
  const db = getDb();
  const employee = db.prepare("SELECT * FROM employees WHERE token = ?").get(token);
  if (!employee) return Response.json({ error: "Employee not found" }, { status: 404 });

  const today = toSydneyDate();
  const openRecord = employee.status === "active" ? getOpenRecord(employee.id) : null;
  const completedToday = db
    .prepare("SELECT COUNT(*) AS count FROM time_records WHERE employeeId = ? AND date = ? AND clockOutAt IS NOT NULL")
    .get(employee.id, today).count;

  return Response.json({
    employee: {
      id: employee.id,
      name: employee.name,
      employeeCode: employee.employeeCode,
      status: employee.status
    },
    today,
    isClockedIn: Boolean(openRecord),
    status: openRecord ? "Clocked In" : completedToday ? "Completed Today" : "Not Clocked In",
    todayTotalHours: getTodayTotalHours(employee.id, today)
  });
}

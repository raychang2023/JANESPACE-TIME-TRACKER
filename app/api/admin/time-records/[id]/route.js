import { getDb } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { calculateBillableHours, nowIso, sydneyLocalToIso, toSydneyDate } from "@/lib/time";

export async function PATCH(request, { params }) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const existing = getDb().prepare("SELECT * FROM time_records WHERE id = ?").get(id);
  if (!existing) return Response.json({ error: "Record not found" }, { status: 404 });

  const employeeId = Number(body.employeeId ?? existing.employeeId);
  const clockInAt = body.clockInAt ? sydneyLocalToIso(body.clockInAt) : existing.clockInAt;
  const clockOutAt =
    body.clockOutAt === "" || body.clockOutAt === null
      ? null
      : body.clockOutAt
        ? sydneyLocalToIso(body.clockOutAt)
        : existing.clockOutAt;
  const note = String(body.note ?? existing.note ?? "").trim();
  const totalHours = clockOutAt ? calculateBillableHours(clockInAt, clockOutAt) : null;
  if (clockOutAt && totalHours == null) {
    return Response.json({ error: "Clock out must be after clock in" }, { status: 400 });
  }

  getDb()
    .prepare(
      `
      UPDATE time_records
      SET employeeId = ?, date = ?, clockInAt = ?, clockOutAt = ?, totalHours = ?, note = ?, updatedAt = ?
      WHERE id = ?
    `
    )
    .run(employeeId, toSydneyDate(clockInAt), clockInAt, clockOutAt, totalHours, note || null, nowIso(), id);
  return Response.json({ record: getDb().prepare("SELECT * FROM time_records WHERE id = ?").get(id) });
}

export async function DELETE(_request, { params }) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const { id } = await params;
  getDb().prepare("DELETE FROM time_records WHERE id = ?").run(id);
  return Response.json({ ok: true });
}

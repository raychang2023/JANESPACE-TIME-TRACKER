import { getDb } from "@/lib/db";
import { validateWarehouseDistance } from "@/lib/location";
import { getOpenRecord, getTodayTotalHours } from "@/lib/stats";
import { calculateBillableHours, nowIso, toSydneyDate } from "@/lib/time";

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const { employeeToken, action } = body;

  if (!employeeToken || !["clock_in", "clock_out"].includes(action)) {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }

  const locationCheck = validateWarehouseDistance(body);
  if (!locationCheck.ok) {
    return Response.json(
      {
        error: locationCheck.error,
        distanceMeters: locationCheck.distanceMeters ?? null
      },
      { status: 403 }
    );
  }

  const db = getDb();
  const employee = db.prepare("SELECT * FROM employees WHERE token = ?").get(employeeToken);
  if (!employee) return Response.json({ error: "Employee not found" }, { status: 404 });
  if (employee.status !== "active") return Response.json({ error: "Employee is inactive" }, { status: 403 });

  const openRecord = getOpenRecord(employee.id);
  const now = nowIso();
  const today = toSydneyDate(now);

  if (action === "clock_in") {
    if (openRecord) {
      return Response.json({ error: "Already clocked in" }, { status: 409 });
    }
    const result = db
      .prepare(
        `
        INSERT INTO time_records (
          employeeId,
          date,
          clockInAt,
          clockInLatitude,
          clockInLongitude,
          clockInDistanceMeters,
          clockInAccuracyMeters,
          clockInWarehouseId,
          clockInWarehouseName,
          source,
          createdAt,
          updatedAt
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'scan', ?, ?)
      `
      )
      .run(
        employee.id,
        today,
        now,
        locationCheck.coordinates.latitude,
        locationCheck.coordinates.longitude,
        locationCheck.distanceMeters,
        locationCheck.coordinates.accuracy,
        locationCheck.warehouse.id,
        locationCheck.warehouse.label,
        now,
        now
      );
    return Response.json({
      message: "Clock in successful",
      recordId: result.lastInsertRowid,
      status: "Clocked In",
      todayTotalHours: getTodayTotalHours(employee.id, today),
      distanceMeters: locationCheck.distanceMeters,
      warehouse: locationCheck.warehouse
    });
  }

  if (!openRecord) {
    return Response.json({ error: "No active shift to clock out" }, { status: 409 });
  }

  const totalHours = calculateBillableHours(openRecord.clockInAt, now);
  db.prepare(
    `
    UPDATE time_records
    SET clockOutAt = ?,
        totalHours = ?,
        clockOutLatitude = ?,
        clockOutLongitude = ?,
        clockOutDistanceMeters = ?,
        clockOutAccuracyMeters = ?,
        clockOutWarehouseId = ?,
        clockOutWarehouseName = ?,
        updatedAt = ?
    WHERE id = ?
  `
  ).run(
    now,
    totalHours,
    locationCheck.coordinates.latitude,
    locationCheck.coordinates.longitude,
    locationCheck.distanceMeters,
    locationCheck.coordinates.accuracy,
    locationCheck.warehouse.id,
    locationCheck.warehouse.label,
    now,
    openRecord.id
  );

  return Response.json({
    message: "Clock out successful",
    recordId: openRecord.id,
    status: "Completed Today",
    todayTotalHours: getTodayTotalHours(employee.id, today),
    distanceMeters: locationCheck.distanceMeters,
    warehouse: locationCheck.warehouse
  });
}

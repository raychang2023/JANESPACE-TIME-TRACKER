import { getDb } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { nowIso } from "@/lib/time";

export async function PATCH(request, { params }) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const existing = getDb().prepare("SELECT * FROM employees WHERE id = ?").get(id);
  if (!existing) return Response.json({ error: "Employee not found" }, { status: 404 });

  const name = String(body.name ?? existing.name).trim();
  const employeeCode = String(body.employeeCode ?? existing.employeeCode).trim();
  const phone = String(body.phone ?? existing.phone ?? "").trim();
  const status = ["active", "inactive"].includes(body.status) ? body.status : existing.status;

  if (!name || !employeeCode) {
    return Response.json({ error: "Name and employee code are required" }, { status: 400 });
  }

  try {
    getDb()
      .prepare("UPDATE employees SET name = ?, employeeCode = ?, phone = ?, status = ?, updatedAt = ? WHERE id = ?")
      .run(name, employeeCode, phone || null, status, nowIso(), id);
    const employee = getDb().prepare("SELECT * FROM employees WHERE id = ?").get(id);
    return Response.json({ employee });
  } catch (error) {
    if (String(error.message).includes("UNIQUE")) {
      return Response.json({ error: "Employee code already exists" }, { status: 409 });
    }
    return Response.json({ error: "Could not update employee" }, { status: 500 });
  }
}

import crypto from "crypto";
import { getDb } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { nowIso } from "@/lib/time";

function token() {
  return crypto.randomBytes(18).toString("hex");
}

export async function GET() {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const employees = getDb().prepare("SELECT * FROM employees ORDER BY createdAt DESC").all();
  return Response.json({ employees });
}

export async function POST(request) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const body = await request.json().catch(() => ({}));
  const name = String(body.name || "").trim();
  const employeeCode = String(body.employeeCode || "").trim();
  const phone = String(body.phone || "").trim();

  if (!name || !employeeCode) {
    return Response.json({ error: "Name and employee code are required" }, { status: 400 });
  }

  const now = nowIso();
  try {
    const result = getDb()
      .prepare(
        "INSERT INTO employees (name, employeeCode, phone, token, status, createdAt, updatedAt) VALUES (?, ?, ?, ?, 'active', ?, ?)"
      )
      .run(name, employeeCode, phone || null, token(), now, now);
    const employee = getDb().prepare("SELECT * FROM employees WHERE id = ?").get(result.lastInsertRowid);
    return Response.json({ employee });
  } catch (error) {
    if (String(error.message).includes("UNIQUE")) {
      return Response.json({ error: "Employee code already exists" }, { status: 409 });
    }
    return Response.json({ error: "Could not create employee" }, { status: 500 });
  }
}

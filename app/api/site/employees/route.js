import { getDb } from "@/lib/db";

export async function GET() {
  const employees = getDb()
    .prepare(
      "SELECT id, name, employeeCode, token FROM employees WHERE status = 'active' ORDER BY name ASC, employeeCode ASC"
    )
    .all();
  return Response.json({ employees });
}

import { requireAdmin } from "@/lib/auth";
import { getDb } from "@/lib/db";

export async function GET() {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const reports = getDb().prepare("SELECT * FROM weekly_reports ORDER BY createdAt DESC").all();
  return Response.json({ reports });
}

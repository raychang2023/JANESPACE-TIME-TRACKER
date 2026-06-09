import { requireAdmin } from "@/lib/auth";
import { getDashboardStats } from "@/lib/stats";

export async function GET() {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;
  return Response.json(getDashboardStats());
}

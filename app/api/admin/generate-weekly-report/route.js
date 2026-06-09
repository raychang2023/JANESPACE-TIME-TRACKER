import { requireAdmin } from "@/lib/auth";
import { generateWeeklyReportImage } from "@/lib/report";
import { getWeekRange } from "@/lib/time";

export async function POST(request) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const body = await request.json().catch(() => ({}));
  const range = body.weekStart && body.weekEnd ? body : getWeekRange();
  const result = await generateWeeklyReportImage(range.weekStart, range.weekEnd);
  return Response.json(result);
}

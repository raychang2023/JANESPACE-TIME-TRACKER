import { generateWeeklyReportImage } from "@/lib/report";
import { getWeekRange } from "@/lib/time";

export async function POST(request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const provided = request.headers.get("x-cron-secret") || new URL(request.url).searchParams.get("secret");
    if (provided !== secret) return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const range = getWeekRange();
  const result = await generateWeeklyReportImage(range.weekStart, range.weekEnd);
  return Response.json(result);
}

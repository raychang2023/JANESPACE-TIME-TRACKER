import { generateEmployeeWeeklyReports } from "@/lib/employeeWeeklyReport";

export async function POST(request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const provided = request.headers.get("x-cron-secret") || new URL(request.url).searchParams.get("secret");
    if (provided !== secret) return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const result = generateEmployeeWeeklyReports(body.weekStart, body.weekEnd);
  return Response.json(result);
}

import { getLatestEmployeeWeeklyReportByToken } from "@/lib/employeeWeeklyReport";

export async function GET(request) {
  const token = new URL(request.url).searchParams.get("token");
  if (!token) return Response.json({ error: "Employee token is required" }, { status: 400 });

  const result = getLatestEmployeeWeeklyReportByToken(token);
  if (!result.employee) return Response.json({ error: "Employee not found" }, { status: 404 });

  return Response.json(result);
}

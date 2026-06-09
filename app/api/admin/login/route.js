import { NextResponse } from "next/server";
import { clearAdminCookie, setAdminCookie, verifyPassword } from "@/lib/auth";

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  if (!verifyPassword(body.password || "")) {
    return Response.json({ error: "Invalid password" }, { status: 401 });
  }
  const response = NextResponse.json({ ok: true });
  setAdminCookie(response);
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  clearAdminCookie(response);
  return response;
}

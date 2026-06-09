import { cookies } from "next/headers";
import crypto from "crypto";

const COOKIE_NAME = "janespace_admin";

function adminPassword() {
  return process.env.ADMIN_PASSWORD || "admin";
}

function sessionValue() {
  return crypto.createHash("sha256").update(`janespace:${adminPassword()}`).digest("hex");
}

export async function isAdminAuthenticated() {
  const store = await cookies();
  return store.get(COOKIE_NAME)?.value === sessionValue();
}

export async function requireAdmin() {
  if (!(await isAdminAuthenticated())) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}

export function setAdminCookie(response) {
  response.cookies.set(COOKIE_NAME, sessionValue(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12
  });
}

export function clearAdminCookie(response) {
  response.cookies.set(COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0
  });
}

export function verifyPassword(password) {
  return password === adminPassword();
}

"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminShell({ children }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    fetch("/api/admin/me")
      .then((res) => res.json())
      .then((data) => {
        if (!active) return;
        if (!data.authenticated) {
          window.location.href = "/admin/login";
          return;
        }
        setReady(true);
      })
      .catch(() => {
        if (!active) return;
        window.location.href = "/admin/login";
      });
    return () => {
      active = false;
    };
  }, [router]);

  async function logout() {
    await fetch("/api/admin/login", { method: "DELETE" });
    router.replace("/admin/login");
  }

  if (!ready) return <main className="admin-main">Checking admin session...</main>;

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <h1>JANESPACE LOGISTICS OPERATION</h1>
        <nav className="admin-nav">
          <Link href="/admin">Dashboard</Link>
          <Link href="/admin/employees">Employees</Link>
          <Link href="/admin/time-records">Time Records</Link>
          <Link href="/admin/reports">Weekly Reports</Link>
          <button type="button" onClick={logout}>
            Log Out
          </button>
        </nav>
      </aside>
      <main className="admin-main">{children}</main>
    </div>
  );
}

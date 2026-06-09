"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const response = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password })
    });
    setBusy(false);
    if (!response.ok) {
      setError("Invalid password");
      return;
    }
    router.replace("/admin");
  }

  return (
    <main className="page-shell" style={{ display: "grid", placeItems: "center", padding: 20 }}>
      <form className="panel" onSubmit={submit} style={{ width: "min(100%, 420px)" }}>
        <h1 className="brand" style={{ marginTop: 0, fontSize: 22 }}>
          JANESPACE LOGISTICS OPERATION
        </h1>
        <p className="muted">Admin login</p>
        <div className="field">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            className="input"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoFocus
          />
        </div>
        {error ? <p className="error">{error}</p> : null}
        <button className="btn" type="submit" disabled={busy} style={{ marginTop: 16, width: "100%" }}>
          Log In
        </button>
      </form>
    </main>
  );
}

"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import AdminShell from "../AdminShell";

function currentSydneyWeek() {
  const now = new Date();
  const dateString = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Australia/Sydney",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(now);
  const date = new Date(`${dateString}T12:00:00Z`);
  const day = date.getUTCDay() || 7;
  const start = new Date(date.getTime() - (day - 1) * 86400000);
  const end = new Date(start.getTime() + 6 * 86400000);
  return {
    weekStart: start.toISOString().slice(0, 10),
    weekEnd: end.toISOString().slice(0, 10)
  };
}

export default function ReportsPage() {
  const [range, setRange] = useState(currentSydneyWeek());
  const [reports, setReports] = useState([]);
  const [latest, setLatest] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function loadReports() {
    const response = await fetch("/api/admin/reports");
    const payload = await response.json();
    if (response.ok) setReports(payload.reports);
  }

  useEffect(() => {
    loadReports();
  }, []);

  async function generate() {
    setBusy(true);
    setError("");
    const response = await fetch("/api/admin/generate-weekly-report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(range)
    });
    const payload = await response.json();
    setBusy(false);
    if (!response.ok) {
      setError(payload.error || "Could not generate report");
      return;
    }
    setLatest(payload);
    await loadReports();
  }

  return (
    <AdminShell>
      <h2>Weekly Reports</h2>
      <section className="panel">
        <h3>Generate Report Image</h3>
        <div className="toolbar">
          <div className="field">
            <label>Week Start</label>
            <input
              className="input"
              type="date"
              value={range.weekStart}
              onChange={(e) => setRange({ ...range, weekStart: e.target.value })}
            />
          </div>
          <div className="field">
            <label>Week End</label>
            <input className="input" type="date" value={range.weekEnd} onChange={(e) => setRange({ ...range, weekEnd: e.target.value })} />
          </div>
          <button className="btn" type="button" disabled={busy} onClick={generate}>
            Generate Report Image
          </button>
        </div>
        {error ? <p className="error">{error}</p> : null}
        {latest ? (
          <div>
            <p className="success">Report generated. Total hours: {Number(latest.stats.totalHours).toFixed(2)}</p>
            <a className="btn secondary" href={latest.imagePath} download>
              Download PNG
            </a>
            <div style={{ marginTop: 16 }}>
              <Image
                src={latest.imagePath}
                alt="Weekly report preview"
                width={360}
                height={450}
                unoptimized
                style={{ maxWidth: "360px", width: "100%", border: "1px solid #d9e1ea" }}
              />
            </div>
          </div>
        ) : null}
      </section>

      <section className="panel">
        <h3>History</h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Week</th>
                <th>Workers</th>
                <th>Total Hours</th>
                <th>Created</th>
                <th>Image</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((report) => (
                <tr key={report.id}>
                  <td>{report.id}</td>
                  <td>
                    {report.weekStart} to {report.weekEnd}
                  </td>
                  <td>{report.totalWorkers}</td>
                  <td>{Number(report.totalHours).toFixed(2)}</td>
                  <td>{new Date(report.createdAt).toLocaleString("en-AU", { timeZone: "Australia/Sydney" })}</td>
                  <td>
                    <a className="btn secondary" href={report.imagePath} download>
                      Download
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </AdminShell>
  );
}

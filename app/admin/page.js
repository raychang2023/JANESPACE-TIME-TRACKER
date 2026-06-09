"use client";

import { useEffect, useState } from "react";
import AdminShell from "./AdminShell";

function Metric({ label, value }) {
  return (
    <div className="metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/dashboard")
      .then((res) => res.json())
      .then((payload) => {
        if (!payload.today || !payload.week) {
          setError(payload.error || "Dashboard data is not available yet.");
          return;
        }
        setData(payload);
      })
      .catch(() => setError("Could not load dashboard data."));
  }, []);

  return (
    <AdminShell>
      <h2>Dashboard</h2>
      {error ? <p className="error">{error}</p> : null}
      {!data && !error ? (
        <p className="muted">Loading...</p>
      ) : (
        <>
          <section className="panel">
            <h3>Today</h3>
            <div className="metrics">
              <Metric label="Attendance" value={data.today.attendanceCount} />
              <Metric label="Total Hours" value={Number(data.today.totalHours).toFixed(2)} />
              <Metric label="Working Now" value={data.today.workingNow} />
              <Metric label="Exceptions" value={data.today.exceptionCount} />
            </div>
          </section>
          <section className="panel">
            <h3>This Week</h3>
            <div className="metrics">
              <Metric label="Workers" value={data.week.totalWorkers} />
              <Metric label="Total Hours" value={Number(data.week.totalHours).toFixed(2)} />
              <Metric label="Attendance Days" value={data.week.totalAttendanceDays} />
              <Metric label="Avg Hours / Worker" value={Number(data.week.averageHoursPerWorker).toFixed(2)} />
            </div>
          </section>
        </>
      )}
    </AdminShell>
  );
}

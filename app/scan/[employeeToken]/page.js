"use client";

import { useCallback, useEffect, useState } from "react";
import EmployeeWeeklyReportCard from "@/app/components/EmployeeWeeklyReportCard";
import "./scan.css";

function sydneyNow() {
  const now = new Date();
  return {
    date: new Intl.DateTimeFormat("en-AU", {
      timeZone: "Australia/Sydney",
      weekday: "long",
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    }).format(now),
    time: new Intl.DateTimeFormat("en-AU", {
      timeZone: "Australia/Sydney",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false
    }).format(now)
  };
}

export default function ScanPage() {
  const [token, setToken] = useState("");
  const [clock, setClock] = useState(sydneyNow());
  const [data, setData] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [locationMessage, setLocationMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [weeklyReport, setWeeklyReport] = useState(null);
  const [weeklyEmployee, setWeeklyEmployee] = useState(null);

  useEffect(() => {
    const parts = window.location.pathname.split("/");
    setToken(parts[parts.length - 1] || "");
  }, []);

  const load = useCallback(async (nextToken = token) => {
    if (!nextToken) return;
    const response = await fetch(`/api/scan/${nextToken}`);
    const payload = await response.json();
    if (!response.ok) {
      setError(payload.error || "Could not load employee");
      return;
    }
    setData(payload);

    const weeklyResponse = await fetch(`/api/employee/weekly-report?token=${nextToken}`);
    const weeklyPayload = await weeklyResponse.json();
    if (weeklyResponse.ok) {
      setWeeklyReport(weeklyPayload.report);
      setWeeklyEmployee(weeklyPayload.employee);
    }
  }, [token]);

  useEffect(() => {
    if (token) load(token);
  }, [token, load]);

  useEffect(() => {
    const timer = setInterval(() => setClock(sydneyNow()), 1000);
    return () => clearInterval(timer);
  }, []);

  function getCurrentPosition() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Location is required to clock in/out on site"));
        return;
      }
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0
      });
    });
  }

  async function submit(action) {
    const label = action === "clock_in" ? "Clock In" : "Clock Out";
    if (!confirm(`Confirm ${label} for ${data.employee.name}?`)) return;

    setBusy(true);
    setError("");
    setMessage("");
    setLocationMessage("Checking onsite location...");

    let position;
    try {
      position = await getCurrentPosition();
    } catch {
      setBusy(false);
      setLocationMessage("");
      setError("Location is required to clock in/out on site. Please allow location access or contact admin.");
      return;
    }

    const response = await fetch("/api/clock", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        employeeToken: token,
        action,
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy
      })
    });
    const payload = await response.json();
    setBusy(false);
    setLocationMessage("");
    if (!response.ok) {
      setError(payload.error || "Action failed");
      await load();
      return;
    }
    setMessage(
      payload.distanceMeters == null ? payload.message : `${payload.message}. Site distance: ${payload.distanceMeters}m`
    );
    await load();
  }

  const disabled = busy || !data || data.employee?.status !== "active";
  const action = data?.isClockedIn ? "clock_out" : "clock_in";

  return (
    <main className="scan-page">
      <section className="scan-card">
        <header>
          <div className="brand">JANESPACE LOGISTICS OPERATION</div>
          <p>Warehouse Sorting Staff Time Tracker</p>
        </header>

        {data ? (
          <>
            <div className="worker-block">
              <span>Employee</span>
              <strong>{data.employee.name}</strong>
              <small>{data.employee.employeeCode}</small>
            </div>

            <div className="time-block">
              <div>{clock.date}</div>
              <strong>{clock.time}</strong>
            </div>

            <div className={`scan-status ${data.isClockedIn ? "on" : "off"}`}>{data.status}</div>

            {data.employee.status !== "active" ? (
              <p className="error">This employee is inactive. Please contact the warehouse manager.</p>
            ) : (
              <button className="scan-button" disabled={disabled} onClick={() => submit(action)}>
                {busy ? "Checking Location..." : data.isClockedIn ? "Clock Out" : "Clock In"}
              </button>
            )}

            {locationMessage ? <p className="muted">{locationMessage}</p> : null}
            {message ? <p className="success">{message}</p> : null}
            {error ? <p className="error">{error}</p> : null}
            <p className="total">Today total hours: {Number(data.todayTotalHours || 0).toFixed(2)} hrs</p>
          </>
        ) : (
          <p className="muted">{error || "Loading..."}</p>
        )}
      </section>
      {token ? <EmployeeWeeklyReportCard employee={weeklyEmployee || data?.employee} report={weeklyReport} /> : null}
    </main>
  );
}

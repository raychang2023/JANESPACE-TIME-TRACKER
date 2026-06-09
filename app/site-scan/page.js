"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import EmployeeWeeklyReportCard from "@/app/components/EmployeeWeeklyReportCard";
import "../scan/[employeeToken]/scan.css";

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

export default function SiteScanPage() {
  const [clock, setClock] = useState(sydneyNow());
  const [employees, setEmployees] = useState([]);
  const [selectedToken, setSelectedToken] = useState("");
  const [data, setData] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [locationMessage, setLocationMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [employeeMenuOpen, setEmployeeMenuOpen] = useState(false);
  const [weeklyReport, setWeeklyReport] = useState(null);
  const [weeklyEmployee, setWeeklyEmployee] = useState(null);

  const selectedEmployee = useMemo(
    () => employees.find((employee) => employee.token === selectedToken),
    [employees, selectedToken]
  );

  useEffect(() => {
    fetch("/api/site/employees")
      .then((response) => response.json())
      .then((payload) => setEmployees(payload.employees || []))
      .catch(() => setError("Could not load employee list"));
  }, []);

  const loadStatus = useCallback(async () => {
    if (!selectedToken) {
      setData(null);
      setWeeklyReport(null);
      setWeeklyEmployee(null);
      return;
    }
    const response = await fetch(`/api/scan/${selectedToken}`);
    const payload = await response.json();
    if (!response.ok) {
      setError(payload.error || "Could not load employee status");
      return;
    }
    setData(payload);

    const weeklyResponse = await fetch(`/api/employee/weekly-report?token=${selectedToken}`);
    const weeklyPayload = await weeklyResponse.json();
    if (weeklyResponse.ok) {
      setWeeklyReport(weeklyPayload.report);
      setWeeklyEmployee(weeklyPayload.employee);
    }
  }, [selectedToken]);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  useEffect(() => {
    const timer = setInterval(() => setClock(sydneyNow()), 1000);
    return () => clearInterval(timer);
  }, []);

  async function submit(action) {
    if (!data) return;
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
        employeeToken: selectedToken,
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
      await loadStatus();
      return;
    }
    setMessage(
      payload.distanceMeters == null ? payload.message : `${payload.message}. Site distance: ${payload.distanceMeters}m`
    );
    await loadStatus();
  }

  const action = data?.isClockedIn ? "clock_out" : "clock_in";
  const disabled = busy || !data;

  return (
    <main className="scan-page site-station-page">
      <section className="scan-card site-station-card">
        <header className="station-header">
          <div className="station-logo-row">
            <div>
              <div className="station-brand">JANESPACE</div>
              <div className="station-subbrand">LOGISTICS OPERATION</div>
            </div>
          </div>
          <p>Onsite Staff Clock Station</p>
        </header>

        <div className="station-time-block">
          <div className="station-date">
            <span className="station-date-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" role="img">
                <path d="M7 2v3M17 2v3M4 9h16M6 5h12a2 2 0 0 1 2 2v13H4V7a2 2 0 0 1 2-2Z" />
                <path d="M8 13h.01M12 13h.01M16 13h.01M8 17h.01M12 17h.01" />
              </svg>
            </span>
            <span>{clock.date}</span>
          </div>
          <strong>{clock.time}</strong>
        </div>

        <div className="field site-field">
          <label id="employee-label">Select Your Name</label>
          <div className="station-select-wrap">
            <button
              type="button"
              className="station-select"
              aria-labelledby="employee-label"
              aria-haspopup="listbox"
              aria-expanded={employeeMenuOpen}
              onClick={() => setEmployeeMenuOpen((open) => !open)}
            >
              <span className="station-select-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" role="img">
                  <path d="M20 21a8 8 0 0 0-16 0" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </span>
              <span className={selectedEmployee ? "station-select-value" : "station-select-placeholder"}>
                {selectedEmployee ? `${selectedEmployee.name} (${selectedEmployee.employeeCode})` : "Choose employee"}
              </span>
              <span className="station-chevron" aria-hidden="true" />
            </button>
            {employeeMenuOpen ? (
              <div className="station-menu" role="listbox" aria-labelledby="employee-label">
                {employees.length ? (
                  employees.map((employee) => (
                    <button
                      key={employee.id}
                      type="button"
                      className={`station-menu-item ${employee.token === selectedToken ? "selected" : ""}`}
                      role="option"
                      aria-selected={employee.token === selectedToken}
                      onClick={() => {
                        setSelectedToken(employee.token);
                        setEmployeeMenuOpen(false);
                        setMessage("");
                        setError("");
                      }}
                    >
                      <span>{employee.name}</span>
                      <small>{employee.employeeCode}</small>
                    </button>
                  ))
                ) : (
                  <div className="station-menu-empty">No active employees</div>
                )}
              </div>
            ) : null}
          </div>
        </div>

        {selectedEmployee ? (
          <div className="worker-block station-worker-block">
            <span>Employee</span>
            <strong>{selectedEmployee.name}</strong>
            <small>{selectedEmployee.employeeCode}</small>
          </div>
        ) : null}

        {data ? (
          <>
            <div className={`scan-status ${data.isClockedIn ? "on" : "off"}`}>{data.status}</div>
            <button className="scan-button" disabled={disabled} onClick={() => submit(action)}>
              <span className="station-button-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" role="img">
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 7v6l4 3" />
                </svg>
              </span>
              {busy ? "Checking Location..." : data.isClockedIn ? "Clock Out" : "Clock In"}
            </button>
          </>
        ) : (
          <p className="muted">Select your name to see clock status.</p>
        )}

        {locationMessage ? <p className="muted">{locationMessage}</p> : null}
        {message ? <p className="success">{message}</p> : null}
        {error ? <p className="error">{error}</p> : null}
        <p className="total station-total">
          <span className="station-total-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" role="img">
              <path d="M4 20V10M10 20V5M16 20v-8M22 20H2" />
            </svg>
          </span>
          <span>
            Today total hours: <strong>{Number(data?.todayTotalHours || 0).toFixed(2)} hrs</strong>
          </span>
        </p>
      </section>

      {selectedToken ? <EmployeeWeeklyReportCard employee={weeklyEmployee || selectedEmployee} report={weeklyReport} /> : null}
    </main>
  );
}

"use client";

import { useCallback, useEffect, useState } from "react";
import AdminShell from "../AdminShell";

function sydneyInput(value) {
  if (!value) return "";
  const parts = new Intl.DateTimeFormat("en-AU", {
    timeZone: "Australia/Sydney",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).formatToParts(new Date(value));
  const get = (type) => parts.find((p) => p.type === type).value;
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
}

function sydneyDisplay(value) {
  if (!value) return "";
  return new Intl.DateTimeFormat("en-AU", {
    timeZone: "Australia/Sydney",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).format(new Date(value));
}

const blank = { employeeId: "", clockInAt: "", clockOutAt: "", note: "" };

function distanceDisplay(record) {
  const parts = [];
  if (record.clockInDistanceMeters != null) {
    parts.push(`In: ${Math.round(record.clockInDistanceMeters)}m`);
  }
  if (record.clockOutDistanceMeters != null) {
    parts.push(`Out: ${Math.round(record.clockOutDistanceMeters)}m`);
  }
  return parts.join(" / ");
}

export default function TimeRecordsPage() {
  const [employees, setEmployees] = useState([]);
  const [records, setRecords] = useState([]);
  const [filters, setFilters] = useState({ date: "", employeeId: "" });
  const [form, setForm] = useState(blank);
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function loadEmployees() {
    const response = await fetch("/api/admin/employees");
    const payload = await response.json();
    if (response.ok) setEmployees(payload.employees);
  }

  const loadRecords = useCallback(async () => {
    const params = new URLSearchParams();
    if (filters.date) params.set("date", filters.date);
    if (filters.employeeId) params.set("employeeId", filters.employeeId);
    const response = await fetch(`/api/admin/time-records?${params}`);
    const payload = await response.json();
    if (response.ok) setRecords(payload.records);
  }, [filters]);

  useEffect(() => {
    loadEmployees();
  }, []);

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  function edit(record) {
    setEditing(record);
    setForm({
      employeeId: record.employeeId,
      clockInAt: sydneyInput(record.clockInAt),
      clockOutAt: sydneyInput(record.clockOutAt),
      note: record.note || ""
    });
    setError("");
    setMessage("");
  }

  async function submit(event) {
    event.preventDefault();
    setError("");
    setMessage("");
    const response = await fetch(editing ? `/api/admin/time-records/${editing.id}` : "/api/admin/time-records", {
      method: editing ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });
    const payload = await response.json();
    if (!response.ok) {
      setError(payload.error || "Save failed");
      return;
    }
    setMessage(editing ? "Record updated" : "Record created");
    setEditing(null);
    setForm(blank);
    await loadRecords();
  }

  async function remove(record) {
    if (!confirm(`Delete record #${record.id}?`)) return;
    await fetch(`/api/admin/time-records/${record.id}`, { method: "DELETE" });
    await loadRecords();
  }

  return (
    <AdminShell>
      <h2>Time Records</h2>
      <section className="panel">
        <h3>{editing ? "Edit Record" : "Manual Record"}</h3>
        <form className="toolbar" onSubmit={submit}>
          <div className="field">
            <label>Employee</label>
            <select className="select" value={form.employeeId} onChange={(e) => setForm({ ...form, employeeId: e.target.value })}>
              <option value="">Select</option>
              {employees.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.name} ({employee.employeeCode})
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Clock In</label>
            <input
              className="input"
              type="datetime-local"
              value={form.clockInAt}
              onChange={(e) => setForm({ ...form, clockInAt: e.target.value })}
            />
          </div>
          <div className="field">
            <label>Clock Out</label>
            <input
              className="input"
              type="datetime-local"
              value={form.clockOutAt}
              onChange={(e) => setForm({ ...form, clockOutAt: e.target.value })}
            />
          </div>
          <div className="field">
            <label>Note</label>
            <input
              className="input"
              placeholder="late, left early, forgot clock out"
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
            />
          </div>
          <button className="btn" type="submit">
            {editing ? "Save Changes" : "Add Record"}
          </button>
          {editing ? (
            <button className="btn secondary" type="button" onClick={() => { setEditing(null); setForm(blank); }}>
              Cancel
            </button>
          ) : null}
        </form>
        <p className="muted">Hours are billed in 15-minute blocks with a 1-minute grace buffer.</p>
        {message ? <p className="success">{message}</p> : null}
        {error ? <p className="error">{error}</p> : null}
      </section>

      <section className="panel">
        <h3>Records</h3>
        <div className="toolbar">
          <div className="field">
            <label>Date</label>
            <input className="input" type="date" value={filters.date} onChange={(e) => setFilters({ ...filters, date: e.target.value })} />
          </div>
          <div className="field">
            <label>Employee</label>
            <select className="select" value={filters.employeeId} onChange={(e) => setFilters({ ...filters, employeeId: e.target.value })}>
              <option value="">All</option>
              {employees.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.name}
                </option>
              ))}
            </select>
          </div>
          <button className="btn secondary" type="button" onClick={() => setFilters({ date: "", employeeId: "" })}>
            Clear
          </button>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Employee</th>
                <th>Date</th>
                <th>Clock In</th>
                <th>Clock Out</th>
                <th>Hours</th>
                <th>Site Distance</th>
                <th>Source</th>
                <th>Note</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {records.map((record) => (
                <tr key={record.id}>
                  <td>{record.id}</td>
                  <td>{record.employeeName}</td>
                  <td>{record.date}</td>
                  <td>{sydneyDisplay(record.clockInAt)}</td>
                  <td>{record.clockOutAt ? sydneyDisplay(record.clockOutAt) : <span className="status open">Open</span>}</td>
                  <td>{record.totalHours == null ? "" : Number(record.totalHours).toFixed(2)}</td>
                  <td>{distanceDisplay(record)}</td>
                  <td>{record.source}</td>
                  <td>{record.note || ""}</td>
                  <td>
                    <button className="btn secondary" type="button" onClick={() => edit(record)}>
                      Edit
                    </button>{" "}
                    <button className="btn danger" type="button" onClick={() => remove(record)}>
                      Delete
                    </button>
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

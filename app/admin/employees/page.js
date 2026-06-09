"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import AdminShell from "../AdminShell";

const blank = { name: "", employeeCode: "", phone: "" };

export default function EmployeesPage() {
  const [employees, setEmployees] = useState([]);
  const [form, setForm] = useState(blank);
  const [editing, setEditing] = useState(null);
  const [qrEmployee, setQrEmployee] = useState(null);
  const [showSiteQr, setShowSiteQr] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const origin = typeof window === "undefined" ? "" : window.location.origin;

  async function load() {
    const response = await fetch("/api/admin/employees");
    const payload = await response.json();
    if (response.ok) setEmployees(payload.employees);
  }

  useEffect(() => {
    load();
  }, []);

  const activeCount = useMemo(() => employees.filter((item) => item.status === "active").length, [employees]);

  function edit(employee) {
    setEditing(employee);
    setForm({
      name: employee.name,
      employeeCode: employee.employeeCode,
      phone: employee.phone || "",
      status: employee.status
    });
    setMessage("");
    setError("");
  }

  async function submit(event) {
    event.preventDefault();
    setError("");
    setMessage("");
    const url = editing ? `/api/admin/employees/${editing.id}` : "/api/admin/employees";
    const response = await fetch(url, {
      method: editing ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });
    const payload = await response.json();
    if (!response.ok) {
      setError(payload.error || "Save failed");
      return;
    }
    setMessage(editing ? "Employee updated" : "Employee created");
    setForm(blank);
    setEditing(null);
    await load();
  }

  async function setStatus(employee, status) {
    await fetch(`/api/admin/employees/${employee.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...employee, status })
    });
    await load();
  }

  return (
    <AdminShell>
      <h2>Employees</h2>
      <section className="panel">
        <h3>{editing ? "Edit Employee" : "New Employee"}</h3>
        <form className="toolbar" onSubmit={submit}>
          <div className="field">
            <label>Name</label>
            <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="field">
            <label>Employee Code</label>
            <input
              className="input"
              value={form.employeeCode}
              onChange={(e) => setForm({ ...form, employeeCode: e.target.value })}
            />
          </div>
          <div className="field">
            <label>Phone</label>
            <input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          {editing ? (
            <div className="field">
              <label>Status</label>
              <select className="select" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <option value="active">active</option>
                <option value="inactive">inactive</option>
              </select>
            </div>
          ) : null}
          <button className="btn" type="submit">
            {editing ? "Save Changes" : "Create Employee"}
          </button>
          {editing ? (
            <button className="btn secondary" type="button" onClick={() => { setEditing(null); setForm(blank); }}>
              Cancel
            </button>
          ) : null}
        </form>
        {message ? <p className="success">{message}</p> : null}
        {error ? <p className="error">{error}</p> : null}
      </section>

      <section className="panel">
        <h3>Employee List</h3>
        <div className="toolbar">
          <p className="muted" style={{ margin: 0 }}>
            Active employees: {activeCount}
          </p>
          <button className="btn secondary" type="button" onClick={() => setShowSiteQr(true)}>
            View Site QR
          </button>
          <a className="btn secondary" href="/api/admin/site-qr">
            Download Site QR
          </a>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Code</th>
                <th>Phone</th>
                <th>Status</th>
                <th>Scan URL</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((employee) => (
                <tr key={employee.id}>
                  <td>{employee.id}</td>
                  <td>{employee.name}</td>
                  <td>{employee.employeeCode}</td>
                  <td>{employee.phone || ""}</td>
                  <td>
                    <span className={`status ${employee.status}`}>{employee.status}</span>
                  </td>
                  <td style={{ maxWidth: 280, wordBreak: "break-all" }}>{origin}/scan/{employee.token}</td>
                  <td>
                    <button className="btn secondary" type="button" onClick={() => edit(employee)}>
                      Edit
                    </button>{" "}
                    <a className="btn secondary" href={`/api/admin/employees/${employee.id}/qr`}>
                      Download QR
                    </a>{" "}
                    <button className="btn secondary" type="button" onClick={() => setQrEmployee(employee)}>
                      View QR
                    </button>{" "}
                    {employee.status === "active" ? (
                      <button className="btn danger" type="button" onClick={() => setStatus(employee, "inactive")}>
                        Deactivate
                      </button>
                    ) : (
                      <button className="btn secondary" type="button" onClick={() => setStatus(employee, "active")}>
                        Activate
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {showSiteQr ? (
        <section className="panel">
          <h3>Site QR Preview</h3>
          <p className="muted">Print this QR and place it at the warehouse clock-in area.</p>
          <Image
            src="/api/admin/site-qr?inline=1"
            alt="Site clock station QR code"
            width={260}
            height={260}
            unoptimized
            style={{ width: 260, maxWidth: "100%", border: "1px solid #d9e1ea" }}
          />
          <p style={{ maxWidth: 520, wordBreak: "break-all" }}>{origin}/site-scan</p>
          <a className="btn secondary" href="/api/admin/site-qr">
            Download PNG
          </a>{" "}
          <button className="btn secondary" type="button" onClick={() => setShowSiteQr(false)}>
            Close
          </button>
        </section>
      ) : null}

      {qrEmployee ? (
        <section className="panel">
          <h3>QR Preview</h3>
          <p className="muted">
            {qrEmployee.name} ({qrEmployee.employeeCode})
          </p>
          <Image
            src={`/api/admin/employees/${qrEmployee.id}/qr?inline=1`}
            alt={`${qrEmployee.name} QR code`}
            width={260}
            height={260}
            unoptimized
            style={{ width: 260, maxWidth: "100%", border: "1px solid #d9e1ea" }}
          />
          <p style={{ maxWidth: 520, wordBreak: "break-all" }}>{origin}/scan/{qrEmployee.token}</p>
          <a className="btn secondary" href={`/api/admin/employees/${qrEmployee.id}/qr`}>
            Download PNG
          </a>{" "}
          <button className="btn secondary" type="button" onClick={() => setQrEmployee(null)}>
            Close
          </button>
        </section>
      ) : null}
    </AdminShell>
  );
}

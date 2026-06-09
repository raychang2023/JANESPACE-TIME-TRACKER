import Link from "next/link";

export default function ScanIndexPage() {
  return (
    <main className="scan-page">
      <section className="scan-card">
        <header>
          <div className="brand">JANESPACE LOGISTICS OPERATION</div>
          <p>Warehouse Sorting Staff Time Tracker</p>
        </header>
        <div className="worker-block">
          <span>Scan page</span>
          <strong>Employee QR Required</strong>
        </div>
        <p className="muted">
          Each worker must use their personal QR code. The scan URL should look like /scan/[employeeToken].
        </p>
        <Link className="scan-button" href="/admin/employees" style={{ display: "grid", placeItems: "center" }}>
          Go to Employees
        </Link>
      </section>
    </main>
  );
}

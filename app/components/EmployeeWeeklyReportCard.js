"use client";

function Icon({ type }) {
  const paths = {
    calendar: (
      <>
        <path d="M7 2v3M17 2v3M4 9h16M6 5h12a2 2 0 0 1 2 2v13H4V7a2 2 0 0 1 2-2Z" />
        <path d="M8 13h.01M12 13h.01M16 13h.01" />
      </>
    ),
    user: (
      <>
        <path d="M20 21a8 8 0 0 0-16 0" />
        <circle cx="12" cy="7" r="4" />
      </>
    ),
    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v6l4 3" />
      </>
    ),
    days: (
      <>
        <path d="M7 2v3M17 2v3M4 9h16M5 5h14v17H5z" />
        <path d="m8 15 2 2 5-5" />
      </>
    ),
    chart: <path d="M4 20V10M10 20V5M16 20v-8M22 20H2" />,
    star: <path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.2 6.4 20.2 7.5 14 3 9.6l6.2-.9Z" />,
    check: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="m8 12 3 3 5-6" />
      </>
    ),
    trophy: (
      <>
        <path d="M8 21h8M12 17v4M7 4h10v6a5 5 0 0 1-10 0V4Z" />
        <path d="M7 6H4v3a3 3 0 0 0 3 3M17 6h3v3a3 3 0 0 1-3 3" />
      </>
    ),
    info: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 10v6M12 7h.01" />
      </>
    ),
    shield: (
      <>
        <path d="M12 3 5 6v6c0 4 3 7 7 9 4-2 7-5 7-9V6Z" />
        <path d="m9 12 2 2 4-5" />
      </>
    )
  };

  return (
    <svg viewBox="0 0 24 24" role="img" aria-hidden="true">
      {paths[type]}
    </svg>
  );
}

function Metric({ icon, label, value, suffix }) {
  return (
    <div className="weekly-metric">
      <div className="weekly-metric-icon">
        <Icon type={icon} />
      </div>
      <span>{label}</span>
      <strong>
        {value}
        {suffix ? <small>{suffix}</small> : null}
      </strong>
    </div>
  );
}

function dayIcon(dayName, hours) {
  if (!hours) return "off";
  if (dayName === "Wednesday") return "cloud";
  if (dayName === "Thursday") return "partly";
  return "sun";
}

function DaySymbol({ type }) {
  if (type === "off") return <span className="day-symbol off">−</span>;
  if (type === "cloud") return <span className="day-symbol cloud">☁</span>;
  if (type === "partly") return <span className="day-symbol partly">☼</span>;
  return <span className="day-symbol sun">☼</span>;
}

export default function EmployeeWeeklyReportCard({ employee, report }) {
  if (!report) {
    return (
      <section className="weekly-card weekly-empty">
        <div className="weekly-logo-text">
          <div>JANESPACE</div>
          <span>LOGISTICS OPERATION</span>
        </div>
        <h2>Your Weekly Hours Summary</h2>
        <p>Weekly report will be available after Sunday 11:00 PM.</p>
      </section>
    );
  }

  const dailyRows = report.dailyRows || [];
  const completed = report.exceptionCount === 0;

  return (
    <section className="weekly-card">
      <div className="weekly-logo-text">
        <div>JANESPACE</div>
        <span>LOGISTICS OPERATION</span>
      </div>

      <h2>Your Weekly Hours Summary</h2>
      <div className="weekly-range">
        <span>
          <Icon type="calendar" />
        </span>
        <strong>Week {report.weekNumber}</strong>
        <i />
        <span>{report.weekDisplay}</span>
      </div>

      <div className="weekly-employee-row">
        <div className="weekly-avatar">
          <Icon type="user" />
        </div>
        <div>
          <span>Employee</span>
          <strong>{employee?.name}</strong>
          <small>{employee?.employeeCode}</small>
        </div>
        <div className={completed ? "weekly-pill complete" : "weekly-pill warning"}>
          <Icon type={completed ? "check" : "info"} />
          {completed ? "Completed Week" : `${report.exceptionCount} Exception${report.exceptionCount > 1 ? "s" : ""}`}
        </div>
      </div>

      <div className="weekly-metrics">
        <Metric icon="clock" label="Total Hours" value={report.totalHours.toFixed(2)} suffix="hrs" />
        <Metric icon="days" label="Days Worked" value={report.daysWorked} />
        <Metric icon="chart" label="Average Daily Hours" value={report.averageDailyHours.toFixed(2)} suffix="hrs" />
        <Metric icon="star" label="Longest Shift" value={report.longestShiftHours.toFixed(2)} suffix="hrs" />
      </div>

      <div className="weekly-table">
        <div className="weekly-table-head">
          <span>Day</span>
          <span>Hours</span>
        </div>
        {dailyRows.map((row) => (
          <div className="weekly-day-row" key={row.dayName}>
            <span>
              <DaySymbol type={dayIcon(row.dayName, row.hours)} />
              {row.dayName}
            </span>
            <strong>{row.hours ? `${Number(row.hours).toFixed(2)} hrs` : "Off"}</strong>
          </div>
        ))}
      </div>

      <div className="weekly-summary-box">
        <div className="weekly-summary-icon">
          <Icon type="trophy" />
        </div>
        <div>
          <span>This Week Summary</span>
          <strong>
            Great job, {employee?.name} — {report.totalHours.toFixed(2)} hrs completed
          </strong>
          <p>Thank you for your support this week</p>
        </div>
      </div>

      <footer className="weekly-footer">
        <span>
          <Icon type="info" />
          Generated automatically
        </span>
        <i />
        <span>
          <Icon type="shield" />
          For Staff Reference
        </span>
      </footer>
    </section>
  );
}

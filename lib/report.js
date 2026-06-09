import fs from "fs";
import path from "path";
import sharp from "sharp";
import { getDb } from "@/lib/db";
import { dateToDisplay, nowIso, weekNumber } from "@/lib/time";
import { getWeeklyStats } from "@/lib/stats";

function esc(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function reportDir() {
  const dir = path.join(process.cwd(), "public", "generated", "reports");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function rowSvg(row, index) {
  const y = 606 + index * 58;
  return `
    <rect x="70" y="${y - 34}" width="940" height="58" fill="${index % 2 ? "#ffffff" : "#f7fafc"}"/>
    <text x="92" y="${y}" class="cell bold">${esc(row.name)}</text>
    <text x="380" y="${y}" class="cell">${esc(row.employeeCode)}</text>
    <text x="570" y="${y}" class="cell">${row.daysWorked}</text>
    <text x="710" y="${y}" class="cell">${row.totalHours.toFixed(2)}</text>
    <text x="865" y="${y}" class="cell">${row.averageDailyHours.toFixed(2)}</text>
  `;
}

function metricSvg(label, value, x, y) {
  return `
    <rect x="${x}" y="${y}" width="220" height="128" rx="8" fill="#ffffff" stroke="#dbe4ef"/>
    <text x="${x + 22}" y="${y + 42}" class="metric-label">${esc(label)}</text>
    <text x="${x + 22}" y="${y + 92}" class="metric-value">${esc(value)}</text>
  `;
}

export async function generateWeeklyReportImage(weekStart, weekEnd) {
  const stats = getWeeklyStats(weekStart, weekEnd);
  const visibleRows = stats.employeeRows.slice(0, 11);
  const generatedAt = nowIso();
  const fileName = `weekly-report-${weekStart}-${weekEnd}-${Date.now()}.png`;
  const absolutePath = path.join(reportDir(), fileName);
  const publicPath = `/generated/reports/${fileName}`;
  const week = weekNumber(weekStart);

  const svg = `
  <svg width="1080" height="1350" viewBox="0 0 1080 1350" xmlns="http://www.w3.org/2000/svg">
    <rect width="1080" height="1350" fill="#ffffff"/>
    <rect x="0" y="0" width="1080" height="18" fill="#0b1f3a"/>
    <style>
      .brand { font: 800 38px Arial, Helvetica, sans-serif; fill: #0b1f3a; letter-spacing: 0; }
      .sub { font: 700 30px Arial, Helvetica, sans-serif; fill: #162033; }
      .date { font: 400 25px Arial, Helvetica, sans-serif; fill: #64748b; }
      .metric-label { font: 700 21px Arial, Helvetica, sans-serif; fill: #64748b; }
      .metric-value { font: 800 38px Arial, Helvetica, sans-serif; fill: #0b1f3a; }
      .thead { font: 800 20px Arial, Helvetica, sans-serif; fill: #ffffff; }
      .cell { font: 400 22px Arial, Helvetica, sans-serif; fill: #1f2937; }
      .bold { font-weight: 800; }
      .foot { font: 400 20px Arial, Helvetica, sans-serif; fill: #64748b; }
    </style>
    <text x="70" y="98" class="brand">JANESPACE</text>
    <text x="70" y="136" class="date">LOGISTICS OPERATION</text>
    <text x="70" y="218" class="sub">Weekly Sorting Staff Hours Report</text>
    <text x="70" y="258" class="date">Week ${week} | ${dateToDisplay(weekStart)} to ${dateToDisplay(weekEnd)}</text>

    ${metricSvg("Total Workers", stats.totalWorkers, 70, 324)}
    ${metricSvg("Total Hours", stats.totalHours.toFixed(2), 315, 324)}
    ${metricSvg("Attendance Days", stats.totalAttendanceDays, 560, 324)}
    ${metricSvg("Avg Hours / Worker", stats.averageHoursPerWorker.toFixed(2), 805, 324)}

    <rect x="70" y="530" width="940" height="52" rx="8" fill="#0b1f3a"/>
    <text x="92" y="563" class="thead">Name</text>
    <text x="380" y="563" class="thead">Code</text>
    <text x="570" y="563" class="thead">Days</text>
    <text x="710" y="563" class="thead">Hours</text>
    <text x="865" y="563" class="thead">Avg Hours</text>
    <rect x="70" y="582" width="940" height="1" fill="#dbe4ef"/>

    ${
      visibleRows.length
        ? visibleRows.map(rowSvg).join("")
        : '<text x="70" y="650" class="cell">No completed time records for this week.</text>'
    }

    <line x1="70" y1="1190" x2="1010" y2="1190" stroke="#dbe4ef"/>
    <text x="70" y="1240" class="foot">Generated automatically</text>
    <text x="790" y="1240" class="foot">Internal Use Only</text>
  </svg>`;

  await sharp(Buffer.from(svg)).png({ quality: 100 }).toFile(absolutePath);

  getDb()
    .prepare(
      "INSERT INTO weekly_reports (weekStart, weekEnd, totalWorkers, totalHours, imagePath, createdAt) VALUES (?, ?, ?, ?, ?, ?)"
    )
    .run(weekStart, weekEnd, stats.totalWorkers, stats.totalHours, publicPath, generatedAt);

  return {
    stats,
    imagePath: publicPath,
    generatedAt
  };
}

const TIME_ZONE = "Australia/Sydney";
const BRISBANE_TIME_ZONE = "Australia/Brisbane";

export function nowIso() {
  return new Date().toISOString();
}

export function toSydneyDate(value = new Date()) {
  const date = value instanceof Date ? value : new Date(value);
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(date);
}

export function toBrisbaneDate(value = new Date()) {
  const date = value instanceof Date ? value : new Date(value);
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: BRISBANE_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(date);
}

export function formatSydneyDateTime(value) {
  if (!value) return "";
  return new Intl.DateTimeFormat("en-AU", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  }).format(new Date(value));
}

export function formatSydneyTime(value = new Date()) {
  return new Intl.DateTimeFormat("en-AU", {
    timeZone: TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  }).format(value instanceof Date ? value : new Date(value));
}

export function hoursBetween(startIso, endIso) {
  if (!startIso || !endIso) return null;
  const diff = new Date(endIso).getTime() - new Date(startIso).getTime();
  if (!Number.isFinite(diff) || diff < 0) return null;
  return Math.round((diff / 36_000) ) / 100;
}

export function calculateBillableHours(startIso, endIso) {
  if (!startIso || !endIso) return null;
  const diffMs = new Date(endIso).getTime() - new Date(startIso).getTime();
  if (!Number.isFinite(diffMs) || diffMs <= 0) return null;
  const actualMinutes = Math.ceil(diffMs / 60000);
  const billableMinutes = Math.ceil(Math.max(actualMinutes - 1, 1) / 15) * 15;
  return Number((billableMinutes / 60).toFixed(2));
}

export function sydneyLocalToIso(value) {
  if (!value) return "";
  if (String(value).endsWith("Z") || /[+-]\d{2}:\d{2}$/.test(String(value))) {
    return new Date(value).toISOString();
  }
  const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  if (!match) return new Date(value).toISOString();
  const [, y, m, d, hh, mm] = match.map(Number);
  const desiredUtc = Date.UTC(y, m - 1, d, hh, mm);
  const guess = new Date(desiredUtc);
  const parts = new Intl.DateTimeFormat("en-AU", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).formatToParts(guess);
  const actualUtc = Date.UTC(
    Number(parts.find((p) => p.type === "year").value),
    Number(parts.find((p) => p.type === "month").value) - 1,
    Number(parts.find((p) => p.type === "day").value),
    Number(parts.find((p) => p.type === "hour").value),
    Number(parts.find((p) => p.type === "minute").value)
  );
  return new Date(desiredUtc - (actualUtc - desiredUtc)).toISOString();
}

export function getWeekRange(dateInput = new Date()) {
  const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
  const parts = new Intl.DateTimeFormat("en-AU", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short"
  }).formatToParts(date);
  const year = Number(parts.find((p) => p.type === "year").value);
  const month = Number(parts.find((p) => p.type === "month").value);
  const day = Number(parts.find((p) => p.type === "day").value);
  const weekday = parts.find((p) => p.type === "weekday").value;
  const dayIndex = { Mon: 0, Tue: 1, Wed: 2, Thu: 3, Fri: 4, Sat: 5, Sun: 6 }[weekday];
  const utcNoon = Date.UTC(year, month - 1, day, 12);
  const start = new Date(utcNoon - dayIndex * 86400000);
  const end = new Date(start.getTime() + 6 * 86400000);
  return {
    weekStart: toSydneyDate(start),
    weekEnd: toSydneyDate(end)
  };
}

export function getBrisbaneWeekRange(dateInput = new Date()) {
  const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
  const parts = new Intl.DateTimeFormat("en-AU", {
    timeZone: BRISBANE_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short"
  }).formatToParts(date);
  const year = Number(parts.find((p) => p.type === "year").value);
  const month = Number(parts.find((p) => p.type === "month").value);
  const day = Number(parts.find((p) => p.type === "day").value);
  const weekday = parts.find((p) => p.type === "weekday").value;
  const dayIndex = { Mon: 0, Tue: 1, Wed: 2, Thu: 3, Fri: 4, Sat: 5, Sun: 6 }[weekday];
  const utcNoon = Date.UTC(year, month - 1, day, 12);
  const start = new Date(utcNoon - dayIndex * 86400000);
  const end = new Date(start.getTime() + 6 * 86400000);
  return {
    weekStart: toBrisbaneDate(start),
    weekEnd: toBrisbaneDate(end)
  };
}

export function weekNumber(dateString) {
  const date = new Date(`${dateString}T12:00:00Z`);
  const first = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const days = Math.floor((date - first) / 86400000);
  return Math.ceil((days + first.getUTCDay() + 1) / 7);
}

export function dateToDisplay(dateString) {
  return dateString ? dateString.replaceAll("-", ".") : "";
}

export { TIME_ZONE, BRISBANE_TIME_ZONE };

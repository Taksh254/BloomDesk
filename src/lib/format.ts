const INDIA_TZ = "Asia/Kolkata";

/** Today's date in the school's time zone, as YYYY-MM-DD. */
export function todayISO(timeZone = INDIA_TZ) {
  return new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(
    new Date(),
  );
}

export function isISODate(value: string | undefined | null): value is string {
  return Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value)));
}

/** "Mon, 6 Oct" */
export function formatDay(iso: string) {
  return new Intl.DateTimeFormat("en-IN", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" }).format(
    new Date(`${iso}T00:00:00Z`),
  );
}

/** "6 Oct 2026" */
export function formatDate(iso: string) {
  return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(
    new Date(`${iso}T00:00:00Z`),
  );
}

export function shiftDay(iso: string, days: number) {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Age as "3 y 4 m" from a date of birth. */
export function formatAge(dob: string | null, today = todayISO()) {
  if (!dob) return "";
  const [by, bm, bd] = dob.split("-").map(Number);
  const [ty, tm, td] = today.split("-").map(Number);
  let months = (ty - by) * 12 + (tm - bm);
  if (td < bd) months -= 1;
  if (months < 0) return "";
  const y = Math.floor(months / 12);
  const m = months % 12;
  return y ? `${y} y ${m} m` : `${m} m`;
}

export function formatPhone(phone: string | null) {
  if (!phone) return "";
  return `+91 ${phone.slice(0, 5)} ${phone.slice(5)}`;
}

/** Greeting by time of day in India. */
export function greeting(timeZone = INDIA_TZ) {
  const hour = Number(new Intl.DateTimeFormat("en-GB", { hour: "numeric", hour12: false, timeZone }).format(new Date()));
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("");
}

import "server-only";
import { db } from "@/lib/db";
import { dateToDay, dayToDate } from "@/lib/format";
import type { AttendanceRow, Child, SchoolClass } from "@/lib/types";

// Every function takes the school id from the session (never from the browser)
// and filters by it, so another school's id simply finds nothing.

const CLASS_SELECT = { id: true, schoolId: true, name: true, level: true, capacity: true, sortOrder: true } as const;

const CHILD_SELECT = {
  id: true,
  schoolId: true,
  classId: true,
  fullName: true,
  dateOfBirth: true,
  gender: true,
  parentName: true,
  parentPhone: true,
  joinedOn: true,
  status: true,
  notes: true,
} as const;

const ATTENDANCE_SELECT = { childId: true, date: true, status: true, classId: true } as const;

function toChild<T extends { dateOfBirth: Date | null; joinedOn: Date }>(row: T) {
  return { ...row, dateOfBirth: row.dateOfBirth ? dateToDay(row.dateOfBirth) : null, joinedOn: dateToDay(row.joinedOn) };
}

function toAttendance<T extends { date: Date }>(row: T) {
  return { ...row, date: dateToDay(row.date) };
}

export async function getClasses(schoolId: string): Promise<SchoolClass[]> {
  return db.schoolClass.findMany({
    where: { schoolId },
    select: CLASS_SELECT,
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
}

export async function getClass(schoolId: string, id: string): Promise<SchoolClass | null> {
  if (!isUuid(id)) return null;
  return db.schoolClass.findFirst({ where: { id, schoolId }, select: CLASS_SELECT });
}

export async function getChildren(
  schoolId: string,
  opts: { classId?: string | null; status?: "active" | "left" | "all" } = {},
): Promise<Child[]> {
  const status = opts.status ?? "active";
  const rows = await db.child.findMany({
    where: {
      schoolId,
      ...(status === "all" ? {} : { status }),
      ...(opts.classId === undefined ? {} : { classId: opts.classId }),
    },
    select: CHILD_SELECT,
    orderBy: { fullName: "asc" },
  });
  return rows.map(toChild);
}

export async function getChild(schoolId: string, id: string): Promise<Child | null> {
  if (!isUuid(id)) return null;
  const row = await db.child.findFirst({ where: { id, schoolId }, select: CHILD_SELECT });
  return row ? toChild(row) : null;
}

export async function getAttendance(schoolId: string, date: string): Promise<AttendanceRow[]> {
  const rows = await db.attendance.findMany({ where: { schoolId, date: dayToDate(date) }, select: ATTENDANCE_SELECT });
  return rows.map(toAttendance);
}

export async function getChildAttendance(schoolId: string, childId: string, from: string): Promise<AttendanceRow[]> {
  const rows = await db.attendance.findMany({
    where: { schoolId, childId, date: { gte: dayToDate(from) } },
    select: ATTENDANCE_SELECT,
    orderBy: { date: "desc" },
  });
  return rows.map(toAttendance);
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Ids from URLs and forms are checked first, because PostgreSQL rejects a malformed uuid with an error. */
export function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_RE.test(value);
}

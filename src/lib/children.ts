import "server-only";
import { db } from "@/lib/db";
import { isUuid } from "@/lib/data";
import { dayToDate } from "@/lib/format";
import type { ChildStatus, Gender } from "@/lib/types";

export type ChildValues = {
  fullName: string;
  dateOfBirth: string | null;
  gender: Gender | null;
  classId: string | null;
  parentName: string | null;
  parentPhone: string | null;
  joinedOn: string;
  notes: string | null;
};

/** True when the class id is empty or one of this school's classes. */
export async function classBelongsToSchool(schoolId: string, classId: string | null) {
  if (classId === null) return true;
  if (!isUuid(classId)) return false;
  return (await db.schoolClass.count({ where: { id: classId, schoolId } })) === 1;
}

function toData(v: ChildValues) {
  return {
    ...v,
    dateOfBirth: v.dateOfBirth ? dayToDate(v.dateOfBirth) : null,
    joinedOn: dayToDate(v.joinedOn),
  };
}

export async function insertChild(schoolId: string, values: ChildValues) {
  return db.child.create({ data: { ...toData(values), schoolId }, select: { id: true } });
}

/** Returns false when the child isn't in this school. */
export async function updateChild(schoolId: string, id: string, values: ChildValues) {
  if (!isUuid(id)) return false;
  const { count } = await db.child.updateMany({ where: { id, schoolId }, data: toData(values) });
  return count === 1;
}

export async function setChildStatus(schoolId: string, id: string, status: ChildStatus) {
  if (!isUuid(id)) return false;
  const { count } = await db.child.updateMany({ where: { id, schoolId }, data: { status } });
  return count === 1;
}

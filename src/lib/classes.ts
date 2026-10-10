import "server-only";
import { db } from "@/lib/db";
import { isUuid } from "@/lib/data";
import { Prisma } from "@/generated/prisma/client";
import type { ClassLevel } from "@/lib/types";

export type ClassValues = { name: string; level: ClassLevel; capacity: number | null };

export type ClassWriteResult = { ok: true } | { ok: false; reason: "duplicate" | "not_found" };

function isDuplicateName(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

/** Adds a class at the end of the school's list. */
export async function insertClass(schoolId: string, values: ClassValues): Promise<ClassWriteResult> {
  const last = await db.schoolClass.aggregate({ where: { schoolId }, _max: { sortOrder: true } });
  try {
    await db.schoolClass.create({ data: { ...values, schoolId, sortOrder: (last._max.sortOrder ?? 0) + 1 } });
    return { ok: true };
  } catch (error) {
    if (isDuplicateName(error)) return { ok: false, reason: "duplicate" };
    throw error;
  }
}

export async function updateClass(schoolId: string, id: string, values: ClassValues): Promise<ClassWriteResult> {
  if (!isUuid(id)) return { ok: false, reason: "not_found" };
  try {
    const { count } = await db.schoolClass.updateMany({ where: { id, schoolId }, data: values });
    return count === 1 ? { ok: true } : { ok: false, reason: "not_found" };
  } catch (error) {
    if (isDuplicateName(error)) return { ok: false, reason: "duplicate" };
    throw error;
  }
}

/** Deletes a class. Its children stay in the school with no class. */
export async function deleteClass(schoolId: string, id: string) {
  if (!isUuid(id)) return false;
  const { count } = await db.schoolClass.deleteMany({ where: { id, schoolId } });
  return count === 1;
}

import { randomUUID } from "node:crypto";
import { db } from "@/lib/db";
import { createSchool } from "@/lib/schools";

/** A throwaway user with their own school (and its four default classes). */
export async function makeSchool(label: string) {
  const user = await db.user.create({
    data: { email: `test-${randomUUID()}@example.test`, name: `${label} Owner`, passwordHash: "x" },
  });
  const schoolId = await createSchool({ userId: user.id, name: `${label} Test School` });
  const classes = await db.schoolClass.findMany({ where: { schoolId }, orderBy: { sortOrder: "asc" } });
  return { userId: user.id, schoolId, classes };
}

export async function removeSchools(...schools: { userId: string; schoolId: string }[]) {
  await db.school.deleteMany({ where: { id: { in: schools.map((s) => s.schoolId) } } });
  await db.user.deleteMany({ where: { id: { in: schools.map((s) => s.userId) } } });
}

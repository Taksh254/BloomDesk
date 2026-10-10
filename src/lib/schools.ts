import "server-only";
import { db } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";

export const DEFAULT_CLASSES = [
  { name: "Playgroup", level: "playgroup", sortOrder: 1 },
  { name: "Nursery", level: "nursery", sortOrder: 2 },
  { name: "LKG", level: "lkg", sortOrder: 3 },
  { name: "UKG", level: "ukg", sortOrder: 4 },
] as const;

type NewSchool = {
  userId: string;
  name: string;
  city?: string | null;
  ownerName?: string | null;
  addDefaultClasses?: boolean;
};

/**
 * Creates a school, makes the user its owner and (by default) adds Playgroup,
 * Nursery, LKG and UKG, all in one transaction. Pass `tx` to join a larger one.
 */
export async function createSchool(input: NewSchool, tx?: Prisma.TransactionClient) {
  const run = async (t: Prisma.TransactionClient) => {
    const school = await t.school.create({
      data: { name: input.name.trim(), city: input.city?.trim() || null, createdById: input.userId },
      select: { id: true },
    });
    await t.schoolMember.create({
      data: { schoolId: school.id, userId: input.userId, role: "owner", fullName: input.ownerName?.trim() || null },
    });
    if (input.addDefaultClasses ?? true) {
      await t.schoolClass.createMany({ data: DEFAULT_CLASSES.map((c) => ({ ...c, schoolId: school.id })) });
    }
    return school.id;
  };
  return tx ? run(tx) : db.$transaction(run);
}

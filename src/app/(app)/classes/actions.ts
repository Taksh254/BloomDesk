"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { canManage, requireSchool } from "@/lib/session";
import { keepValues, str, type FormState } from "@/lib/form";
import * as classes from "@/lib/classes";
import { CLASS_LEVELS, type ClassLevel } from "@/lib/types";

function readClass(formData: FormData) {
  const name = str(formData, "name");
  const level = str(formData, "level") as ClassLevel;
  const capacityRaw = str(formData, "capacity");
  const capacity = capacityRaw ? Number(capacityRaw) : null;

  const fieldErrors: Record<string, string> = {};
  if (!name) fieldErrors.name = "Give the class a name, like Nursery A.";
  if (name.length > 60) fieldErrors.name = "Keep the name under 60 characters.";
  if (!CLASS_LEVELS.some((l) => l.value === level)) fieldErrors.level = "Pick a level.";
  if (capacity !== null && (!Number.isInteger(capacity) || capacity < 1 || capacity > 500))
    fieldErrors.capacity = "Enter a number between 1 and 500, or leave it empty.";
  return { values: { name, level, capacity }, fieldErrors };
}

const DUPLICATE = { name: "You already have a class with this name." };

export async function addClass(_prev: FormState, formData: FormData): Promise<FormState> {
  const session = await requireSchool();
  if (!canManage(session.role)) return { error: "Only the owner or an admin can add classes." };

  const { values, fieldErrors } = readClass(formData);
  if (Object.keys(fieldErrors).length) return { fieldErrors, values: keepValues(formData) };

  let result: classes.ClassWriteResult;
  try {
    result = await classes.insertClass(session.school.id, values);
  } catch {
    return { error: "Couldn't add the class. Try again.", values: keepValues(formData) };
  }
  if (!result.ok) return { fieldErrors: DUPLICATE, values: keepValues(formData) };

  revalidatePath("/classes");
  return { message: `${values.name} added.` };
}

export async function updateClass(id: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const session = await requireSchool();
  if (!canManage(session.role)) return { error: "Only the owner or an admin can edit classes." };

  const { values, fieldErrors } = readClass(formData);
  if (Object.keys(fieldErrors).length) return { fieldErrors, values: keepValues(formData) };

  let result: classes.ClassWriteResult;
  try {
    result = await classes.updateClass(session.school.id, id, values);
  } catch {
    return { error: "Couldn't save the class. Try again.", values: keepValues(formData) };
  }
  if (!result.ok) {
    return result.reason === "duplicate"
      ? { fieldErrors: DUPLICATE, values: keepValues(formData) }
      : { error: "This class isn't in your school any more." };
  }

  revalidatePath("/classes");
  revalidatePath(`/classes/${id}`);
  return { message: "Saved." };
}

export async function deleteClass(id: string) {
  const session = await requireSchool();
  if (!canManage(session.role)) return;

  await classes.deleteClass(session.school.id, id);
  revalidatePath("/classes");
  redirect("/classes");
}

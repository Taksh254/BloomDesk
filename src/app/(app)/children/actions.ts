"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { canManage, requireSchool } from "@/lib/session";
import { isISODate, todayISO } from "@/lib/format";
import { keepValues, normaliseMobile, str, type FormState } from "@/lib/form";
import * as children from "@/lib/children";
import type { ChildValues } from "@/lib/children";
import type { Gender } from "@/lib/types";

const GENDERS: Gender[] = ["girl", "boy", "other"];

async function readChild(schoolId: string, formData: FormData, today: string) {
  const fullName = str(formData, "full_name");
  const dateOfBirth = str(formData, "date_of_birth") || null;
  const gender = (str(formData, "gender") || null) as Gender | null;
  const classId = str(formData, "class_id") || null;
  const parentName = str(formData, "parent_name") || null;
  const phoneRaw = str(formData, "parent_phone");
  const parentPhone = phoneRaw ? normaliseMobile(phoneRaw) : null;
  const joinedOn = str(formData, "joined_on") || today;
  const notes = str(formData, "notes") || null;

  const fieldErrors: Record<string, string> = {};
  if (!fullName) fieldErrors.full_name = "Enter the child's name.";
  if (fullName.length > 120) fieldErrors.full_name = "Keep the name under 120 characters.";
  if (dateOfBirth && (!isISODate(dateOfBirth) || dateOfBirth > today)) fieldErrors.date_of_birth = "Pick a date of birth in the past.";
  if (gender && !GENDERS.includes(gender)) fieldErrors.gender = "Pick girl, boy or other.";
  if (phoneRaw && !parentPhone) fieldErrors.parent_phone = "Enter a 10-digit mobile number.";
  if (!isISODate(joinedOn)) fieldErrors.joined_on = "Pick the date they joined.";
  if (!(await children.classBelongsToSchool(schoolId, classId))) fieldErrors.class_id = "Pick one of your classes.";

  const values: ChildValues = { fullName, dateOfBirth, gender, classId, parentName, parentPhone, joinedOn, notes };
  return { values, fieldErrors };
}

export async function addChild(_prev: FormState, formData: FormData): Promise<FormState> {
  const session = await requireSchool();
  if (!canManage(session.role)) return { error: "Only the owner or an admin can add children." };

  const { values, fieldErrors } = await readChild(session.school.id, formData, todayISO(session.school.timezone));
  if (Object.keys(fieldErrors).length) return { fieldErrors, values: keepValues(formData) };

  try {
    await children.insertChild(session.school.id, values);
  } catch {
    return { error: "Couldn't add the child. Try again.", values: keepValues(formData) };
  }

  revalidatePath("/children");
  if (formData.get("intent") === "another") {
    return { message: `${values.fullName} added. Add the next child.`, values: { class_id: values.classId ?? "" } };
  }
  redirect(values.classId ? `/children?class=${values.classId}` : "/children");
}

export async function updateChild(id: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const session = await requireSchool();
  if (!canManage(session.role)) return { error: "Only the owner or an admin can edit children." };

  const { values, fieldErrors } = await readChild(session.school.id, formData, todayISO(session.school.timezone));
  if (Object.keys(fieldErrors).length) return { fieldErrors, values: keepValues(formData) };

  let found: boolean;
  try {
    found = await children.updateChild(session.school.id, id, values);
  } catch {
    return { error: "Couldn't save. Try again.", values: keepValues(formData) };
  }
  if (!found) return { error: "This child isn't in your school any more." };

  revalidatePath("/children");
  revalidatePath(`/children/${id}`);
  return { message: "Saved." };
}

export async function setChildStatus(id: string, status: "active" | "left") {
  const session = await requireSchool();
  if (!canManage(session.role)) return;
  await children.setChildStatus(session.school.id, id, status === "left" ? "left" : "active");
  revalidatePath("/children");
  revalidatePath(`/children/${id}`);
}

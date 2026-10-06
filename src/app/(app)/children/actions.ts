"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { canManage, requireSchool } from "@/lib/session";
import { isISODate, todayISO } from "@/lib/format";
import { keepValues, normaliseMobile, str, type FormState } from "@/lib/form";

function readChild(formData: FormData, today: string) {
  const full_name = str(formData, "full_name");
  const date_of_birth = str(formData, "date_of_birth") || null;
  const gender = str(formData, "gender") || null;
  const class_id = str(formData, "class_id") || null;
  const parent_name = str(formData, "parent_name") || null;
  const phoneRaw = str(formData, "parent_phone");
  const parent_phone = phoneRaw ? normaliseMobile(phoneRaw) : null;
  const joined_on = str(formData, "joined_on") || today;
  const notes = str(formData, "notes") || null;

  const fieldErrors: Record<string, string> = {};
  if (!full_name) fieldErrors.full_name = "Enter the child's name.";
  if (date_of_birth && (!isISODate(date_of_birth) || date_of_birth > today)) fieldErrors.date_of_birth = "Pick a date of birth in the past.";
  if (gender && !["girl", "boy", "other"].includes(gender)) fieldErrors.gender = "Pick girl, boy or other.";
  if (phoneRaw && !parent_phone) fieldErrors.parent_phone = "Enter a 10-digit mobile number.";
  if (!isISODate(joined_on)) fieldErrors.joined_on = "Pick the date they joined.";

  return { values: { full_name, date_of_birth, gender, class_id, parent_name, parent_phone, joined_on, notes }, fieldErrors };
}

export async function addChild(_prev: FormState, formData: FormData): Promise<FormState> {
  const session = await requireSchool();
  if (!canManage(session.role)) return { error: "Only the owner or an admin can add children." };

  const { values, fieldErrors } = readChild(formData, todayISO(session.school.timezone));
  if (Object.keys(fieldErrors).length) return { fieldErrors, values: keepValues(formData) };

  const supabase = await createClient();
  const { error } = await supabase.from("children").insert({ ...values, school_id: session.school.id });
  if (error) return { error: "Couldn't add the child. Check the class and try again.", values: keepValues(formData) };

  revalidatePath("/children");
  if (formData.get("intent") === "another") {
    return { message: `${values.full_name} added. Add the next child.`, values: { class_id: values.class_id ?? "" } };
  }
  redirect(values.class_id ? `/children?class=${values.class_id}` : "/children");
}

export async function updateChild(id: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const session = await requireSchool();
  if (!canManage(session.role)) return { error: "Only the owner or an admin can edit children." };

  const { values, fieldErrors } = readChild(formData, todayISO(session.school.timezone));
  if (Object.keys(fieldErrors).length) return { fieldErrors, values: keepValues(formData) };

  const supabase = await createClient();
  const { error } = await supabase.from("children").update(values).eq("id", id).eq("school_id", session.school.id);
  if (error) return { error: "Couldn't save. Try again.", values: keepValues(formData) };

  revalidatePath("/children");
  revalidatePath(`/children/${id}`);
  return { message: "Saved." };
}

export async function setChildStatus(id: string, status: "active" | "left") {
  const session = await requireSchool();
  if (!canManage(session.role)) return;
  const supabase = await createClient();
  await supabase.from("children").update({ status }).eq("id", id).eq("school_id", session.school.id);
  revalidatePath("/children");
  revalidatePath(`/children/${id}`);
}

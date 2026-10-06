"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { canManage, requireSchool } from "@/lib/session";
import { keepValues, str, type FormState } from "@/lib/form";
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

function friendly(error: { code?: string; message: string }) {
  if (error.code === "23505") return { name: "You already have a class with this name." };
  return null;
}

export async function addClass(_prev: FormState, formData: FormData): Promise<FormState> {
  const session = await requireSchool();
  if (!canManage(session.role)) return { error: "Only the owner or an admin can add classes." };

  const { values, fieldErrors } = readClass(formData);
  if (Object.keys(fieldErrors).length) return { fieldErrors, values: keepValues(formData) };

  const supabase = await createClient();
  const { data: last } = await supabase
    .from("classes")
    .select("sort_order")
    .eq("school_id", session.school.id)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { error } = await supabase
    .from("classes")
    .insert({ ...values, school_id: session.school.id, sort_order: (last?.sort_order ?? 0) + 1 });
  if (error) {
    const fe = friendly(error);
    return fe ? { fieldErrors: fe, values: keepValues(formData) } : { error: "Couldn't add the class. Try again.", values: keepValues(formData) };
  }

  revalidatePath("/classes");
  return { message: `${values.name} added.` };
}

export async function updateClass(id: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const session = await requireSchool();
  if (!canManage(session.role)) return { error: "Only the owner or an admin can edit classes." };

  const { values, fieldErrors } = readClass(formData);
  if (Object.keys(fieldErrors).length) return { fieldErrors, values: keepValues(formData) };

  const supabase = await createClient();
  const { error } = await supabase.from("classes").update(values).eq("id", id).eq("school_id", session.school.id);
  if (error) {
    const fe = friendly(error);
    return fe ? { fieldErrors: fe, values: keepValues(formData) } : { error: "Couldn't save the class. Try again.", values: keepValues(formData) };
  }

  revalidatePath("/classes");
  revalidatePath(`/classes/${id}`);
  return { message: "Saved." };
}

export async function deleteClass(id: string) {
  const session = await requireSchool();
  if (!canManage(session.role)) return;

  const supabase = await createClient();
  await supabase.from("classes").delete().eq("id", id).eq("school_id", session.school.id);
  revalidatePath("/classes");
  redirect("/classes");
}

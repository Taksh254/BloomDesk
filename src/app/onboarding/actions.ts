"use server";

import { redirect } from "next/navigation";
import { getSession, requireUser } from "@/lib/session";
import { createSchool as createSchoolFor } from "@/lib/schools";
import { keepValues, str, type FormState } from "@/lib/form";

export async function createSchool(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const { membership } = await getSession();
  if (membership) redirect("/today");

  const name = str(formData, "school_name");
  const city = str(formData, "city");
  const ownerName = str(formData, "full_name");
  const addDefaultClasses = formData.get("default_classes") === "on";
  const values = keepValues(formData);

  if (name.length < 2) return { fieldErrors: { school_name: "Enter your school's name." }, values };
  if (name.length > 120) return { fieldErrors: { school_name: "Keep the school name under 120 characters." }, values };

  try {
    await createSchoolFor({ userId: user.id, name, city, ownerName: ownerName || user.name, addDefaultClasses });
  } catch {
    return { error: "We couldn't create your school. Please try again.", values };
  }

  redirect("/today?welcome=1");
}

"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { keepValues, str, type FormState } from "@/lib/form";

export async function createSchool(_prev: FormState, formData: FormData): Promise<FormState> {
  const name = str(formData, "school_name");
  const city = str(formData, "city");
  const ownerName = str(formData, "full_name");
  const addClasses = formData.get("default_classes") === "on";
  const values = keepValues(formData);

  if (name.length < 2) return { fieldErrors: { school_name: "Enter your school's name." }, values };

  const supabase = await createClient();
  const { error } = await supabase.rpc("create_school", {
    p_name: name,
    p_city: city || null,
    p_owner_name: ownerName || null,
    p_add_default_classes: addClasses,
  });
  if (error) return { error: "We couldn't create your school. Please try again.", values };

  redirect("/today?welcome=1");
}

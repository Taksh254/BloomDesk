"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { keepValues, safeNext, str, type FormState } from "@/lib/form";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function signIn(_prev: FormState, formData: FormData): Promise<FormState> {
  const email = str(formData, "email").toLowerCase();
  const password = String(formData.get("password") ?? "");
  const values = keepValues(formData);

  const fieldErrors: Record<string, string> = {};
  if (!EMAIL_RE.test(email)) fieldErrors.email = "Enter the email you signed up with.";
  if (!password) fieldErrors.password = "Enter your password.";
  if (Object.keys(fieldErrors).length) return { fieldErrors, values };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    const msg = /confirm/i.test(error.message)
      ? "Please confirm your email first. Check your inbox for the link we sent."
      : "That email and password don't match. Try again, or reset your password.";
    return { error: msg, values };
  }

  redirect(safeNext(str(formData, "next")));
}

export async function signUp(_prev: FormState, formData: FormData): Promise<FormState> {
  const fullName = str(formData, "full_name");
  const schoolName = str(formData, "school_name");
  const city = str(formData, "city");
  const email = str(formData, "email").toLowerCase();
  const password = String(formData.get("password") ?? "");
  const values = keepValues(formData);

  const fieldErrors: Record<string, string> = {};
  if (fullName.length < 2) fieldErrors.full_name = "Enter your name.";
  if (schoolName.length < 2) fieldErrors.school_name = "Enter your school's name.";
  if (!EMAIL_RE.test(email)) fieldErrors.email = "Enter a valid email, like name@school.in.";
  if (password.length < 8) fieldErrors.password = "Use at least 8 characters.";
  if (Object.keys(fieldErrors).length) return { fieldErrors, values };

  const origin = await getOrigin();
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName, school_name: schoolName, city },
      emailRedirectTo: `${origin}/auth/callback?next=/onboarding`,
    },
  });
  if (error) {
    const msg = /registered|exists/i.test(error.message)
      ? "An account with this email already exists. Sign in instead."
      : error.message;
    return { error: msg, values };
  }

  // Email confirmation is off: we're signed in already, go set up the school.
  if (data.session) redirect("/onboarding");

  return {
    message: `We've sent a confirmation link to ${email}. Open it on this device to finish setting up ${schoolName}.`,
    values,
  };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

async function getOrigin() {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return process.env.NEXT_PUBLIC_SITE_URL ?? `${proto}://${host}`;
}

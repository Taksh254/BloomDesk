"use client";

import { useActionState } from "react";
import { Field, FormMessage } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { initialFormState } from "@/lib/form";
import { signUp } from "../actions";

export function SignupForm() {
  const [state, action] = useActionState(signUp, initialFormState);
  const v = state.values ?? {};
  const e = state.fieldErrors ?? {};

  return (
    <form action={action} className="mt-6 grid gap-4" noValidate>
      <FormMessage>{state.error}</FormMessage>
      <Field label="Your name" name="full_name" autoComplete="name" defaultValue={v.full_name} error={e.full_name} required />
      <Field label="School name" name="school_name" placeholder="Little Sprouts Play School" defaultValue={v.school_name} error={e.school_name} required />
      <Field label="City" name="city" autoComplete="address-level2" defaultValue={v.city} optional />
      <Field label="Email" name="email" type="email" autoComplete="email" defaultValue={v.email} error={e.email} required />
      <Field
        label="Password"
        name="password"
        type="password"
        autoComplete="new-password"
        hint="At least 8 characters."
        error={e.password}
        required
      />
      <SubmitButton className="mt-2 w-full" pendingLabel="Creating your account…">
        Create my school
      </SubmitButton>
    </form>
  );
}

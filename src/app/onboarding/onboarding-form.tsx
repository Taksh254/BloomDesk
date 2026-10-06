"use client";

import { useActionState } from "react";
import { Field, FormMessage } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { initialFormState } from "@/lib/form";
import { createSchool } from "./actions";

export function OnboardingForm({ defaults }: { defaults: Record<string, string> }) {
  const [state, action] = useActionState(createSchool, initialFormState);
  const v = { ...defaults, ...state.values };
  return (
    <form action={action} className="mt-6 grid gap-4" noValidate>
      <FormMessage>{state.error}</FormMessage>
      <Field label="Your name" name="full_name" autoComplete="name" defaultValue={v.full_name} />
      <Field label="School name" name="school_name" defaultValue={v.school_name} error={state.fieldErrors?.school_name} required />
      <Field label="City" name="city" defaultValue={v.city} optional />
      <label className="flex min-h-tap items-start gap-3 rounded-xs bg-surface-2 p-3 text-body-sm text-ink">
        <input type="checkbox" name="default_classes" defaultChecked className="mt-1 size-4 accent-[var(--bd-primary)]" />
        <span>
          Add the usual classes for me: Playgroup, Nursery, LKG and UKG.
          <span className="block text-caption text-ink-3">You can rename or remove them later.</span>
        </span>
      </label>
      <SubmitButton className="mt-2 w-full" pendingLabel="Setting up…">
        Open my school
      </SubmitButton>
    </form>
  );
}

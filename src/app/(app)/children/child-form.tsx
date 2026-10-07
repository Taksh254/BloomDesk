"use client";

import { useActionState, useEffect, useRef } from "react";
import { Field, FormMessage, Label, SelectField } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { initialFormState, type FormState } from "@/lib/form";
import type { Child, SchoolClass } from "@/lib/types";

type Props = {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  classes: SchoolClass[];
  child?: Child;
  defaultClassId?: string;
  today: string;
};

export function ChildForm({ action, classes, child, defaultClassId, today }: Props) {
  const [state, formAction] = useActionState(action, initialFormState);
  const firstRef = useRef<HTMLInputElement>(null);
  const isNew = !child;

  const base: Record<string, string> = {
    full_name: child?.fullName ?? "",
    date_of_birth: child?.dateOfBirth ?? "",
    gender: child?.gender ?? "",
    class_id: child?.classId ?? defaultClassId ?? "",
    parent_name: child?.parentName ?? "",
    parent_phone: child?.parentPhone ?? "",
    joined_on: child?.joinedOn ?? today,
    notes: child?.notes ?? "",
  };
  // After "Save and add another" the action returns only the class, so the form starts fresh.
  const v = { ...base, ...state.values };
  const e = state.fieldErrors ?? {};
  // Re-mount inputs whenever the server returns new values, so defaultValue applies.
  const k = JSON.stringify(state);

  useEffect(() => {
    if (state.message && isNew) firstRef.current?.focus();
  }, [state, isNew]);

  return (
    <form action={formAction} noValidate className="grid gap-5" key={k}>
      <FormMessage>{state.error}</FormMessage>
      <FormMessage tone="success">{state.message}</FormMessage>

      <fieldset className="grid gap-4 sm:grid-cols-2">
        <legend className="mb-3 text-h3 text-ink">Child</legend>
        <Field ref={firstRef} label="Full name" name="full_name" defaultValue={v.full_name} error={e.full_name} autoComplete="off" required className="sm:col-span-2" />
        <Field label="Date of birth" name="date_of_birth" type="date" max={today} defaultValue={v.date_of_birth} error={e.date_of_birth} optional />
        <SelectField
          label="Gender"
          name="gender"
          defaultValue={v.gender}
          error={e.gender}
          optional
          options={[
            { value: "", label: "Not set" },
            { value: "girl", label: "Girl" },
            { value: "boy", label: "Boy" },
            { value: "other", label: "Other" },
          ]}
        />
        <SelectField
          label="Class"
          name="class_id"
          defaultValue={v.class_id}
          error={e.class_id}
          options={[{ value: "", label: "No class yet" }, ...classes.map((c) => ({ value: c.id, label: c.name }))]}
        />
        <Field label="Joined on" name="joined_on" type="date" max={today} defaultValue={v.joined_on} error={e.joined_on} />
      </fieldset>

      <fieldset className="grid gap-4 sm:grid-cols-2">
        <legend className="mb-3 text-h3 text-ink">Parent</legend>
        <Field label="Parent's name" name="parent_name" defaultValue={v.parent_name} autoComplete="off" optional />
        <Field
          label="Mobile number"
          name="parent_phone"
          type="tel"
          inputMode="numeric"
          prefix="+91"
          placeholder="98765 43210"
          defaultValue={v.parent_phone}
          error={e.parent_phone}
          hint="Used for WhatsApp updates and the Parent app."
          optional
        />
      </fieldset>

      <div>
        <Label htmlFor="notes" optional>
          Notes
        </Label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          defaultValue={v.notes}
          placeholder="Allergies, pickup person, anything the teacher should know"
          className="w-full rounded-xs border border-border-strong bg-surface px-3 py-2.5 text-body text-ink placeholder:text-ink-3"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <SubmitButton name="intent" value="save">
          {isNew ? "Add child" : "Save changes"}
        </SubmitButton>
        {isNew ? (
          <SubmitButton name="intent" value="another" variant="secondary">
            Save and add another
          </SubmitButton>
        ) : null}
      </div>
    </form>
  );
}

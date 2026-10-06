"use client";

import { useActionState, useEffect, useRef } from "react";
import { Field, FormMessage, SelectField } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { initialFormState, type FormState } from "@/lib/form";
import { CLASS_LEVELS, type SchoolClass } from "@/lib/types";

type Props = {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  initial?: Pick<SchoolClass, "name" | "level" | "capacity">;
  submitLabel: string;
  resetOnSuccess?: boolean;
  layout?: "row" | "stack";
};

export function ClassForm({ action, initial, submitLabel, resetOnSuccess, layout = "stack" }: Props) {
  const [state, formAction] = useActionState(action, initialFormState);
  const formRef = useRef<HTMLFormElement>(null);
  const v = { name: initial?.name ?? "", level: initial?.level ?? "playgroup", capacity: initial?.capacity?.toString() ?? "", ...state.values };
  const e = state.fieldErrors ?? {};

  useEffect(() => {
    if (state.message && resetOnSuccess) formRef.current?.reset();
  }, [state, resetOnSuccess]);

  return (
    <form ref={formRef} action={formAction} noValidate className="grid gap-4">
      <FormMessage>{state.error}</FormMessage>
      <div className={layout === "row" ? "grid items-start gap-4 sm:grid-cols-[1.4fr_1fr_0.8fr_auto]" : "grid gap-4"}>
        <Field label="Class name" name="name" placeholder="Nursery A" defaultValue={v.name} error={e.name} key={`n-${v.name}`} required />
        <SelectField label="Level" name="level" options={CLASS_LEVELS} defaultValue={v.level} error={e.level} key={`l-${v.level}`} />
        <Field label="Seats" name="capacity" type="number" inputMode="numeric" min={1} max={500} defaultValue={v.capacity} error={e.capacity} optional key={`c-${v.capacity}`} />
        <div className={layout === "row" ? "sm:pt-[25px]" : ""}>
          <SubmitButton className="w-full sm:w-auto">{submitLabel}</SubmitButton>
        </div>
      </div>
      <FormMessage tone="success">{state.message}</FormMessage>
    </form>
  );
}

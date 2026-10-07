"use client";

import { useActionState } from "react";
import { Field, FormMessage } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { initialFormState } from "@/lib/form";
import { requestPasswordReset } from "../actions";

export function ForgotPasswordForm() {
  const [state, action] = useActionState(requestPasswordReset, initialFormState);

  if (state.message) {
    return (
      <div className="mt-6">
        <FormMessage tone="success">{state.message}</FormMessage>
        <p className="mt-3 text-body-sm text-ink-2">Can&apos;t find it? Check your spam folder.</p>
      </div>
    );
  }

  return (
    <form action={action} className="mt-6 grid gap-4" noValidate>
      <FormMessage>{state.error}</FormMessage>
      <Field
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        defaultValue={state.values?.email}
        error={state.fieldErrors?.email}
        required
      />
      <SubmitButton className="w-full" pendingLabel="Sending…">
        Send reset link
      </SubmitButton>
    </form>
  );
}

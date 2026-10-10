"use client";

import { useActionState } from "react";
import { Field, FormMessage } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { initialFormState } from "@/lib/form";
import { resetPassword } from "../actions";

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, action] = useActionState(resetPassword, initialFormState);
  return (
    <form action={action} className="mt-6 grid gap-4" noValidate>
      <input type="hidden" name="token" value={token} />
      <FormMessage>{state.error}</FormMessage>
      <Field
        label="New password"
        name="password"
        type="password"
        autoComplete="new-password"
        hint="At least 8 characters."
        error={state.fieldErrors?.password}
        required
      />
      <SubmitButton className="w-full" pendingLabel="Saving…">
        Save and sign in
      </SubmitButton>
    </form>
  );
}

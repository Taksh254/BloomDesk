"use client";

import { useActionState } from "react";
import { Field, FormMessage } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { initialFormState } from "@/lib/form";
import { signIn } from "../actions";

export function LoginForm({ next, linkError }: { next: string; linkError: boolean }) {
  const [state, action] = useActionState(signIn, initialFormState);
  const v = state.values ?? {};
  return (
    <form action={action} className="mt-6 grid gap-4" noValidate>
      <input type="hidden" name="next" value={next} />
      <FormMessage>
        {state.error ?? (linkError ? "That sign-in link has expired or was already used. Sign in below." : undefined)}
      </FormMessage>
      <Field label="Email" name="email" type="email" autoComplete="email" defaultValue={v.email} error={state.fieldErrors?.email} required />
      <Field
        label="Password"
        name="password"
        type="password"
        autoComplete="current-password"
        error={state.fieldErrors?.password}
        required
      />
      <SubmitButton className="mt-2 w-full" pendingLabel="Signing in…">
        Sign in
      </SubmitButton>
    </form>
  );
}

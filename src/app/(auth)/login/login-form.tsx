"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Field, FormMessage } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { initialFormState } from "@/lib/form";
import { signIn } from "../actions";

export function LoginForm({ next }: { next: string }) {
  const [state, action] = useActionState(signIn, initialFormState);
  const v = state.values ?? {};
  return (
    <form action={action} className="mt-6 grid gap-4" noValidate>
      <input type="hidden" name="next" value={next} />
      <FormMessage>{state.error}</FormMessage>
      <Field label="Email" name="email" type="email" autoComplete="email" defaultValue={v.email} error={state.fieldErrors?.email} required />
      <div>
        <Field
          label="Password"
          name="password"
          type="password"
          autoComplete="current-password"
          error={state.fieldErrors?.password}
          required
        />
        <Link href="/forgot-password" className="mt-1.5 inline-flex min-h-tap items-center text-body-sm text-primary hover:underline">
          Forgot your password?
        </Link>
      </div>
      <SubmitButton className="w-full" pendingLabel="Signing in…">
        Sign in
      </SubmitButton>
    </form>
  );
}

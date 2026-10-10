"use client";

import { useActionState } from "react";
import { FormMessage } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { initialFormState } from "@/lib/form";
import { verifyEmail } from "../actions";

export function VerifyEmailForm({ token }: { token: string }) {
  const [state, action] = useActionState(verifyEmail, initialFormState);
  return (
    <form action={action} className="mt-6 grid gap-4">
      <input type="hidden" name="token" value={token} />
      <FormMessage>{state.error}</FormMessage>
      <SubmitButton className="w-full" pendingLabel="Confirming…">
        Yes, confirm my email
      </SubmitButton>
    </form>
  );
}

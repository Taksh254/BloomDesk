"use client";

import { useActionState } from "react";
import { MailCheck } from "lucide-react";
import { initialFormState } from "@/lib/form";
import { SubmitButton } from "@/components/ui/submit-button";
import { resendVerification } from "../(auth)/actions";

export function VerifyBanner({ email }: { email: string }) {
  const [state, action] = useActionState(resendVerification, initialFormState);
  return (
    <div role="status" className="mb-6 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xs bg-info-soft px-3 py-2.5 text-body-sm text-info-ink">
      <MailCheck className="size-4 shrink-0" aria-hidden />
      <span className="min-w-0 flex-1">
        {state.message ?? state.error ?? `Please confirm ${email}. We sent you a link when you signed up.`}
      </span>
      {state.message ? null : (
        <form action={action}>
          <SubmitButton variant="ghost" size="sm" pendingLabel="Sending…">
            Send the link again
          </SubmitButton>
        </form>
      )}
    </div>
  );
}

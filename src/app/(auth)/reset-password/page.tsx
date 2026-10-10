import type { Metadata } from "next";
import { LinkButton } from "@/components/ui/button";
import { peekEmailToken } from "@/lib/auth/email-tokens";
import { ResetPasswordForm } from "./reset-password-form";

export const metadata: Metadata = { title: "Choose a new password" };

export default async function ResetPasswordPage({ searchParams }: PageProps<"/reset-password">) {
  const { token } = await searchParams;
  const value = typeof token === "string" ? token : "";
  const found = await peekEmailToken(value, "reset_password");

  return (
    <div className="rounded-lg bg-surface p-6 shadow-md sm:p-8">
      {found ? (
        <>
          <h1 className="font-display text-h1 text-ink">Choose a new password</h1>
          <p className="mt-2 text-body-sm text-ink-2">For {found.user.email}. You&apos;ll be signed out on your other devices.</p>
          <ResetPasswordForm token={value} />
        </>
      ) : (
        <>
          <h1 className="font-display text-h1 text-ink">This link has expired</h1>
          <p className="mt-2 text-body-sm text-ink-2">
            Reset links work for 1 hour and only once. Ask for a new one and use the latest email.
          </p>
          <LinkButton href="/forgot-password" className="mt-6 w-full">
            Send a new link
          </LinkButton>
        </>
      )}
    </div>
  );
}

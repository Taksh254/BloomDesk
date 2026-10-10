import type { Metadata } from "next";
import { LinkButton } from "@/components/ui/button";
import { peekEmailToken } from "@/lib/auth/email-tokens";
import { VerifyEmailForm } from "./verify-email-form";

export const metadata: Metadata = { title: "Confirm your email" };

// The link only opens this page; confirming takes a tap, so email scanners that
// open links on their own don't use it up.
export default async function VerifyEmailPage({ searchParams }: PageProps<"/verify-email">) {
  const { token, confirmed } = await searchParams;
  if (confirmed) {
    return (
      <div className="rounded-lg bg-surface p-6 shadow-md sm:p-8">
        <h1 className="font-display text-h1 text-ink">Email confirmed</h1>
        <p className="bd-hand mt-1">Thank you!</p>
        <LinkButton href="/today" className="mt-6 w-full">
          Go to BloomDesk
        </LinkButton>
      </div>
    );
  }
  const value = typeof token === "string" ? token : "";
  const found = await peekEmailToken(value, "verify_email");

  return (
    <div className="rounded-lg bg-surface p-6 shadow-md sm:p-8">
      {found ? (
        <>
          <h1 className="font-display text-h1 text-ink">Confirm your email</h1>
          <p className="mt-2 text-body-sm text-ink-2">Is {found.user.email} your email address?</p>
          <VerifyEmailForm token={value} />
        </>
      ) : (
        <>
          <h1 className="font-display text-h1 text-ink">This link has expired</h1>
          <p className="mt-2 text-body-sm text-ink-2">
            Confirmation links work for 24 hours and only once. Sign in and use &quot;Send the link again&quot; for a new one.
          </p>
          <LinkButton href="/today" className="mt-6 w-full">
            Go to BloomDesk
          </LinkButton>
        </>
      )}
    </div>
  );
}

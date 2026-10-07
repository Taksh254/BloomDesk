import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ForgotPasswordForm } from "./forgot-password-form";

export const metadata: Metadata = { title: "Forgot password" };

export default function ForgotPasswordPage() {
  return (
    <div className="rounded-lg bg-surface p-6 shadow-md sm:p-8">
      <h1 className="font-display text-h1 text-ink">Forgot your password?</h1>
      <p className="mt-2 text-body-sm text-ink-2">Enter the email you signed up with and we&apos;ll send you a link to choose a new one.</p>
      <ForgotPasswordForm />
      <Link href="/login" className="mt-6 inline-flex min-h-tap items-center gap-2 text-body-sm text-primary">
        <ArrowLeft className="size-4" aria-hidden /> Back to sign in
      </Link>
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { SignupForm } from "./signup-form";

export const metadata: Metadata = { title: "Set up your school" };

export default function SignupPage() {
  return (
    <div className="rounded-lg bg-surface p-6 shadow-md sm:p-8">
      <h1 className="font-display text-h1 text-ink">Set up your school</h1>
      <p className="mt-2 text-body-sm text-ink-2">Free to start. You can add children and classes in a few minutes.</p>
      <SignupForm />
      <p className="mt-6 text-body-sm text-ink-2">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}

import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession, requireUser } from "@/lib/session";
import { Doodles, Logo } from "@/components/ui/doodles";
import { OnboardingForm } from "./onboarding-form";

export const metadata: Metadata = { title: "Your school" };

// Sign-up creates the school straight away, so this is only for accounts that
// have no school yet.
export default async function OnboardingPage() {
  const user = await requireUser();
  const { membership } = await getSession();
  if (membership) redirect("/today");

  return (
    <div className="bd-paper bd-margin flex min-h-dvh flex-col items-center px-4 py-10 sm:justify-center">
      <div className="w-full max-w-[480px]">
        <div className="mb-6 flex items-center justify-between">
          <Logo />
          <Doodles className="h-10 w-24" />
        </div>
        <div className="rounded-lg bg-surface p-6 shadow-md sm:p-8">
          <h1 className="font-display text-h1 text-ink">Tell us about your school</h1>
          <p className="bd-hand mt-1">One last step and you&apos;re in!</p>
          <OnboardingForm defaults={{ full_name: user.name, school_name: "", city: "" }} />
        </div>
      </div>
    </div>
  );
}

import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { Logo } from "@/components/ui/doodles";

export const metadata: Metadata = { title: "Connect Supabase" };

// Shown only while the Supabase settings are missing, so a fresh checkout explains itself.
export default function SetupPage() {
  if (isSupabaseConfigured) redirect("/login");
  return (
    <div className="bd-paper bd-margin flex min-h-dvh items-center justify-center px-4 py-10">
      <div className="w-full max-w-[560px] rounded-lg bg-surface p-6 shadow-md sm:p-8">
        <Logo />
        <h1 className="mt-6 font-display text-h1 text-ink">Connect a Supabase project</h1>
        <ol className="mt-4 list-decimal space-y-2 pl-5 text-body-sm text-ink-2">
          <li>Create a free project at supabase.com.</li>
          <li>
            Run <code className="rounded-xs bg-surface-2 px-1.5">supabase/migrations/20261006000000_init.sql</code> in its SQL editor.
          </li>
          <li>
            Copy <code className="rounded-xs bg-surface-2 px-1.5">.env.example</code> to{" "}
            <code className="rounded-xs bg-surface-2 px-1.5">.env.local</code> and fill in the project URL and publishable key.
          </li>
          <li>Restart the dev server.</li>
        </ol>
      </div>
    </div>
  );
}

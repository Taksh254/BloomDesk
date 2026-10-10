import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { isDatabaseConfigured } from "@/lib/db";
import { Logo } from "@/components/ui/doodles";

export const metadata: Metadata = { title: "Database not configured" };

// Shown only while DATABASE_URL is missing, so a fresh checkout explains itself.
export default async function SetupPage() {
  // Read the environment at request time, not at build time.
  await connection();
  if (isDatabaseConfigured) redirect("/login");
  const code = "rounded-xs bg-surface-2 px-1.5";
  return (
    <div className="bd-paper bd-margin flex min-h-dvh items-center justify-center px-4 py-10">
      <div className="w-full max-w-[560px] rounded-lg bg-surface p-6 shadow-md sm:p-8">
        <Logo />
        <h1 className="mt-6 font-display text-h1 text-ink">The database isn&apos;t configured</h1>
        <p className="mt-2 text-body-sm text-ink-2">
          BloomDesk needs a PostgreSQL database, and <code className={code}>DATABASE_URL</code> isn&apos;t set.
        </p>
        <ol className="mt-4 list-decimal space-y-2 pl-5 text-body-sm text-ink-2">
          <li>
            Copy <code className={code}>.env.example</code> to <code className={code}>.env</code>.
          </li>
          <li>
            Start a local database with <code className={code}>npm run db:start</code>, or point{" "}
            <code className={code}>DATABASE_URL</code> at any PostgreSQL 15+ database.
          </li>
          <li>
            Create the tables and a demo school with <code className={code}>npm run db:migrate</code> and{" "}
            <code className={code}>npm run db:seed</code>.
          </li>
          <li>Restart the dev server.</li>
        </ol>
      </div>
    </div>
  );
}

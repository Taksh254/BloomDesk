import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { safeNext } from "@/lib/form";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { next } = await searchParams;
  const nextPath = typeof next === "string" ? next : "";
  const { user } = await getSession();
  if (user) redirect(safeNext(nextPath));

  return (
    <div className="rounded-lg bg-surface p-6 shadow-md sm:p-8">
      <h1 className="font-display text-h1 text-ink">Welcome back</h1>
      <p className="bd-hand mt-1">Ready for another happy day?</p>
      <LoginForm next={nextPath} />
      <p className="mt-6 text-body-sm text-ink-2">
        New to BloomDesk?{" "}
        <Link href="/signup" className="font-semibold text-primary hover:underline">
          Set up your school
        </Link>
      </p>
    </div>
  );
}

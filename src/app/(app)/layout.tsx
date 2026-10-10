import { LogOut } from "lucide-react";
import { requireSchool } from "@/lib/session";
import { initials } from "@/lib/format";
import { Crayon } from "@/components/ui/class-crayon";
import { Logo } from "@/components/ui/doodles";
import { signOut } from "../(auth)/actions";
import { SideNav, TabBar } from "./nav";
import { VerifyBanner } from "./verify-banner";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const session = await requireSchool();
  const { school } = session;

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[220px_1fr]">
      <aside className="border-b border-border bg-surface lg:sticky lg:top-0 lg:flex lg:h-dvh lg:flex-col lg:border-r lg:border-b-0">
        <div className="flex items-center justify-between gap-3 px-4 py-3 lg:block lg:pt-4 lg:pb-0">
          <Logo className="text-[20px]" />
          <div className="mt-0 flex items-center gap-3 rounded-sm bg-primary-soft p-2.5 lg:mt-5">
            <span className="grid size-9 shrink-0 place-items-center rounded-xs bg-primary font-display text-[15px] text-on-primary">
              {initials(school.name)}
            </span>
            <span className="hidden min-w-0 sm:block">
              <span className="block truncate text-label text-ink">{school.name}</span>
              {school.city ? <span className="block truncate text-caption text-ink-3">{school.city}</span> : null}
            </span>
          </div>
        </div>
        <div className="hidden px-3 py-3 lg:mt-4 lg:block lg:flex-1">
          <SideNav />
        </div>
        <div className="hidden px-4 pb-4 lg:block">
          <div className="mb-4 flex gap-1.5" aria-hidden>
            <Crayon level="playgroup" />
            <Crayon level="nursery" />
            <Crayon level="lkg" />
            <Crayon level="ukg" />
          </div>
          <p className="truncate text-label text-ink">{session.displayName}</p>
          <p className="truncate text-caption text-ink-3">{session.email}</p>
          <form action={signOut} className="mt-2">
            <button className="-ml-2 inline-flex min-h-tap items-center gap-2 rounded-sm px-2 text-body-sm text-ink-2 hover:bg-surface-2 hover:text-ink">
              <LogOut className="size-4" aria-hidden /> Sign out
            </button>
          </form>
        </div>
      </aside>
      <main className="bd-paper bd-margin min-w-0 pt-6 pr-4 pb-28 pl-8 sm:px-10 lg:py-8">
        <div className="mx-auto max-w-[1080px]">
          {session.emailVerified ? null : <VerifyBanner email={session.email} />}
          {children}
        </div>
        <form action={signOut} className="mt-10 lg:hidden">
          <button className="inline-flex min-h-tap items-center gap-2 text-body-sm text-ink-2">
            <LogOut className="size-4" aria-hidden /> Sign out
          </button>
        </form>
      </main>
      <TabBar />
    </div>
  );
}

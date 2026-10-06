"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ClipboardCheck, Shapes, Sun, Users } from "lucide-react";

const NAV = [
  { href: "/today", label: "Today", icon: Sun },
  { href: "/attendance", label: "Attendance", icon: ClipboardCheck },
  { href: "/children", label: "Children", icon: Users },
  { href: "/classes", label: "Classes", icon: Shapes },
] as const;

export function SideNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Main" className="flex flex-col gap-1">
      {NAV.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`flex min-h-tap shrink-0 items-center gap-3 rounded-sm px-3 text-[15px] font-medium transition-colors ${
              active ? "bg-primary-soft text-primary" : "text-ink-2 hover:bg-surface-2 hover:text-ink"
            }`}
          >
            <Icon className="size-[18px]" strokeWidth={1.75} aria-hidden />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

/** Bottom tab bar for phones (the sidebar shows on large screens). */
export function TabBar() {
  const pathname = usePathname();
  // The wrapper carries lg:hidden because .bd-tabbar's own display rule would override it.
  return (
    <div className="fixed inset-x-0 bottom-0 z-20 lg:hidden">
      <nav aria-label="Main" className="bd-tabbar">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link key={href} href={href} aria-current={active ? "page" : undefined} className="bd-tab">
              <span className="bd-tab-ic">
                <Icon className="size-5" strokeWidth={1.75} aria-hidden />
              </span>
              {label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

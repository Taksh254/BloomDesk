import type { Metadata } from "next";
import Link from "next/link";
import { Search, UserPlus } from "lucide-react";
import { canManage, requireSchool } from "@/lib/session";
import { getChildren, getClasses } from "@/lib/data";
import { formatAge, formatPhone, todayISO } from "@/lib/format";
import { Card, PageHeader } from "@/components/ui/card";
import { ClassName } from "@/components/ui/class-crayon";
import { LinkButton, Button } from "@/components/ui/button";
import { Pill } from "@/components/ui/status-pill";

export const metadata: Metadata = { title: "Children" };

export default async function ChildrenPage({ searchParams }: PageProps<"/children">) {
  const { school, role } = await requireSchool();
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim() : "";
  const classFilter = typeof sp.class === "string" ? sp.class : "";
  const status = sp.status === "left" ? "left" : "active";

  const classes = await getClasses(school.id);
  const all = await getChildren(school.id, {
    status,
    classId: classFilter === "none" ? null : classes.some((c) => c.id === classFilter) ? classFilter : undefined,
  });
  const needle = q.toLowerCase();
  const digits = needle.replace(/\D/g, "");
  const children = needle
    ? all.filter(
        (c) =>
          c.full_name.toLowerCase().includes(needle) ||
          c.parent_name?.toLowerCase().includes(needle) ||
          (digits.length >= 3 && c.parent_phone?.includes(digits)),
      )
    : all;
  const classById = new Map(classes.map((c) => [c.id, c]));
  const today = todayISO(school.timezone);
  const filtered = Boolean(q || classFilter || status === "left");

  return (
    <>
      <PageHeader
        title="Children"
        description={`${children.length} ${status === "left" ? "who left" : "in school"}${filtered && status !== "left" ? " matching your filters" : ""}`}
        actions={
          canManage(role) ? (
            <LinkButton href={classFilter && classFilter !== "none" ? `/children/new?class=${classFilter}` : "/children/new"}>
              <UserPlus aria-hidden /> Add a child
            </LinkButton>
          ) : null
        }
      />

      <form className="mb-4 flex flex-wrap items-end gap-2" role="search">
        <label className="relative min-w-[220px] flex-1">
          <span className="sr-only">Search by child, parent or mobile</span>
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-3" aria-hidden />
          <input
            name="q"
            defaultValue={q}
            placeholder="Search by child, parent or mobile"
            className="min-h-tap w-full rounded-xs border border-border-strong bg-surface pr-3 pl-9 text-body text-ink placeholder:text-ink-3"
          />
        </label>
        <label>
          <span className="sr-only">Class</span>
          <select name="class" defaultValue={classFilter} className="min-h-tap rounded-xs border border-border-strong bg-surface px-3 text-body text-ink">
            <option value="">All classes</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
            <option value="none">No class</option>
          </select>
        </label>
        <label>
          <span className="sr-only">Status</span>
          <select name="status" defaultValue={status} className="min-h-tap rounded-xs border border-border-strong bg-surface px-3 text-body text-ink">
            <option value="active">In school</option>
            <option value="left">Left</option>
          </select>
        </label>
        <Button type="submit" variant="secondary">
          Filter
        </Button>
        {filtered ? (
          <Link href="/children" className="inline-flex min-h-tap items-center px-2 text-body-sm text-primary">
            Clear
          </Link>
        ) : null}
      </form>

      {children.length === 0 ? (
        <div className="bd-feature">
          <p className="text-h3">{filtered ? "No children match" : "No children yet"}</p>
          <p className="mt-1 text-body-sm text-ink-2">
            {filtered ? "Try a different name or class." : "Add each child with their class and a parent's mobile number."}
          </p>
        </div>
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-body-sm">
            <thead>
              <tr className="border-b border-border text-left text-label text-ink-2">
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-5 py-3 font-medium">Class</th>
                <th className="px-5 py-3 font-medium">Parent</th>
                <th className="px-5 py-3 font-medium">Mobile</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {children.map((c) => {
                const cls = c.class_id ? classById.get(c.class_id) : undefined;
                return (
                  <tr key={c.id} className="relative hover:bg-surface-2">
                    <td className="px-5 py-3.5">
                      <Link href={`/children/${c.id}`} className="text-ink after:absolute after:inset-0">
                        {c.full_name}
                      </Link>
                      {c.date_of_birth ? <span className="block text-caption text-ink-3">{formatAge(c.date_of_birth, today)}</span> : null}
                    </td>
                    <td className="px-5 py-3.5">{cls ? <ClassName level={cls.level} name={cls.name} /> : <Pill tone="warning">No class</Pill>}</td>
                    <td className="px-5 py-3.5 text-ink-2">{c.parent_name ?? <span className="text-ink-3">–</span>}</td>
                    <td className="tnum px-5 py-3.5 text-ink-2">{formatPhone(c.parent_phone) || <span className="text-ink-3">–</span>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}
    </>
  );
}

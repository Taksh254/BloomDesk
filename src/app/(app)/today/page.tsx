import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, ClipboardCheck, Shapes, UserPlus } from "lucide-react";
import { requireSchool } from "@/lib/session";
import { getAttendance, getChildren, getClasses } from "@/lib/data";
import { formatDay, greeting, todayISO } from "@/lib/format";
import { Card } from "@/components/ui/card";
import { ClassName } from "@/components/ui/class-crayon";
import { LinkButton } from "@/components/ui/button";
import { Doodles } from "@/components/ui/doodles";

export const metadata: Metadata = { title: "Today" };

export default async function TodayPage({ searchParams }: PageProps<"/today">) {
  const { school, displayName } = await requireSchool();
  const { welcome } = await searchParams;
  const today = todayISO(school.timezone);
  const [classes, children, attendance] = await Promise.all([
    getClasses(school.id),
    getChildren(school.id),
    getAttendance(school.id, today),
  ]);

  const statusByChild = new Map(attendance.map((a) => [a.childId, a.status]));
  const count = (pred: (s: string | undefined) => boolean) => children.filter((c) => pred(statusByChild.get(c.id))).length;
  const present = count((s) => s === "present" || s === "late");
  const absent = count((s) => s === "absent");
  const onLeave = count((s) => s === "leave");
  const notMarked = count((s) => s === undefined);

  const perClass = classes.map((cls) => {
    const kids = children.filter((c) => c.classId === cls.id);
    const marked = kids.filter((c) => statusByChild.has(c.id));
    return {
      cls,
      total: kids.length,
      present: marked.filter((c) => ["present", "late"].includes(statusByChild.get(c.id)!)).length,
      absent: marked.filter((c) => statusByChild.get(c.id) === "absent").length,
      notMarked: kids.length - marked.length,
    };
  });
  const unassigned = children.filter((c) => !c.classId).length;

  const attention: { href: string; text: string; cta: string }[] = [];
  for (const row of perClass) {
    if (row.total > 0 && row.notMarked > 0) {
      attention.push({
        href: `/attendance?class=${row.cls.id}`,
        text: `${row.cls.name}: attendance not taken for ${row.notMarked} of ${row.total} ${row.total === 1 ? "child" : "children"}`,
        cta: "Take attendance",
      });
    }
  }
  if (unassigned > 0) {
    attention.push({
      href: "/children?class=none",
      text: `${unassigned} ${unassigned === 1 ? "child has" : "children have"} no class yet`,
      cta: "Assign a class",
    });
  }

  const firstName = displayName.split(" ")[0];

  return (
    <div className="grid gap-6">
      <section className="bd-feature relative overflow-hidden !p-6">
        <Doodles className="absolute right-2 bottom-1 hidden h-[76px] w-[170px] sm:block" />
        <p className="text-caption text-ink-2">{formatDay(today)}</p>
        <h1 className="mt-1 font-display text-h1">
          {welcome ? `Welcome to BloomDesk, ${firstName}!` : `${greeting(school.timezone)}, ${firstName}`}
        </h1>
        <p className="bd-hand mt-1">
          {children.length === 0 ? "Let's fill your register." : "Have a lovely day at school!"}
        </p>
      </section>

      {children.length === 0 ? (
        <Card className="p-6">
          <h2 className="text-h3 text-ink">Start by adding your children</h2>
          <p className="mt-1 text-body-sm text-ink-2">
            {classes.length > 0
              ? `Your classes are ready (${classes.map((c) => c.name).join(", ")}). Add each child with their parent's mobile number.`
              : "Create your classes first, then add each child with their parent's mobile number."}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {classes.length > 0 ? (
              <LinkButton href="/children/new">
                <UserPlus aria-hidden /> Add a child
              </LinkButton>
            ) : (
              <LinkButton href="/classes">
                <Shapes aria-hidden /> Add a class
              </LinkButton>
            )}
          </div>
        </Card>
      ) : (
        <>
          <section aria-label="Today at a glance" className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <Stat label="Present today" value={present} total={children.length} color="var(--bd-class-lkg)" />
            <Stat label="Absent" value={absent} color="var(--bd-class-playgroup)" />
            <Stat label="On leave" value={onLeave} color="var(--bd-class-ukg)" />
            <Stat label="Not marked yet" value={notMarked} color="var(--bd-accent)" />
          </section>

          <Card>
            <h2 className="px-5 pt-5 font-display text-h2 text-ink">Needs your attention</h2>
            {attention.length === 0 ? (
              <p className="px-5 pt-2 pb-5 text-body-sm text-ink-2">All caught up. Every class has its attendance for today.</p>
            ) : (
              <ul className="mt-2 divide-y divide-border">
                {attention.map((a) => (
                  <li key={a.href}>
                    <Link href={a.href} className="flex min-h-tap items-center justify-between gap-4 px-5 py-3 hover:bg-surface-2">
                      <span className="text-body-sm text-ink">{a.text}</span>
                      <span className="inline-flex shrink-0 items-center gap-1 text-label text-primary">
                        {a.cta} <ChevronRight className="size-4" aria-hidden />
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card className="overflow-x-auto">
            <div className="flex items-center justify-between px-5 pt-5">
              <h2 className="font-display text-h2 text-ink">Classes today</h2>
              <LinkButton href="/attendance" variant="ghost" size="sm">
                <ClipboardCheck aria-hidden /> Attendance
              </LinkButton>
            </div>
            <table className="mt-3 w-full min-w-[520px] text-body-sm">
              <thead>
                <tr className="border-y border-border text-left text-label text-ink-2">
                  <th className="px-5 py-2.5 font-medium">Class</th>
                  <th className="px-5 py-2.5 text-right font-medium">Children</th>
                  <th className="px-5 py-2.5 text-right font-medium">Present</th>
                  <th className="px-5 py-2.5 text-right font-medium">Absent</th>
                  <th className="px-5 py-2.5 text-right font-medium">Not marked</th>
                </tr>
              </thead>
              <tbody className="tnum divide-y divide-border">
                {perClass.map(({ cls, total, present, absent, notMarked }) => (
                  <tr key={cls.id}>
                    <td className="px-5 py-3.5">
                      <Link href={`/attendance?class=${cls.id}`} className="hover:underline">
                        <ClassName level={cls.level} name={cls.name} />
                      </Link>
                    </td>
                    <td className="px-5 py-3.5 text-right">{total}</td>
                    <td className="px-5 py-3.5 text-right">{present}</td>
                    <td className="px-5 py-3.5 text-right">{absent}</td>
                    <td className="px-5 py-3.5 text-right">{notMarked}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </>
      )}
    </div>
  );
}

function Stat({ label, value, total, color }: { label: string; value: number; total?: number; color: string }) {
  return (
    <div className="bd-stat rounded-md border border-border bg-surface p-5" style={{ ["--bd-stat-color" as string]: color }}>
      <p className="text-label text-ink-2">{label}</p>
      <p className="tnum mt-2 font-display text-h1 text-ink">
        {value}
        {total !== undefined ? <span className="text-h3 text-ink-3"> / {total}</span> : null}
      </p>
    </div>
  );
}


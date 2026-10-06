import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft, ChevronRight, UserPlus } from "lucide-react";
import { requireSchool } from "@/lib/session";
import { getAttendance, getChildren, getClasses } from "@/lib/data";
import { formatDay, isISODate, shiftDay, todayISO } from "@/lib/format";
import type { AttendanceStatus } from "@/lib/types";
import { PageHeader } from "@/components/ui/card";
import { Crayon } from "@/components/ui/class-crayon";
import { LinkButton } from "@/components/ui/button";
import { AttendanceSheet } from "./attendance-sheet";
import { DatePicker } from "./date-picker";

export const metadata: Metadata = { title: "Attendance" };

export default async function AttendancePage({ searchParams }: PageProps<"/attendance">) {
  const { school } = await requireSchool();
  const sp = await searchParams;
  const today = todayISO(school.timezone);
  const date = typeof sp.date === "string" && isISODate(sp.date) && sp.date <= today ? sp.date : today;

  const [classes, children, attendance] = await Promise.all([
    getClasses(school.id),
    getChildren(school.id),
    getAttendance(school.id, date),
  ]);

  if (classes.length === 0) {
    return (
      <>
        <PageHeader title="Attendance" />
        <div className="bd-feature">
          <p className="text-h3">Add a class first</p>
          <p className="mt-1 text-body-sm text-ink-2">Attendance is taken class by class.</p>
          <LinkButton href="/classes" className="mt-4">
            Go to classes
          </LinkButton>
        </div>
      </>
    );
  }

  const requested = typeof sp.class === "string" ? classes.find((c) => c.id === sp.class) : undefined;
  const cls = requested ?? classes.find((c) => children.some((k) => k.class_id === c.id)) ?? classes[0];
  const kids = children.filter((k) => k.class_id === cls.id);
  const saved: Record<string, AttendanceStatus> = {};
  for (const a of attendance) if (kids.some((k) => k.id === a.child_id)) saved[a.child_id] = a.status;

  const href = (classId: string, d: string) => `/attendance?class=${classId}${d === today ? "" : `&date=${d}`}`;

  return (
    <>
      <PageHeader title="Attendance" description={date === today ? `Today, ${formatDay(date)}` : formatDay(date)} />

      <nav aria-label="Classes" className="mb-4 flex gap-2 overflow-x-auto pb-1">
        {classes.map((c) => {
          const active = c.id === cls.id;
          const n = children.filter((k) => k.class_id === c.id).length;
          return (
            <Link
              key={c.id}
              href={href(c.id, date)}
              aria-current={active ? "page" : undefined}
              className={`inline-flex min-h-tap shrink-0 items-center gap-2 rounded-pill border px-4 text-label ${
                active ? "border-primary bg-primary-soft text-primary" : "border-border bg-surface text-ink-2 hover:bg-surface-2"
              }`}
            >
              <Crayon level={c.level} />
              {c.name}
              <span className="tnum text-ink-3">{n}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mb-5 flex flex-wrap items-center gap-2">
        <LinkButton href={href(cls.id, shiftDay(date, -1))} variant="secondary" aria-label="Previous day" className="!px-3">
          <ChevronLeft aria-hidden />
        </LinkButton>
        <DatePicker value={date} max={today} classId={cls.id} />
        {date < today ? (
          <>
            <LinkButton href={href(cls.id, shiftDay(date, 1))} variant="secondary" aria-label="Next day" className="!px-3">
              <ChevronRight aria-hidden />
            </LinkButton>
            <LinkButton href={href(cls.id, today)} variant="ghost">
              Back to today
            </LinkButton>
          </>
        ) : null}
      </div>

      {kids.length === 0 ? (
        <div className="bd-feature">
          <p className="text-h3">No children in {cls.name} yet</p>
          <p className="mt-1 text-body-sm text-ink-2">Add children to this class to take attendance.</p>
          <LinkButton href={`/children/new?class=${cls.id}`} className="mt-4">
            <UserPlus aria-hidden /> Add a child
          </LinkButton>
        </div>
      ) : (
        <AttendanceSheet
          key={`${cls.id}:${date}`}
          classId={cls.id}
          date={date}
          saved={saved}
          kids={kids.map((k) => ({ id: k.id, name: k.full_name, caption: k.parent_name ?? "" }))}
        />
      )}
    </>
  );
}

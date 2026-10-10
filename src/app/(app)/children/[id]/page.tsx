import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Phone, RotateCcw, UserMinus } from "lucide-react";
import { canManage, requireSchool } from "@/lib/session";
import { getChild, getChildAttendance, getClasses } from "@/lib/data";
import { formatAge, formatDate, formatDay, formatPhone, shiftDay, todayISO } from "@/lib/format";
import { Card, PageHeader } from "@/components/ui/card";
import { ClassName } from "@/components/ui/class-crayon";
import { AttendancePill, Pill } from "@/components/ui/status-pill";
import { ConfirmSubmit } from "@/components/confirm-submit";
import { SubmitButton } from "@/components/ui/submit-button";
import { ChildForm } from "../child-form";
import { setChildStatus, updateChild } from "../actions";

export const metadata: Metadata = { title: "Child" };

export default async function ChildPage({ params }: PageProps<"/children/[id]">) {
  const { id } = await params;
  const { school, role } = await requireSchool();
  const child = await getChild(school.id, id);
  if (!child) notFound();

  const today = todayISO(school.timezone);
  const [classes, recent] = await Promise.all([getClasses(school.id), getChildAttendance(school.id, child.id, shiftDay(today, -29))]);
  const cls = classes.find((c) => c.id === child.classId);
  const manage = canManage(role);
  const presentDays = recent.filter((r) => r.status === "present" || r.status === "late").length;

  return (
    <>
      <Link href="/children" className="mb-4 inline-flex min-h-tap items-center gap-2 text-body-sm text-primary">
        <ArrowLeft className="size-4" aria-hidden /> All children
      </Link>
      <PageHeader
        title={child.fullName}
        description={[formatAge(child.dateOfBirth, today), `Joined ${formatDate(child.joinedOn)}`].filter(Boolean).join(" · ")}
        actions={child.status === "left" ? <Pill>Left the school</Pill> : cls ? <ClassName level={cls.level} name={cls.name} /> : <Pill tone="warning">No class</Pill>}
      />

      <div className="grid items-start gap-6 lg:grid-cols-[1fr_320px]">
        {manage ? (
          <Card className="p-6">
            <ChildForm action={updateChild.bind(null, child.id)} classes={classes} child={child} today={today} />
          </Card>
        ) : (
          <Card className="p-6 text-body-sm text-ink-2">
            <p>{child.parentName ?? "Parent not added"}</p>
            <p>{formatPhone(child.parentPhone)}</p>
          </Card>
        )}

        <div className="grid gap-6">
          {child.parentPhone ? (
            <Card className="p-5">
              <h2 className="text-h3 text-ink">{child.parentName ?? "Parent"}</h2>
              <a href={`tel:+91${child.parentPhone}`} className="mt-2 inline-flex min-h-tap items-center gap-2 text-body-sm text-primary">
                <Phone className="size-4" aria-hidden /> {formatPhone(child.parentPhone)}
              </a>
            </Card>
          ) : null}

          <Card>
            <div className="px-5 pt-5">
              <h2 className="text-h3 text-ink">Last 30 days</h2>
              <p className="mt-1 text-caption text-ink-3">
                Present {presentDays} of {recent.length} marked {recent.length === 1 ? "day" : "days"}
              </p>
            </div>
            {recent.length === 0 ? (
              <p className="px-5 pt-2 pb-5 text-body-sm text-ink-2">No attendance yet.</p>
            ) : (
              <ul className="mt-3 divide-y divide-border">
                {recent.slice(0, 10).map((r) => (
                  <li key={r.date} className="flex items-center justify-between px-5 py-2.5 text-body-sm">
                    <span className="text-ink-2">{formatDay(r.date)}</span>
                    <AttendancePill status={r.status} />
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {manage ? (
            <form action={setChildStatus.bind(null, child.id, child.status === "active" ? "left" : "active")}>
              {child.status === "active" ? (
                <ConfirmSubmit variant="ghost" size="sm" confirm={`Mark ${child.fullName} as left? They will move out of class lists and attendance.`}>
                  <UserMinus aria-hidden /> Mark as left the school
                </ConfirmSubmit>
              ) : (
                <SubmitButton variant="secondary" size="sm">
                  <RotateCcw aria-hidden /> Re-admit
                </SubmitButton>
              )}
            </form>
          ) : null}
        </div>
      </div>
    </>
  );
}

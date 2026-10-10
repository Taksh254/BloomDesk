import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ClipboardCheck, Trash2, UserPlus } from "lucide-react";
import { canManage, requireSchool } from "@/lib/session";
import { getChildren, getClasses } from "@/lib/data";
import { formatAge, formatPhone } from "@/lib/format";
import { Card, PageHeader } from "@/components/ui/card";
import { LinkButton } from "@/components/ui/button";
import { ConfirmSubmit } from "@/components/confirm-submit";
import { ClassForm } from "../class-form";
import { deleteClass, updateClass } from "../actions";

export const metadata: Metadata = { title: "Class" };

export default async function ClassPage({ params }: PageProps<"/classes/[id]">) {
  const { id } = await params;
  const { school, role } = await requireSchool();
  const classes = await getClasses(school.id);
  const cls = classes.find((c) => c.id === id);
  if (!cls) notFound();
  const children = await getChildren(school.id, { classId: cls.id });
  const manage = canManage(role);

  return (
    <>
      <Link href="/classes" className="mb-4 inline-flex min-h-tap items-center gap-2 text-body-sm text-primary">
        <ArrowLeft className="size-4" aria-hidden /> All classes
      </Link>
      <PageHeader
        title={cls.name}
        description={`${children.length} ${children.length === 1 ? "child" : "children"}${cls.capacity ? ` · ${cls.capacity} seats` : ""}`}
        actions={
          <>
            <LinkButton href={`/attendance?class=${cls.id}`} variant="secondary">
              <ClipboardCheck aria-hidden /> Take attendance
            </LinkButton>
            {manage ? (
              <LinkButton href={`/children/new?class=${cls.id}`}>
                <UserPlus aria-hidden /> Add a child
              </LinkButton>
            ) : null}
          </>
        }
      />

      <div className="grid items-start gap-6 lg:grid-cols-[1fr_320px]">
        <Card>
          <h2 className="px-5 pt-5 text-h3 text-ink">Children</h2>
          {children.length === 0 ? (
            <p className="px-5 pt-2 pb-5 text-body-sm text-ink-2">No children in this class yet.</p>
          ) : (
            <ul className="mt-2 divide-y divide-border">
              {children.map((c) => (
                <li key={c.id}>
                  <Link href={`/children/${c.id}`} className="flex min-h-tap items-center justify-between gap-4 px-5 py-3 hover:bg-surface-2">
                    <span>
                      <span className="block text-body-sm text-ink">{c.full_name}</span>
                      <span className="block text-caption text-ink-3">
                        {[formatAge(c.date_of_birth), c.parent_name].filter(Boolean).join(" · ")}
                      </span>
                    </span>
                    <span className="tnum text-caption text-ink-2">{formatPhone(c.parent_phone)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {manage ? (
          <Card className="p-5">
            <h2 className="mb-4 text-h3 text-ink">Edit class</h2>
            <ClassForm action={updateClass.bind(null, cls.id)} initial={cls} submitLabel="Save changes" />
            <form action={deleteClass.bind(null, cls.id)} className="mt-6 border-t border-border pt-4">
              <ConfirmSubmit
                variant="ghost"
                size="sm"
                className="!text-danger-ink hover:!bg-danger-soft"
                confirm={`Delete ${cls.name}? Its children stay in BloomDesk but will have no class.`}
              >
                <Trash2 aria-hidden /> Delete class
              </ConfirmSubmit>
            </form>
          </Card>
        ) : null}
      </div>
    </>
  );
}

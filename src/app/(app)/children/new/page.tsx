import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { canManage, requireSchool } from "@/lib/session";
import { getClasses } from "@/lib/data";
import { todayISO } from "@/lib/format";
import { Card, PageHeader } from "@/components/ui/card";
import { ChildForm } from "../child-form";
import { addChild } from "../actions";

export const metadata: Metadata = { title: "Add a child" };

export default async function NewChildPage({ searchParams }: PageProps<"/children/new">) {
  const { school, role } = await requireSchool();
  if (!canManage(role)) redirect("/children");
  const { class: classParam } = await searchParams;
  const classes = await getClasses(school.id);
  const defaultClassId = typeof classParam === "string" && classes.some((c) => c.id === classParam) ? classParam : undefined;

  return (
    <>
      <Link href="/children" className="mb-4 inline-flex min-h-tap items-center gap-2 text-body-sm text-primary">
        <ArrowLeft className="size-4" aria-hidden /> All children
      </Link>
      <PageHeader title="Add a child" />
      <Card className="max-w-[720px] p-6">
        <ChildForm action={addChild} classes={classes} defaultClassId={defaultClassId} today={todayISO(school.timezone)} />
      </Card>
    </>
  );
}

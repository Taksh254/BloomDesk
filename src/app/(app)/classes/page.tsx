import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { canManage, requireSchool } from "@/lib/session";
import { getChildren, getClasses } from "@/lib/data";
import { CLASS_LEVELS } from "@/lib/types";
import { Card, PageHeader } from "@/components/ui/card";
import { ClassName } from "@/components/ui/class-crayon";
import { Pill } from "@/components/ui/status-pill";
import { ClassForm } from "./class-form";
import { addClass } from "./actions";

export const metadata: Metadata = { title: "Classes" };

export default async function ClassesPage() {
  const { school, role } = await requireSchool();
  const [classes, children] = await Promise.all([getClasses(school.id), getChildren(school.id)]);
  const levelLabel = Object.fromEntries(CLASS_LEVELS.map((l) => [l.value, l.label]));

  return (
    <>
      <PageHeader title="Classes" description="Each class gets its own crayon colour across BloomDesk." />

      {canManage(role) ? (
        <Card className="mb-6 p-5">
          <h2 className="mb-4 text-h3 text-ink">Add a class</h2>
          <ClassForm action={addClass} submitLabel="Add class" resetOnSuccess layout="row" />
        </Card>
      ) : null}

      {classes.length === 0 ? (
        <div className="bd-feature">
          <p className="text-h3">No classes yet</p>
          <p className="mt-1 text-body-sm text-ink-2">Add your first class above, like Playgroup or Nursery.</p>
        </div>
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-body-sm">
            <thead>
              <tr className="border-b border-border text-left text-label text-ink-2">
                <th className="px-5 py-3 font-medium">Class</th>
                <th className="px-5 py-3 font-medium">Level</th>
                <th className="px-5 py-3 text-right font-medium">Children</th>
                <th className="px-5 py-3 text-right font-medium">Seats</th>
                <th className="w-10 px-5 py-3"><span className="sr-only">Open</span></th>
              </tr>
            </thead>
            <tbody className="tnum divide-y divide-border">
              {classes.map((cls) => {
                const n = children.filter((c) => c.class_id === cls.id).length;
                const full = cls.capacity !== null && n >= cls.capacity;
                return (
                  <tr key={cls.id} className="relative hover:bg-surface-2">
                    <td className="px-5 py-3.5">
                      <Link href={`/classes/${cls.id}`} className="after:absolute after:inset-0">
                        <ClassName level={cls.level} name={cls.name} />
                      </Link>
                    </td>
                    <td className="px-5 py-3.5 text-ink-2">{levelLabel[cls.level]}</td>
                    <td className="px-5 py-3.5 text-right">{n}</td>
                    <td className="px-5 py-3.5 text-right">
                      {cls.capacity === null ? <span className="text-ink-3">–</span> : full ? <Pill tone="warning">Full · {cls.capacity}</Pill> : cls.capacity}
                    </td>
                    <td className="px-5 py-3.5 text-ink-3">
                      <ChevronRight className="size-4" aria-hidden />
                    </td>
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

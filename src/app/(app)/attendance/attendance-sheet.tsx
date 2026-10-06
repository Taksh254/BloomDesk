"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCheck, Loader2, Plane, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormMessage } from "@/components/ui/field";
import { initials } from "@/lib/format";
import type { AttendanceStatus } from "@/lib/types";
import { saveAttendance } from "./actions";

type Kid = { id: string; name: string; caption: string };

const OPTIONS: { status: AttendanceStatus; label: string; on: string }[] = [
  { status: "present", label: "Present", on: "" },
  { status: "absent", label: "Absent", on: "border-danger bg-danger-soft text-danger-ink" },
  { status: "late", label: "Late", on: "border-warning bg-warning-soft text-warning-ink" },
  { status: "leave", label: "On leave", on: "border-info bg-info-soft text-info-ink" },
];

export function AttendanceSheet({
  classId,
  date,
  kids,
  saved,
}: {
  classId: string;
  date: string;
  kids: Kid[];
  saved: Record<string, AttendanceStatus>;
}) {
  const router = useRouter();
  const [marks, setMarks] = useState<Record<string, AttendanceStatus>>(saved);
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<{ tone: "success" | "danger"; text: string } | null>(null);

  const dirty = useMemo(() => kids.some((k) => marks[k.id] !== saved[k.id]), [kids, marks, saved]);

  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const counts = { present: 0, absent: 0, late: 0, leave: 0, none: 0 };
  for (const k of kids) {
    const s = marks[k.id];
    if (s) counts[s] += 1;
    else counts.none += 1;
  }

  const set = (childId: string, status: AttendanceStatus) => {
    setResult(null);
    setMarks((m) => ({ ...m, [childId]: status }));
  };
  const markRestPresent = () => {
    setResult(null);
    setMarks((m) => {
      const next = { ...m };
      for (const k of kids) next[k.id] ??= "present";
      return next;
    });
  };

  const save = () => {
    const entries = kids.filter((k) => marks[k.id]).map((k) => ({ childId: k.id, status: marks[k.id]! }));
    startTransition(async () => {
      const res = await saveAttendance({ classId, date, entries });
      if (res.ok) {
        setResult({
          tone: "success",
          text: `Saved for ${res.saved} ${res.saved === 1 ? "child" : "children"}${counts.none ? `. ${counts.none} still not marked.` : "."}`,
        });
        router.refresh();
      } else {
        setResult({ tone: "danger", text: res.error });
      }
    });
  };

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="tnum text-body-sm text-ink-2">
          <span className="font-semibold text-success-ink">{counts.present + counts.late} present</span>
          {" · "}
          <span className={counts.absent ? "font-semibold text-danger-ink" : ""}>{counts.absent} absent</span>
          {counts.late ? ` · ${counts.late} late` : ""}
          {counts.leave ? ` · ${counts.leave} on leave` : ""}
          {" · "}
          <span className={counts.none ? "font-semibold text-ink" : ""}>{counts.none} not marked</span>
        </p>
        {counts.none > 0 ? (
          <Button variant="secondary" onClick={markRestPresent}>
            <CheckCheck aria-hidden /> {counts.none === kids.length ? "Mark everyone present" : "Mark the rest present"}
          </Button>
        ) : null}
      </div>

      <ul className="divide-y divide-border rounded-md border border-border bg-surface">
        {kids.map((k) => {
          const current = marks[k.id];
          return (
            <li key={k.id} className="flex min-h-tap-teacher flex-wrap items-center gap-3 px-4 py-2.5 sm:flex-nowrap">
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-surface-2 text-label text-ink-2" aria-hidden>
                {initials(k.name)}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-body text-ink">{k.name}</span>
                {k.caption ? <span className="block truncate text-caption text-ink-3">{k.caption}</span> : null}
              </span>
              <div role="group" aria-label={`Attendance for ${k.name}`} className="flex w-full justify-end gap-1.5 sm:w-auto">
                {OPTIONS.map((o) => {
                  const on = current === o.status;
                  return (
                    <button
                      key={o.status}
                      type="button"
                      aria-pressed={on}
                      aria-label={o.label}
                      title={o.label}
                      onClick={() => set(k.id, o.status)}
                      className={`grid size-11 place-items-center rounded-full border text-label font-semibold transition-colors ${
                        o.status === "present" ? "bd-present" : ""
                      } ${on ? o.on : "border-border bg-surface text-ink-2 hover:bg-surface-2"}`}
                    >
                      {o.status === "present" ? (
                        on ? <Star className="size-5 fill-current" aria-hidden /> : "P"
                      ) : o.status === "leave" ? (
                        <Plane className="size-4" aria-hidden />
                      ) : (
                        o.label[0]
                      )}
                    </button>
                  );
                })}
              </div>
            </li>
          );
        })}
      </ul>

      <div className="sticky bottom-[88px] z-10 mt-4 lg:bottom-4 flex flex-wrap items-center justify-end gap-3 rounded-md border border-border bg-surface p-3 shadow-lg">
        <div className="mr-auto min-w-0" aria-live="polite">
          {result ? (
            <FormMessage tone={result.tone}>{result.text}</FormMessage>
          ) : (
            <p className="px-1 text-body-sm text-ink-2">{dirty ? "You have changes that aren't saved yet." : "Everything is saved."}</p>
          )}
        </div>
        <Button onClick={save} disabled={pending || !dirty}>
          {pending ? <Loader2 className="animate-spin" aria-hidden /> : null}
          Save attendance
        </Button>
      </div>
    </div>
  );
}

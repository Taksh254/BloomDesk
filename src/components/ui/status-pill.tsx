import { Check, Clock, Plane, X, Minus } from "lucide-react";
import type { AttendanceStatus } from "@/lib/types";

export const ATTENDANCE: Record<AttendanceStatus, { label: string; short: string; icon: typeof Check; pill: string }> = {
  present: { label: "Present", short: "P", icon: Check, pill: "bg-success-soft text-success-ink" },
  absent: { label: "Absent", short: "A", icon: X, pill: "bg-danger-soft text-danger-ink" },
  late: { label: "Late", short: "L", icon: Clock, pill: "bg-warning-soft text-warning-ink" },
  leave: { label: "On leave", short: "OL", icon: Plane, pill: "bg-info-soft text-info-ink" },
};

export function AttendancePill({ status }: { status: AttendanceStatus | null }) {
  if (!status) {
    return (
      <span className="inline-flex h-[26px] items-center gap-1.5 rounded-pill bg-surface-2 px-2.5 text-label text-ink-2">
        <Minus className="size-3.5" aria-hidden /> Not marked
      </span>
    );
  }
  const s = ATTENDANCE[status];
  const Icon = s.icon;
  return (
    <span className={`inline-flex h-[26px] items-center gap-1.5 rounded-pill px-2.5 text-label ${s.pill}`}>
      <Icon className="size-3.5" strokeWidth={2} aria-hidden /> {s.label}
    </span>
  );
}

export function Pill({ tone = "neutral", children }: { tone?: "neutral" | "success" | "warning" | "danger" | "info"; children: React.ReactNode }) {
  const tones = {
    neutral: "bg-surface-2 text-ink-2",
    success: "bg-success-soft text-success-ink",
    warning: "bg-warning-soft text-warning-ink",
    danger: "bg-danger-soft text-danger-ink",
    info: "bg-info-soft text-info-ink",
  };
  return <span className={`inline-flex h-[26px] items-center gap-1.5 rounded-pill px-2.5 text-label ${tones[tone]}`}>{children}</span>;
}

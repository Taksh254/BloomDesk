"use client";

import { useRouter } from "next/navigation";

export function DatePicker({ value, max, classId }: { value: string; max: string; classId: string }) {
  const router = useRouter();
  return (
    <label>
      <span className="sr-only">Date</span>
      <input
        type="date"
        value={value}
        max={max}
        onChange={(e) => {
          if (e.target.value) router.push(`/attendance?class=${classId}&date=${e.target.value}`);
        }}
        className="min-h-tap rounded-xs border border-border-strong bg-surface px-3 text-body text-ink"
      />
    </label>
  );
}

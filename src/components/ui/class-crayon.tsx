import type { ClassLevel } from "@/lib/types";

const COLOR: Record<ClassLevel, string> = {
  playgroup: "var(--bd-class-playgroup)",
  nursery: "var(--bd-class-nursery)",
  lkg: "var(--bd-class-lkg)",
  ukg: "var(--bd-class-ukg)",
  daycare: "var(--bd-accent)",
  other: "var(--bd-ink-3)",
};

export function classColor(level: ClassLevel) {
  return COLOR[level];
}

/** The small crayon mark beside a class name. */
export function Crayon({ level }: { level: ClassLevel }) {
  return (
    <svg width="18" height="8" viewBox="0 0 18 8" aria-hidden className="shrink-0">
      <path d="M0 1.5A1.5 1.5 0 0 1 1.5 0H13l5 4-5 4H1.5A1.5 1.5 0 0 1 0 6.5z" fill={COLOR[level]} />
    </svg>
  );
}

export function ClassName({ level, name }: { level: ClassLevel; name: string }) {
  return (
    <span className="inline-flex items-center gap-2 text-label text-ink">
      <Crayon level={level} />
      {name}
    </span>
  );
}

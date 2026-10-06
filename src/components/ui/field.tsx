import type { ComponentProps, ReactNode } from "react";

const inputBase =
  "min-h-tap w-full rounded-xs border border-border-strong bg-surface px-3 text-body text-ink placeholder:text-ink-3 aria-[invalid=true]:border-danger";

export function Label({ htmlFor, children, optional }: { htmlFor: string; children: ReactNode; optional?: boolean }) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 block text-label text-ink-2">
      {children}
      {optional ? <span className="font-normal text-ink-3"> (optional)</span> : null}
    </label>
  );
}

export function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="mt-1.5 text-caption text-danger-ink">
      {message}
    </p>
  );
}

type FieldProps = {
  label: string;
  name: string;
  error?: string;
  optional?: boolean;
  hint?: string;
  prefix?: string;
} & Omit<ComponentProps<"input">, "name" | "prefix">;

export function Field({ label, name, error, optional, hint, prefix, id, className = "", ...input }: FieldProps) {
  const fieldId = id ?? name;
  const describedBy = error ? `${fieldId}-error` : hint ? `${fieldId}-hint` : undefined;
  return (
    <div className={className}>
      <Label htmlFor={fieldId} optional={optional}>
        {label}
      </Label>
      <div className="flex">
        {prefix ? (
          <span className="inline-flex items-center rounded-l-xs border border-r-0 border-border-strong bg-surface-2 px-3 text-body-sm text-ink-2">
            {prefix}
          </span>
        ) : null}
        <input
          id={fieldId}
          name={name}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={`${inputBase} ${prefix ? "rounded-l-none" : ""}`}
          {...input}
        />
      </div>
      {hint && !error ? (
        <p id={`${fieldId}-hint`} className="mt-1.5 text-caption text-ink-3">
          {hint}
        </p>
      ) : null}
      <FieldError id={`${fieldId}-error`} message={error} />
    </div>
  );
}

type SelectProps = {
  label: string;
  name: string;
  error?: string;
  optional?: boolean;
  options: { value: string; label: string }[];
} & Omit<ComponentProps<"select">, "name">;

export function SelectField({ label, name, error, optional, options, id, className = "", ...select }: SelectProps) {
  const fieldId = id ?? name;
  return (
    <div className={className}>
      <Label htmlFor={fieldId} optional={optional}>
        {label}
      </Label>
      <select
        id={fieldId}
        name={name}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${fieldId}-error` : undefined}
        className={inputBase}
        {...select}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <FieldError id={`${fieldId}-error`} message={error} />
    </div>
  );
}

export function FormMessage({ tone = "danger", children }: { tone?: "danger" | "success"; children?: ReactNode }) {
  if (!children) return null;
  const cls = tone === "danger" ? "bg-danger-soft text-danger-ink" : "bg-success-soft text-success-ink";
  return (
    <p role={tone === "danger" ? "alert" : "status"} className={`rounded-xs px-3 py-2.5 text-body-sm ${cls}`}>
      {children}
    </p>
  );
}

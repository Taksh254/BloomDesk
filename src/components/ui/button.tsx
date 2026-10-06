import Link from "next/link";
import type { ComponentProps } from "react";

type Variant = "primary" | "secondary" | "ghost" | "accent" | "danger";
type Size = "md" | "sm";

const base =
  "inline-flex items-center justify-center gap-2 rounded-sm font-medium transition-colors duration-150 ease-bd disabled:cursor-not-allowed disabled:opacity-60 [&_svg]:size-[18px] [&_svg]:shrink-0";
const sizes: Record<Size, string> = {
  md: "min-h-tap px-4 text-[15px]",
  sm: "h-[34px] px-3 text-[14px]",
};
const variants: Record<Variant, string> = {
  primary: "bg-primary text-on-primary hover:bg-primary-hover",
  secondary: "border border-border-strong bg-surface text-ink hover:bg-surface-2",
  ghost: "text-primary hover:bg-primary-soft",
  accent: "bg-accent text-on-accent hover:brightness-95",
  danger: "bg-danger text-on-danger hover:brightness-95",
};

export function buttonClass(variant: Variant = "primary", size: Size = "md", extra = "") {
  return `${base} ${sizes[size]} ${variants[variant]} ${extra}`;
}

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  ...props
}: ComponentProps<"button"> & { variant?: Variant; size?: Size }) {
  return <button className={buttonClass(variant, size, className)} {...props} />;
}

export function LinkButton({
  variant = "primary",
  size = "md",
  className = "",
  ...props
}: ComponentProps<typeof Link> & { variant?: Variant; size?: Size }) {
  return <Link className={buttonClass(variant, size, className)} {...props} />;
}

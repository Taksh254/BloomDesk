"use client";

import type { ComponentProps } from "react";
import { SubmitButton } from "@/components/ui/submit-button";

/** A submit button that asks for confirmation first. */
export function ConfirmSubmit({ confirm, ...props }: ComponentProps<typeof SubmitButton> & { confirm: string }) {
  return (
    <SubmitButton
      {...props}
      onClick={(e) => {
        if (!window.confirm(confirm)) e.preventDefault();
      }}
    />
  );
}

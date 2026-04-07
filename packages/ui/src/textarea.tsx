import type { TextareaHTMLAttributes } from "react";

import { cn } from "./utils";

export function Textarea({
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "min-h-32 w-full rounded-[var(--gg-radius-md)] border border-[var(--gg-color-border)] bg-[var(--gg-color-semantic-surface-strong)] px-[var(--gg-space-5)] py-[var(--gg-space-4)] text-[length:var(--gg-font-size-base)] text-[var(--gg-color-ink)] shadow-[var(--gg-shadow-sm)] outline-none transition-[color,background-color,border-color,box-shadow] duration-[var(--gg-animation-duration-normal)] ease-[var(--gg-animation-easing-standard)] placeholder:text-[var(--gg-color-muted)] focus:border-[var(--gg-color-deep)] focus:ring-2 focus:ring-[var(--gg-color-semantic-focus-ring)]",
        className,
      )}
      {...props}
    />
  );
}

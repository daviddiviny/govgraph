import type { HTMLAttributes } from "react";

import { cn } from "./utils";

const toneClasses = {
  neutral:
    "border-[var(--gg-color-border)] bg-[var(--gg-color-wash)] text-[var(--gg-color-semantic-text-secondary)]",
  muted:
    "border-[var(--gg-color-border)] bg-[var(--gg-color-semantic-surface-muted)] text-[var(--gg-color-semantic-text-secondary)]",
  accent:
    "border-[color:rgba(185,74,55,0.24)] bg-[color:rgba(185,74,55,0.12)] text-[var(--gg-color-accent)]",
  success:
    "border-[color:rgba(47,107,87,0.24)] bg-[color:rgba(47,107,87,0.12)] text-[var(--gg-color-semantic-success)]",
  warning:
    "border-[color:rgba(138,104,33,0.24)] bg-[color:rgba(138,104,33,0.14)] text-[var(--gg-color-semantic-warning)]",
  danger:
    "border-[color:rgba(159,63,50,0.24)] bg-[color:rgba(159,63,50,0.12)] text-[var(--gg-color-semantic-danger)]",
} as const;

export type BadgeTone = keyof typeof toneClasses;

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: BadgeTone;
};

export function Badge({
  className,
  tone = "neutral",
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-[var(--gg-radius-full)] border px-[var(--gg-space-3)] py-[var(--gg-space-1)] text-[length:var(--gg-font-size-xs)] font-medium uppercase tracking-[var(--gg-font-letter-spacing-caps)]",
        toneClasses[tone],
        className,
      )}
      {...props}
    />
  );
}

import type { HTMLAttributes } from "react";

import { cn } from "./utils";

const toneClasses = {
  default:
    "bg-[var(--gg-color-semantic-surface-strong)] shadow-[var(--gg-shadow-md)]",
  muted:
    "bg-[var(--gg-color-semantic-surface)] shadow-[var(--gg-shadow-sm)]",
  hero: "bg-[var(--gg-color-paper-strong)] shadow-[var(--gg-shadow-lg)]",
} as const;

type CardProps = HTMLAttributes<HTMLDivElement> & {
  tone?: keyof typeof toneClasses;
};

export function Card({
  className,
  tone = "default",
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        "rounded-[var(--gg-radius-lg)] border border-[var(--gg-color-border)] backdrop-blur-sm",
        toneClasses[tone],
        className,
      )}
      {...props}
    />
  );
}

import type { HTMLAttributes, ReactNode } from "react";

import { Card } from "./card";
import { cn } from "./utils";

type StatCardProps = HTMLAttributes<HTMLDivElement> & {
  label: ReactNode;
  value: ReactNode;
  description: ReactNode;
};

export function StatCard({
  className,
  description,
  label,
  value,
  ...props
}: StatCardProps) {
  return (
    <Card className={cn("p-[var(--gg-space-5)]", className)} {...props}>
      <p className="text-[length:var(--gg-font-size-xs)] font-semibold uppercase tracking-[var(--gg-font-letter-spacing-caps)] text-[var(--gg-color-semantic-text-secondary)]">
        {label}
      </p>
      <p className="mt-[var(--gg-space-4)] font-[family-name:var(--gg-font-family-display)] text-[length:var(--gg-font-size-4xl)] font-semibold tracking-[var(--gg-font-letter-spacing-tight)] text-[var(--gg-color-ink)]">
        {value}
      </p>
      <p className="mt-[var(--gg-space-2)] text-[length:var(--gg-font-size-sm)] leading-[var(--gg-font-line-height-body)] text-[var(--gg-color-semantic-text-secondary)]">
        {description}
      </p>
    </Card>
  );
}

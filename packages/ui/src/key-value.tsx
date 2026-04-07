import type { HTMLAttributes, ReactNode } from "react";

import { cn } from "./utils";

type KeyValueProps = HTMLAttributes<HTMLDivElement> & {
  label: ReactNode;
  value: ReactNode;
};

export function KeyValue({
  className,
  label,
  value,
  ...props
}: KeyValueProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] gap-[var(--gg-space-3)] border-b border-[var(--gg-color-border)] py-[var(--gg-space-3)] last:border-b-0 last:pb-0 first:pt-0",
        className,
      )}
      {...props}
    >
      <dt className="text-[length:var(--gg-font-size-xs)] font-semibold uppercase tracking-[var(--gg-font-letter-spacing-caps)] text-[var(--gg-color-semantic-text-secondary)]">
        {label}
      </dt>
      <dd className="text-[length:var(--gg-font-size-sm)] leading-[var(--gg-font-line-height-body)] text-[var(--gg-color-ink)]">
        {value}
      </dd>
    </div>
  );
}

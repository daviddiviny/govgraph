import type { HTMLAttributes } from "react";

import { cn } from "./utils";

export function Badge({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-[var(--govgraph-border)] bg-[var(--govgraph-wash)] px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-[var(--govgraph-muted)]",
        className,
      )}
      {...props}
    />
  );
}

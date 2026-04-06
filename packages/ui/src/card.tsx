import type { HTMLAttributes } from "react";

import { cn } from "./utils";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-[1.75rem] border border-[var(--govgraph-border)] bg-white/90 shadow-[0_18px_48px_rgba(14,44,36,0.08)] backdrop-blur-sm",
        className,
      )}
      {...props}
    />
  );
}

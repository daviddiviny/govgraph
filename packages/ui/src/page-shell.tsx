import type { HTMLAttributes } from "react";

import { cn } from "./utils";

export function PageShell({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "mx-auto flex w-full max-w-6xl flex-col gap-[var(--gg-space-8)] px-[var(--gg-space-6)] py-[var(--gg-space-6)] sm:px-[var(--gg-space-8)] lg:px-[var(--gg-space-10)] lg:py-[var(--gg-space-10)]",
        className,
      )}
      {...props}
    />
  );
}

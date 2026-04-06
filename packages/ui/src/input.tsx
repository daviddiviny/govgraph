import type { InputHTMLAttributes } from "react";

import { cn } from "./utils";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "w-full rounded-full border border-[var(--govgraph-border)] bg-white/90 px-5 py-3 text-base text-[var(--govgraph-ink)] shadow-sm outline-none transition duration-150 placeholder:text-[var(--govgraph-muted)] focus:border-[var(--govgraph-ink)] focus:ring-2 focus:ring-[color:rgba(14,44,36,0.12)]",
        className,
      )}
      {...props}
    />
  );
}

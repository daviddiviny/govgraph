import type { ButtonHTMLAttributes, ReactNode } from "react";

import { cn } from "./utils";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  tone?: "primary" | "ghost";
};

export function Button({ className, tone = "primary", ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-full border px-4 py-2 text-sm font-semibold transition duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
        tone === "primary"
          ? "border-[var(--govgraph-ink)] bg-[var(--govgraph-ink)] text-[var(--govgraph-paper)] hover:bg-[var(--govgraph-deep)]"
          : "border-[var(--govgraph-border)] bg-transparent text-[var(--govgraph-ink)] hover:bg-[color:rgba(14,44,36,0.06)]",
        className,
      )}
      {...props}
    />
  );
}

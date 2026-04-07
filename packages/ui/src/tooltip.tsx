import type { HTMLAttributes, ReactNode } from "react";

import { cn } from "./utils";

type TooltipProps = HTMLAttributes<HTMLSpanElement> & {
  content: ReactNode;
  children: ReactNode;
};

export function Tooltip({
  children,
  className,
  content,
  ...props
}: TooltipProps) {
  return (
    <span className={cn("group relative inline-flex", className)} {...props}>
      {children}
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-[calc(100%+var(--gg-space-2))] left-1/2 z-10 w-max max-w-64 -translate-x-1/2 rounded-[var(--gg-radius-md)] border border-[var(--gg-color-border)] bg-[var(--gg-color-paper-strong)] px-[var(--gg-space-3)] py-[var(--gg-space-2)] text-[length:var(--gg-font-size-xs)] leading-[var(--gg-font-line-height-body)] text-[var(--gg-color-ink)] opacity-0 shadow-[var(--gg-shadow-sm)] transition-[opacity,transform] duration-[var(--gg-animation-duration-normal)] ease-[var(--gg-animation-easing-standard)] group-hover:-translate-y-1 group-hover:opacity-100 group-focus-within:-translate-y-1 group-focus-within:opacity-100"
      >
        {content}
      </span>
    </span>
  );
}

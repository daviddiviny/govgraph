import type { HTMLAttributes, ReactNode } from "react";

import { cn } from "./utils";

export type BreadcrumbItem = {
  content: ReactNode;
  current?: boolean;
};

type BreadcrumbProps = HTMLAttributes<HTMLElement> & {
  items: readonly BreadcrumbItem[];
};

export function Breadcrumb({
  className,
  items,
  ...props
}: BreadcrumbProps) {
  return (
    <nav
      aria-label="Breadcrumb"
      className={cn(
        "flex flex-wrap items-center gap-[var(--gg-space-2)] text-[length:var(--gg-font-size-sm)] text-[var(--gg-color-semantic-text-secondary)]",
        className,
      )}
      {...props}
    >
      {items.map((item, index) => (
        <span key={`${index}-${item.current ? "current" : "link"}`} className="inline-flex items-center gap-[var(--gg-space-2)]">
          {index > 0 ? (
            <span aria-hidden="true" className="text-[var(--gg-color-muted)]">
              /
            </span>
          ) : null}
          <span
            aria-current={item.current ? "page" : undefined}
            className={cn(item.current ? "font-semibold text-[var(--gg-color-ink)]" : "underline-offset-4 hover:text-[var(--gg-color-deep)] hover:underline")}
          >
            {item.content}
          </span>
        </span>
      ))}
    </nav>
  );
}

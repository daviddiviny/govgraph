import type { HTMLAttributes, ReactNode } from "react";

import { cn } from "./utils";

type SiteHeaderProps = HTMLAttributes<HTMLElement> & {
  brand: ReactNode;
  navigation?: ReactNode;
  utility?: ReactNode;
};

export function SiteHeader({
  brand,
  navigation,
  utility,
  className,
  ...props
}: SiteHeaderProps) {
  return (
    <header
      className={cn(
        "sticky top-0 z-20 border-b border-[var(--gg-color-border)] bg-[color:rgba(246,241,230,0.95)] backdrop-blur-sm",
        className,
      )}
      {...props}
    >
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-[var(--gg-space-4)] px-[var(--gg-space-6)] py-[var(--gg-space-4)] sm:px-[var(--gg-space-8)] lg:flex-row lg:items-center lg:justify-between lg:px-[var(--gg-space-10)]">
        <div className="min-w-0">{brand}</div>
        {navigation ? (
          <nav className="flex flex-wrap items-center gap-[var(--gg-space-4)] text-[length:var(--gg-font-size-sm)] font-medium text-[var(--gg-color-semantic-text-secondary)]">
            {navigation}
          </nav>
        ) : null}
        {utility ? <div className="flex items-center gap-[var(--gg-space-3)]">{utility}</div> : null}
      </div>
    </header>
  );
}

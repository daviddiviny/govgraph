import type { HTMLAttributes, ReactNode } from "react";

import { Card } from "./card";
import { cn } from "./utils";

type EmptyStateProps = Omit<HTMLAttributes<HTMLDivElement>, "title"> & {
  action?: ReactNode;
  description: ReactNode;
  title: ReactNode;
};

export function EmptyState({
  action,
  className,
  description,
  title,
  ...props
}: EmptyStateProps) {
  return (
    <Card
      className={cn(
        "flex flex-col items-center justify-center gap-[var(--gg-space-4)] px-[var(--gg-space-6)] py-[var(--gg-space-8)] text-center",
        className,
      )}
      {...props}
    >
      <div className="relative flex h-16 w-16 items-center justify-center rounded-[var(--gg-radius-full)] border border-[var(--gg-color-border)] bg-[var(--gg-color-semantic-surface-muted)]">
        <div className="h-7 w-7 rounded-[var(--gg-radius-full)] border border-[color:rgba(185,74,55,0.4)] bg-[color:rgba(185,74,55,0.12)]" />
      </div>
      <div className="space-y-[var(--gg-space-2)]">
        <h3 className="font-[family-name:var(--gg-font-family-display)] text-[length:var(--gg-font-size-2xl)] font-semibold tracking-[var(--gg-font-letter-spacing-tight)] text-[var(--gg-color-ink)]">
          {title}
        </h3>
        <p className="max-w-xl text-[length:var(--gg-font-size-sm)] leading-[var(--gg-font-line-height-body)] text-[var(--gg-color-semantic-text-secondary)]">
          {description}
        </p>
      </div>
      {action ? <div>{action}</div> : null}
    </Card>
  );
}

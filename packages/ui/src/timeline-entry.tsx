import type { HTMLAttributes, ReactNode } from "react";

import { Card } from "./card";
import { cn } from "./utils";

type TimelineEntryProps = Omit<HTMLAttributes<HTMLDivElement>, "title"> & {
  date: ReactNode;
  description?: ReactNode;
  detail?: ReactNode;
  title: ReactNode;
};

export function TimelineEntry({
  className,
  date,
  description,
  detail,
  title,
  ...props
}: TimelineEntryProps) {
  return (
    <Card className={cn("relative overflow-hidden p-[var(--gg-space-5)]", className)} {...props}>
      <div className="absolute left-[var(--gg-space-5)] top-[var(--gg-space-5)] h-[calc(100%-var(--gg-space-10))] w-px bg-[var(--gg-color-border)]" />
      <div className="relative pl-[var(--gg-space-6)]">
        <div className="absolute left-0 top-[0.35rem] h-3 w-3 rounded-[var(--gg-radius-full)] border border-[var(--gg-color-accent)] bg-[var(--gg-color-paper)]" />
        <p className="text-[length:var(--gg-font-size-xs)] font-semibold uppercase tracking-[var(--gg-font-letter-spacing-caps)] text-[var(--gg-color-semantic-text-secondary)]">
          {date}
        </p>
        <h3 className="mt-[var(--gg-space-2)] font-[family-name:var(--gg-font-family-display)] text-[length:var(--gg-font-size-xl)] font-semibold tracking-[var(--gg-font-letter-spacing-tight)] text-[var(--gg-color-ink)]">
          {title}
        </h3>
        {description ? (
          <p className="mt-[var(--gg-space-2)] text-[length:var(--gg-font-size-sm)] leading-[var(--gg-font-line-height-body)] text-[var(--gg-color-semantic-text-secondary)]">
            {description}
          </p>
        ) : null}
        {detail ? (
          <div className="mt-[var(--gg-space-3)] text-[length:var(--gg-font-size-xs)] font-semibold uppercase tracking-[var(--gg-font-letter-spacing-caps)] text-[var(--gg-color-semantic-text-secondary)]">
            {detail}
          </div>
        ) : null}
      </div>
    </Card>
  );
}

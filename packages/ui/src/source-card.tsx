import type { HTMLAttributes, ReactNode } from "react";

import { Card } from "./card";
import { cn } from "./utils";

type SourceCardProps = Omit<HTMLAttributes<HTMLDivElement>, "title"> & {
  badges?: ReactNode;
  description?: ReactNode;
  metadata?: ReactNode;
  action?: ReactNode;
  title: ReactNode;
};

export function SourceCard({
  action,
  badges,
  className,
  description,
  metadata,
  title,
  ...props
}: SourceCardProps) {
  return (
    <Card className={cn("p-[var(--gg-space-5)]", className)} {...props}>
      {badges ? <div className="flex flex-wrap gap-[var(--gg-space-3)]">{badges}</div> : null}
      <div className="mt-[var(--gg-space-4)] space-y-[var(--gg-space-2)]">
        <div className="font-[family-name:var(--gg-font-family-display)] text-[length:var(--gg-font-size-xl)] font-semibold tracking-[var(--gg-font-letter-spacing-tight)] text-[var(--gg-color-ink)]">
          {title}
        </div>
        {description ? (
          <div className="text-[length:var(--gg-font-size-sm)] leading-[var(--gg-font-line-height-body)] text-[var(--gg-color-semantic-text-secondary)]">
            {description}
          </div>
        ) : null}
        {metadata ? (
          <div className="text-[length:var(--gg-font-size-xs)] font-semibold uppercase tracking-[var(--gg-font-letter-spacing-caps)] text-[var(--gg-color-semantic-text-secondary)]">
            {metadata}
          </div>
        ) : null}
      </div>
      {action ? <div className="mt-[var(--gg-space-4)]">{action}</div> : null}
    </Card>
  );
}

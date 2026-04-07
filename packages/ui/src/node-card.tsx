import type { HTMLAttributes, ReactNode } from "react";

import { Card } from "./card";
import { cn } from "./utils";

type NodeCardProps = Omit<HTMLAttributes<HTMLDivElement>, "title"> & {
  badges?: ReactNode;
  description?: ReactNode;
  footer?: ReactNode;
  title: ReactNode;
};

export function NodeCard({
  badges,
  className,
  description,
  footer,
  title,
  ...props
}: NodeCardProps) {
  return (
    <Card
      className={cn(
        "p-[var(--gg-space-5)] transition-transform duration-[var(--gg-animation-duration-slow)] ease-[var(--gg-animation-easing-standard)] hover:-translate-y-0.5",
        className,
      )}
      {...props}
    >
      {badges ? <div className="flex flex-wrap gap-[var(--gg-space-3)]">{badges}</div> : null}
      <div className="mt-[var(--gg-space-4)] space-y-[var(--gg-space-2)]">
        <div className="font-[family-name:var(--gg-font-family-display)] text-[length:var(--gg-font-size-2xl)] font-semibold tracking-[var(--gg-font-letter-spacing-tight)] text-[var(--gg-color-ink)]">
          {title}
        </div>
        {description ? (
          <p className="text-[length:var(--gg-font-size-sm)] leading-[var(--gg-font-line-height-body)] text-[var(--gg-color-semantic-text-secondary)]">
            {description}
          </p>
        ) : null}
      </div>
      {footer ? <div className="mt-[var(--gg-space-4)]">{footer}</div> : null}
    </Card>
  );
}

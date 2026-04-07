import type { HTMLAttributes, ReactNode } from "react";

import { cn } from "./utils";

type SectionHeaderProps = Omit<HTMLAttributes<HTMLDivElement>, "title"> & {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  trailing?: ReactNode;
};

export function SectionHeader({
  className,
  description,
  eyebrow,
  title,
  trailing,
  ...props
}: SectionHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-[var(--gg-space-3)] sm:flex-row sm:items-end sm:justify-between",
        className,
      )}
      {...props}
    >
      <div className="space-y-[var(--gg-space-2)]">
        {eyebrow ? (
          <p className="text-[length:var(--gg-font-size-xs)] font-semibold uppercase tracking-[var(--gg-font-letter-spacing-eyebrow)] text-[var(--gg-color-semantic-text-secondary)]">
            {eyebrow}
          </p>
        ) : null}
        <div className="space-y-[var(--gg-space-1)]">
          <h2 className="font-[family-name:var(--gg-font-family-display)] text-[length:var(--gg-font-size-3xl)] font-semibold tracking-[var(--gg-font-letter-spacing-tight)] text-[var(--gg-color-ink)] sm:text-[length:var(--gg-font-size-4xl)]">
            {title}
          </h2>
          {description ? (
            <p className="max-w-3xl text-[length:var(--gg-font-size-sm)] leading-[var(--gg-font-line-height-body)] text-[var(--gg-color-semantic-text-secondary)]">
              {description}
            </p>
          ) : null}
        </div>
      </div>
      {trailing ? (
        <div className="text-[length:var(--gg-font-size-sm)] text-[var(--gg-color-semantic-text-secondary)]">
          {trailing}
        </div>
      ) : null}
    </div>
  );
}

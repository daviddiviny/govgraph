import type { HTMLAttributes, ReactNode } from "react";

import { cn } from "./utils";

type MetricBarProps = HTMLAttributes<HTMLDivElement> & {
  detail?: ReactNode;
  label: ReactNode;
  max: number;
  tone?: "accent" | "deep" | "muted";
  value: number;
  valueLabel?: ReactNode;
};

const barToneClasses = {
  accent: "bg-[var(--gg-color-accent)]",
  deep: "bg-[var(--gg-color-deep)]",
  muted: "bg-[var(--gg-color-muted)]",
} as const;

export function MetricBar({
  className,
  detail,
  label,
  max,
  tone = "accent",
  value,
  valueLabel,
  ...props
}: MetricBarProps) {
  const percentage = max <= 0 ? 0 : Math.min((value / max) * 100, 100);

  return (
    <div className={cn("space-y-[var(--gg-space-2)]", className)} {...props}>
      <div className="flex items-center justify-between gap-[var(--gg-space-3)]">
        <p className="text-[length:var(--gg-font-size-sm)] font-medium text-[var(--gg-color-ink)]">
          {label}
        </p>
        <p className="text-[length:var(--gg-font-size-sm)] text-[var(--gg-color-semantic-text-secondary)]">
          {valueLabel ?? value.toLocaleString()}
        </p>
      </div>
      <div className="h-[0.75rem] overflow-hidden rounded-[var(--gg-radius-full)] bg-[var(--gg-color-wash)]">
        <div
          className={cn(
            "h-full rounded-[var(--gg-radius-full)] transition-[width] duration-[var(--gg-animation-duration-slow)] ease-[var(--gg-animation-easing-standard)]",
            barToneClasses[tone],
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {detail ? (
        <p className="text-[length:var(--gg-font-size-xs)] leading-[var(--gg-font-line-height-body)] text-[var(--gg-color-semantic-text-secondary)]">
          {detail}
        </p>
      ) : null}
    </div>
  );
}

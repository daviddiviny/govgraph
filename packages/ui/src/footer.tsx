import type { HTMLAttributes, ReactNode } from "react";

import { cn } from "./utils";

type FooterProps = HTMLAttributes<HTMLElement> & {
  summary: ReactNode;
  links?: ReactNode;
  meta?: ReactNode;
};

export function Footer({
  className,
  summary,
  links,
  meta,
  ...props
}: FooterProps) {
  return (
    <footer
      className={cn(
        "border-t border-[var(--gg-color-border)] bg-[color:rgba(255,250,241,0.7)]",
        className,
      )}
      {...props}
    >
      <div className="mx-auto grid w-full max-w-6xl gap-[var(--gg-space-6)] px-[var(--gg-space-6)] py-[var(--gg-space-8)] sm:px-[var(--gg-space-8)] lg:grid-cols-[1.2fr_0.8fr] lg:px-[var(--gg-space-10)]">
        <div className="space-y-[var(--gg-space-3)]">
          <p className="font-[family-name:var(--gg-font-family-display)] text-[length:var(--gg-font-size-2xl)] font-semibold tracking-[var(--gg-font-letter-spacing-tight)] text-[var(--gg-color-ink)]">
            GovGraph
          </p>
          <div className="max-w-2xl text-[length:var(--gg-font-size-sm)] leading-[var(--gg-font-line-height-body)] text-[var(--gg-color-semantic-text-secondary)]">
            {summary}
          </div>
        </div>
        <div className="space-y-[var(--gg-space-3)] text-[length:var(--gg-font-size-sm)] text-[var(--gg-color-semantic-text-secondary)]">
          {links}
          {meta ? <div>{meta}</div> : null}
        </div>
      </div>
    </footer>
  );
}

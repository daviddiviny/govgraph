import type { InputHTMLAttributes } from "react";

import { cn } from "./utils";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "w-full rounded-[var(--gg-radius-full)] border border-[var(--gg-color-border)] bg-[var(--gg-color-semantic-surface-strong)] px-[var(--gg-space-5)] py-[var(--gg-space-3)] text-[length:var(--gg-font-size-base)] text-[var(--gg-color-ink)] shadow-[var(--gg-shadow-sm)] outline-none transition-[color,background-color,border-color,box-shadow] duration-[var(--gg-animation-duration-normal)] ease-[var(--gg-animation-easing-standard)] placeholder:text-[var(--gg-color-muted)] focus:border-[var(--gg-color-deep)] focus:ring-2 focus:ring-[var(--gg-color-semantic-focus-ring)]",
        className,
      )}
      {...props}
    />
  );
}

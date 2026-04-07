import type { ButtonHTMLAttributes, ReactNode } from "react";

import { cn } from "./utils";

const toneClasses = {
  primary:
    "border-[var(--gg-color-ink)] bg-[var(--gg-color-ink)] text-[var(--gg-color-paper)] hover:bg-[var(--gg-color-deep)]",
  ghost:
    "border-[var(--gg-color-border)] bg-transparent text-[var(--gg-color-ink)] hover:bg-[color:rgba(14,44,36,0.06)]",
  danger:
    "border-[var(--gg-color-semantic-danger)] bg-[var(--gg-color-semantic-danger)] text-[var(--gg-color-paper)] hover:bg-[color:#7f3127]",
} as const;

const sizeClasses = {
  sm: "min-h-[2.5rem] px-[var(--gg-space-4)] text-[length:var(--gg-font-size-sm)]",
  md: "min-h-[2.9rem] px-[var(--gg-space-5)] text-[length:var(--gg-font-size-sm)]",
  lg: "min-h-[3.4rem] px-[var(--gg-space-6)] text-[length:var(--gg-font-size-base)]",
} as const;

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  size?: keyof typeof sizeClasses;
  tone?: keyof typeof toneClasses;
};

export function Button({
  className,
  size = "md",
  tone = "primary",
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-[var(--gg-radius-full)] border font-semibold transition-[color,background-color,border-color,transform,box-shadow] duration-[var(--gg-animation-duration-normal)] ease-[var(--gg-animation-easing-standard)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gg-color-semantic-focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--gg-color-paper)] disabled:cursor-not-allowed disabled:opacity-60",
        sizeClasses[size],
        toneClasses[tone],
        className,
      )}
      {...props}
    />
  );
}

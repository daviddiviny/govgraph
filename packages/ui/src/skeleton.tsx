import type { HTMLAttributes } from "react";

import { cn } from "./utils";

type SkeletonProps = HTMLAttributes<HTMLDivElement> & {
  shape?: "line" | "card" | "pill";
};

const shapeClasses = {
  line: "h-4 rounded-[var(--gg-radius-full)]",
  card: "h-32 rounded-[var(--gg-radius-lg)]",
  pill: "h-9 rounded-[var(--gg-radius-full)]",
} as const;

export function Skeleton({
  className,
  shape = "line",
  ...props
}: SkeletonProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden bg-[var(--gg-color-wash)]",
        "after:absolute after:inset-0 after:animate-[gg-shimmer_1.6s_ease-in-out_infinite] after:bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.55),transparent)]",
        shapeClasses[shape],
        className,
      )}
      {...props}
    />
  );
}

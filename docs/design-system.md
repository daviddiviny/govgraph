# GovGraph Design System

GovGraph now uses a shared design system built around typed tokens in `packages/ui/src/tokens`. Those tokens generate the CSS custom properties consumed by the app and the shared UI components.

## What To Use

- Start page work with `PageShell`, then add `SectionHeader` for major sections.
- Use `NodeCard`, `SourceCard`, and `StatCard` for the atlas views before creating new one-off layouts.
- Use `NodeTypeBadge` for node categories and `Badge` for status or metadata labels.
- Use `KeyValue`, `MetricBar`, `DataTable`, and `TimelineEntry` for structured factual content.
- Use `EmptyState` and `Skeleton` for quiet states instead of raw text placeholders.

## Token Rules

- Prefer `--gg-*` variables for all new work.
- Treat `--govgraph-*` variables as migration aliases only.
- Keep tokens authored in TypeScript and regenerate `packages/ui/src/tokens/generated.css` after changes.
- Do not hardcode palette values inside pages or components when a token already exists.

## Working Style

- Keep shared components small and composable.
- Keep page-specific flourishes, like the homepage hero treatment, inside the app.
- Avoid gradients in component defaults. If a page needs a more expressive surface, keep that styling local to the page.
- Check new patterns on `/design` before using them in live routes.

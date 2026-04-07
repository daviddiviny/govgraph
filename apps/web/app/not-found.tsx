import Link from "next/link";

import { Card, PageShell } from "@govgraph/ui";

export default function NotFound() {
  return (
    <main>
      <PageShell className="min-h-[70vh] items-center justify-center">
        <Card className="w-full max-w-3xl p-[var(--gg-space-8)] text-center">
          <p className="text-[length:var(--gg-font-size-xs)] font-semibold uppercase tracking-[var(--gg-font-letter-spacing-eyebrow)] text-[var(--gg-color-semantic-text-secondary)]">
            Missing node
          </p>
          <h1 className="mt-[var(--gg-space-4)] font-[family-name:var(--gg-font-family-display)] text-[length:var(--gg-font-size-4xl)] font-semibold tracking-[var(--gg-font-letter-spacing-tight)] text-[var(--gg-color-ink)]">
            This record isn&apos;t in the current snapshot.
          </h1>
          <p className="mt-[var(--gg-space-4)] text-[length:var(--gg-font-size-base)] leading-[var(--gg-font-line-height-body)] text-[var(--gg-color-semantic-text-secondary)]">
            The current snapshot covers the ministry, portfolio mapping,
            departments, public entities, budget documents, and the VPSC
            directory.
          </p>
          <div className="mt-[var(--gg-space-8)]">
            <Link
              href="/"
              className="inline-flex min-h-[2.9rem] items-center justify-center rounded-[var(--gg-radius-full)] border border-[var(--gg-color-ink)] bg-[var(--gg-color-ink)] px-[var(--gg-space-5)] text-[length:var(--gg-font-size-sm)] font-semibold text-[var(--gg-color-paper)] hover:bg-[var(--gg-color-deep)]"
            >
              Return home
            </Link>
          </div>
        </Card>
      </PageShell>
    </main>
  );
}

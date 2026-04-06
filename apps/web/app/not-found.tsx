import Link from "next/link";

import { Card } from "@govgraph/ui";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl items-center justify-center px-6 py-12">
      <Card className="w-full p-8 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--govgraph-muted)]">
          Missing node
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-[var(--govgraph-ink)]">
          This record isn&apos;t in the current snapshot.
        </h1>
        <p className="mt-4 text-base leading-7 text-[var(--govgraph-muted)]">
          The sprint 1 prototype only includes the current ministry, current
          portfolio mapping, and department-backed portfolio relationships.
        </p>
        <div className="mt-8">
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-full border border-[var(--govgraph-ink)] bg-[var(--govgraph-ink)] px-4 py-2 text-sm font-semibold text-[var(--govgraph-paper)] transition duration-150 hover:bg-[var(--govgraph-deep)]"
          >
            Return home
          </Link>
        </div>
      </Card>
    </main>
  );
}

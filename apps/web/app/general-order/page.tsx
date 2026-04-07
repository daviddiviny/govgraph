import type { Metadata } from "next";
import type { Route } from "next";
import Link from "next/link";

import { Badge, Card } from "@govgraph/ui";

import { loadGeneralOrderOverview } from "./_lib/data";

export const metadata: Metadata = {
  title: "General Order | GovGraph",
  description:
    "Browse the Victorian General Order allocations of Acts to ministerial offices.",
};

export const dynamic = "force-dynamic";

function EmptyState({
  title,
  body,
}: {
  title: string;
  body: string;
}) {
  return (
    <Card className="p-6">
      <h2 className="text-2xl font-semibold tracking-tight text-[var(--govgraph-ink)]">
        {title}
      </h2>
      <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--govgraph-muted)]">
        {body}
      </p>
    </Card>
  );
}

export default async function GeneralOrderPage() {
  const state = await loadGeneralOrderOverview();

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-8 px-6 py-8 sm:px-8 lg:px-10 lg:py-12">
      <header className="grid gap-6 rounded-[2rem] border border-[var(--govgraph-border)] bg-white/75 p-6 shadow-[0_24px_80px_rgba(14,44,36,0.08)] backdrop-blur-sm lg:grid-cols-[1.2fr_0.8fr] lg:p-8">
        <div className="space-y-5">
          <Link
            href="/"
            className="inline-flex text-sm font-medium uppercase tracking-[0.2em] text-[var(--govgraph-muted)] underline-offset-4 hover:underline"
          >
            Back to atlas
          </Link>
          <div className="flex flex-wrap gap-3">
            <Badge>General Order</Badge>
            <Badge>Database-backed</Badge>
          </div>
          <div className="space-y-3">
            <h1 className="max-w-4xl text-4xl font-semibold tracking-tight text-[var(--govgraph-ink)] sm:text-5xl">
              Browse Act allocations by ministerial office
            </h1>
            <p className="max-w-3xl text-base leading-8 text-[var(--govgraph-muted)] sm:text-lg">
              This view shows the latest imported Victorian General Order as a
              browsable office index, so you can move from an office to the
              Acts and carve-outs it administers.
            </p>
          </div>
        </div>

        {state.status === "ready" ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <Card className="p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--govgraph-muted)]">
                Offices
              </p>
              <p className="mt-4 text-4xl font-semibold text-[var(--govgraph-ink)]">
                {state.source.officeCount}
              </p>
              <p className="mt-2 text-sm leading-6 text-[var(--govgraph-muted)]">
                ministerial offices in the imported order.
              </p>
            </Card>
            <Card className="p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--govgraph-muted)]">
                Rules
              </p>
              <p className="mt-4 text-4xl font-semibold text-[var(--govgraph-ink)]">
                {state.source.ruleCount}
              </p>
              <p className="mt-2 text-sm leading-6 text-[var(--govgraph-muted)]">
                parsed administration rules, including shared and partial ones.
              </p>
            </Card>
          </div>
        ) : (
          <Card className="p-5">
            <p className="text-sm leading-7 text-[var(--govgraph-muted)]">
              The General Order browser reads from Postgres, so this page comes
              alive once the import has been loaded into the database.
            </p>
          </Card>
        )}
      </header>

      {state.status === "empty" ? (
        <EmptyState
          title="No General Order data loaded yet"
          body="Run the General Order import into your local Postgres database, then refresh this page. The rest of the atlas can still run without it, but this browser only shows imported records."
        />
      ) : null}

      {state.status === "error" ? (
        <EmptyState
          title="Could not reach the General Order database"
          body={`This page could not read the imported records. Make sure Postgres is running and DATABASE_URL points at the database with the imported General Order rows. Error: ${state.message}`}
        />
      ) : null}

      {state.status === "ready" ? (
        <>
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--govgraph-muted)]">
                Act entries
              </p>
              <p className="mt-4 text-4xl font-semibold text-[var(--govgraph-ink)]">
                {state.source.actEntryCount}
              </p>
              <p className="mt-2 text-sm leading-6 text-[var(--govgraph-muted)]">
                office-by-Act allocations captured from the order.
              </p>
            </Card>
            <Card className="p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--govgraph-muted)]">
                Partial rules
              </p>
              <p className="mt-4 text-4xl font-semibold text-[var(--govgraph-ink)]">
                {state.source.partialRuleCount}
              </p>
              <p className="mt-2 text-sm leading-6 text-[var(--govgraph-muted)]">
                rules that still preserve original wording alongside the parse.
              </p>
            </Card>
            <Card className="p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--govgraph-muted)]">
                Effective date
              </p>
              <p className="mt-4 text-2xl font-semibold text-[var(--govgraph-ink)]">
                {state.source.effectiveDate ?? "Not recorded"}
              </p>
              <p className="mt-2 text-sm leading-6 text-[var(--govgraph-muted)]">
                date attached to the imported source document.
              </p>
            </Card>
            <Card className="p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--govgraph-muted)]">
                Source
              </p>
              <h2 className="mt-4 text-lg font-semibold text-[var(--govgraph-ink)]">
                {state.source.title}
              </h2>
              <a
                href={state.source.sourceUrl}
                className="mt-3 inline-flex text-sm font-medium text-[var(--govgraph-accent)] underline-offset-4 hover:underline"
              >
                Open official page
              </a>
            </Card>
          </section>

          <section className="space-y-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--govgraph-muted)]">
                Offices
              </p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight text-[var(--govgraph-ink)]">
                Current office index
              </h2>
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              {state.offices.map((office) => (
                <Card
                  key={office.officeSlug}
                  className="p-5 transition-transform duration-200 hover:-translate-y-0.5"
                >
                  <div className="flex flex-wrap gap-3">
                    <Badge>{office.actEntryCount} Acts</Badge>
                    <Badge>{office.ruleCount} rules</Badge>
                    {office.sharedRuleCount > 0 ? (
                      <Badge>{office.sharedRuleCount} shared</Badge>
                    ) : null}
                    {office.partialRuleCount > 0 ? (
                      <Badge>{office.partialRuleCount} partial</Badge>
                    ) : null}
                  </div>
                  <Link
                    href={`/general-order/${office.officeSlug}` as Route}
                    className="mt-4 block text-2xl font-semibold tracking-tight text-[var(--govgraph-ink)] underline-offset-4 hover:underline"
                  >
                    {office.officeName}
                  </Link>
                  <p className="mt-2 text-sm leading-6 text-[var(--govgraph-muted)]">
                    Browse the Acts, carve-outs, and shared arrangements recorded
                    for this office in the imported order.
                  </p>
                </Card>
              ))}
            </div>
          </section>
        </>
      ) : null}
    </main>
  );
}

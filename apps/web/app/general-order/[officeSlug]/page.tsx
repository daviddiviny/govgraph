import type { Metadata } from "next";
import type { Route } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Badge, Card } from "@govgraph/ui";

import { loadGeneralOrderOffice } from "../_lib/data";
import {
  humanizeAdministrationMode,
  humanizeAdministrationScope,
  humanizeParseStatus,
  humanizeRuleKind,
  summarizeProvisionReferences,
} from "../_lib/presenters";

type GeneralOrderOfficePageProps = {
  params: Promise<{ officeSlug: string }>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: GeneralOrderOfficePageProps): Promise<Metadata> {
  const { officeSlug } = await params;
  const state = await loadGeneralOrderOffice(officeSlug);

  if (state.status !== "ready") {
    return {
      title: "General Order office | GovGraph",
    };
  }

  return {
    title: `${state.detail.officeName} | General Order | GovGraph`,
    description: `Act allocations recorded for ${state.detail.officeName} in the Victorian General Order.`,
  };
}

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

export default async function GeneralOrderOfficePage({
  params,
}: GeneralOrderOfficePageProps) {
  const { officeSlug } = await params;
  const state = await loadGeneralOrderOffice(officeSlug);

  if (state.status === "missing") {
    notFound();
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-8 px-6 py-8 sm:px-8 lg:px-10 lg:py-12">
      <header className="grid gap-6 rounded-[2rem] border border-[var(--govgraph-border)] bg-white/75 p-6 shadow-[0_24px_80px_rgba(14,44,36,0.08)] backdrop-blur-sm lg:grid-cols-[1.2fr_0.8fr] lg:p-8">
        <div className="space-y-5">
          <div className="flex flex-wrap gap-4 text-sm font-medium uppercase tracking-[0.2em] text-[var(--govgraph-muted)]">
            <Link href="/" className="underline-offset-4 hover:underline">
              Atlas
            </Link>
            <span>/</span>
            <Link
              href={"/general-order" as Route}
              className="underline-offset-4 hover:underline"
            >
              General Order
            </Link>
          </div>

          {state.status === "ready" ? (
            <>
              <div className="flex flex-wrap gap-3">
                <Badge>{state.detail.actEntryCount} Acts</Badge>
                {state.detail.partialRuleCount > 0 ? (
                  <Badge>{state.detail.partialRuleCount} partial rules</Badge>
                ) : null}
                {state.detail.source.effectiveDate ? (
                  <Badge>effective {state.detail.source.effectiveDate}</Badge>
                ) : null}
              </div>
              <div className="space-y-3">
                <h1 className="max-w-4xl text-4xl font-semibold tracking-tight text-[var(--govgraph-ink)] sm:text-5xl">
                  {state.detail.officeName}
                </h1>
                <p className="max-w-3xl text-base leading-8 text-[var(--govgraph-muted)] sm:text-lg">
                  Browse the Acts, shared provisions, and carve-outs recorded
                  for this office in the latest imported General Order.
                </p>
              </div>
            </>
          ) : null}
        </div>

        {state.status === "ready" ? (
          <Card className="p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--govgraph-muted)]">
              Source document
            </p>
            <h2 className="mt-4 text-xl font-semibold text-[var(--govgraph-ink)]">
              {state.detail.source.title}
            </h2>
            <p className="mt-2 text-sm leading-6 text-[var(--govgraph-muted)]">
              Retrieved {state.detail.source.retrievedAt.slice(0, 10)}
            </p>
            <a
              href={state.detail.source.sourceUrl}
              className="mt-4 inline-flex text-sm font-medium text-[var(--govgraph-accent)] underline-offset-4 hover:underline"
            >
              Open official page
            </a>
          </Card>
        ) : null}
      </header>

      {state.status === "empty" ? (
        <EmptyState
          title="No General Order data loaded yet"
          body="This office page needs the imported General Order rows in Postgres before it can show anything."
        />
      ) : null}

      {state.status === "error" ? (
        <EmptyState
          title="Could not load this office"
          body={`The app could not read the imported General Order data for this office. Error: ${state.message}`}
        />
      ) : null}

      {state.status === "ready" ? (
        <section className="space-y-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--govgraph-muted)]">
              Act allocations
            </p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-[var(--govgraph-ink)]">
              Imported records for this office
            </h2>
          </div>
          <div className="grid gap-4">
            {state.detail.acts.map((act) => (
              <Card key={`${act.officeName}-${act.headingText}`} className="p-5">
                <div className="flex flex-wrap gap-3">
                  <Badge>{act.headingStyle}</Badge>
                  <Badge>{act.rules.length} rules</Badge>
                </div>
                <h3 className="mt-4 text-2xl font-semibold tracking-tight text-[var(--govgraph-ink)]">
                  {act.actName}
                </h3>
                <p className="mt-2 text-sm leading-6 text-[var(--govgraph-muted)]">
                  {act.headingText}
                </p>

                <div className="mt-5 grid gap-4">
                  {act.rules.map((rule, index) => (
                    <div
                      key={`${act.headingText}-${rule.ruleKind}-${index}`}
                      className="rounded-[1.5rem] border border-[var(--govgraph-border)] bg-[var(--govgraph-paper)]/70 p-4"
                    >
                      <div className="flex flex-wrap gap-3">
                        <Badge>{humanizeRuleKind(rule.ruleKind)}</Badge>
                        <Badge>{humanizeAdministrationScope(rule.scope)}</Badge>
                        <Badge>
                          {humanizeAdministrationMode(rule.administrationMode)}
                        </Badge>
                        {rule.parseStatus !== "parsed" ? (
                          <Badge>{humanizeParseStatus(rule.parseStatus)}</Badge>
                        ) : null}
                        {rule.kanonAssistance?.status === "enriched" ? (
                          <Badge>Kanon-assisted</Badge>
                        ) : null}
                      </div>
                      <p className="mt-4 text-base leading-7 text-[var(--govgraph-ink)]">
                        {rule.rawText}
                      </p>
                      {rule.administeringOfficeNames.length > 1 ? (
                        <p className="mt-3 text-sm leading-6 text-[var(--govgraph-muted)]">
                          Also involving: {rule.administeringOfficeNames.join(", ")}
                        </p>
                      ) : null}
                      {rule.provisionReferences.length > 0 ? (
                        <p className="mt-2 text-sm leading-6 text-[var(--govgraph-muted)]">
                          Provisions:{" "}
                          {summarizeProvisionReferences(rule.provisionReferences)}
                        </p>
                      ) : null}
                      {rule.unparsedTail ? (
                        <p className="mt-2 text-sm leading-6 text-[var(--govgraph-muted)]">
                          Unparsed tail preserved: {rule.unparsedTail}
                        </p>
                      ) : null}
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}

import type { Route } from "next";
import Link from "next/link";

import { searchGovernmentCatalog } from "@govgraph/domain";
import type { GeneralOrderSearchResult } from "@govgraph/db";
import { loadGovernmentCatalog, sourceRegistry } from "@govgraph/parsers";
import { Badge, Card } from "@govgraph/ui";

import { SearchForm } from "./_components/search-form";
import { loadGeneralOrderSearch } from "./general-order/_lib/data";
import {
  firstQueryValue,
  humanizeNodeType,
  humanizeSourceFamily,
} from "./_lib/presenters";

type HomePageProps = {
  searchParams: Promise<{ q?: string | string[] | undefined }>;
};

function SearchSectionHeading({
  eyebrow,
  title,
}: {
  eyebrow: string;
  title: string;
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--govgraph-muted)]">
        {eyebrow}
      </p>
      <h3 className="mt-2 text-2xl font-semibold tracking-tight text-[var(--govgraph-ink)]">
        {title}
      </h3>
    </div>
  );
}

function EmptySearchState({ body }: { body: string }) {
  return (
    <Card className="p-6">
      <h3 className="text-2xl font-semibold tracking-tight text-[var(--govgraph-ink)]">
        No matches yet
      </h3>
      <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--govgraph-muted)]">
        {body}
      </p>
    </Card>
  );
}

function GeneralOrderSearchCard({
  result,
}: {
  result: GeneralOrderSearchResult;
}) {
  if (result.kind === "office") {
    return (
      <Card className="p-5 transition-transform duration-200 hover:-translate-y-0.5">
        <div className="flex flex-wrap gap-3">
          <Badge>General Order office</Badge>
          <Badge>{result.actEntryCount} Acts</Badge>
          <Badge>{result.ruleCount} rules</Badge>
          {result.sharedRuleCount > 0 ? (
            <Badge>{result.sharedRuleCount} shared</Badge>
          ) : null}
          {result.partialRuleCount > 0 ? (
            <Badge>{result.partialRuleCount} partial</Badge>
          ) : null}
        </div>
        <Link
          href={`/general-order/${result.officeSlug}` as Route}
          className="mt-4 block text-2xl font-semibold tracking-tight text-[var(--govgraph-ink)] underline-offset-4 hover:underline"
        >
          {result.officeName}
        </Link>
        <p className="mt-2 text-sm leading-6 text-[var(--govgraph-muted)]">
          Browse the Acts and carve-outs recorded for this office in the latest
          imported General Order.
        </p>
        <p className="mt-3 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--govgraph-muted)]">
          Match: {result.matchReason}
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-5 transition-transform duration-200 hover:-translate-y-0.5">
      <div className="flex flex-wrap gap-3">
        <Badge>General Order Act</Badge>
        <Badge>{result.ruleCount} rules</Badge>
        {result.sharedRuleCount > 0 ? <Badge>{result.sharedRuleCount} shared</Badge> : null}
        {result.partialRuleCount > 0 ? (
          <Badge>{result.partialRuleCount} partial</Badge>
        ) : null}
      </div>
      <Link
        href={`/general-order/${result.officeSlug}` as Route}
        className="mt-4 block text-2xl font-semibold tracking-tight text-[var(--govgraph-ink)] underline-offset-4 hover:underline"
      >
        {result.actName}
      </Link>
      <p className="mt-2 text-sm font-medium leading-6 text-[var(--govgraph-muted)]">
        Under {result.officeName}
      </p>
      <p className="mt-2 text-sm leading-6 text-[var(--govgraph-muted)]">
        {result.previewText}
      </p>
      <p className="mt-3 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--govgraph-muted)]">
        Match: {result.matchReason}
      </p>
    </Card>
  );
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const { q } = await searchParams;
  const query = firstQueryValue(q)?.trim();
  const [catalog, generalOrderSearch] = await Promise.all([
    loadGovernmentCatalog(),
    query ? loadGeneralOrderSearch(query) : Promise.resolve({ status: "empty" as const }),
  ]);
  const results = query ? searchGovernmentCatalog(catalog, query, 12) : [];
  const generalOrderResults =
    generalOrderSearch.status === "ready" ? generalOrderSearch.results : [];
  const totalSearchMatches = results.length + generalOrderResults.length;
  const featuredNodes = [
    ...catalog.nodes.filter((node) => node.nodeType === "budget_document").slice(0, 2),
    ...catalog.nodes.filter((node) => node.nodeType === "public_entity").slice(0, 2),
    ...catalog.nodes.filter((node) => node.nodeType === "department").slice(0, 2),
    ...catalog.nodes.filter((node) => node.nodeType === "ministerial_office").slice(0, 1),
    ...catalog.nodes.filter((node) => node.nodeType === "person").slice(0, 1),
  ].slice(0, 8);
  const implementedConnectors = sourceRegistry.filter(
    (entry) => entry.implementationStatus === "implemented",
  );

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-8 px-6 py-8 sm:px-8 lg:px-10 lg:py-12">
      <section className="relative overflow-hidden rounded-[2.5rem] border border-[var(--govgraph-border)] bg-[linear-gradient(135deg,rgba(255,255,255,0.9),rgba(250,245,235,0.92))] p-6 shadow-[0_30px_90px_rgba(14,44,36,0.09)] backdrop-blur-sm sm:p-8 lg:p-10">
        <div className="absolute -right-16 top-0 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(185,74,55,0.22),rgba(185,74,55,0))]" />
        <div className="absolute -left-8 bottom-0 h-40 w-40 rounded-full bg-[radial-gradient(circle,rgba(32,96,79,0.18),rgba(32,96,79,0))]" />
        <div className="relative grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-6">
            <div className="flex flex-wrap gap-3">
              <Badge>Official source first</Badge>
              <Badge>Sprint 2 underway</Badge>
            </div>
            <div className="space-y-4">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--govgraph-muted)]">
                Victorian Government Map
              </p>
              <h1 className="max-w-4xl text-5xl font-semibold tracking-tight text-[var(--govgraph-ink)] sm:text-6xl">
                Search the Victorian Government across offices, entities, and budget papers.
              </h1>
              <p className="max-w-3xl text-base leading-8 text-[var(--govgraph-muted)] sm:text-lg">
                The graph now combines the current ministry and office map
                with the VPSC employers directory and the Victorian Budget paper
                index, plus structured budget outputs and performance measures,
                so public entities and budget records sit beside the core
                government structure.
              </p>
            </div>
            <SearchForm {...(query ? { defaultValue: query } : {})} />
            <div className="flex flex-wrap gap-4 text-sm font-medium text-[var(--govgraph-muted)]">
              <Link
                href={"/general-order" as Route}
                className="underline-offset-4 hover:text-[var(--govgraph-accent)] hover:underline"
              >
                Browse General Order Act allocations
              </Link>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
            <Card className="p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--govgraph-muted)]">
                Live snapshot
              </p>
              <p className="mt-4 text-4xl font-semibold text-[var(--govgraph-ink)]">
                {catalog.summary.totalNodes}
              </p>
              <p className="mt-2 text-sm leading-6 text-[var(--govgraph-muted)]">
                records across ministers, offices, departments, public entities, outputs,
                measures, and budget documents.
              </p>
            </Card>
            <Card className="p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--govgraph-muted)]">
                Connectors
              </p>
              <p className="mt-4 text-4xl font-semibold text-[var(--govgraph-ink)]">
                {implementedConnectors.length}
              </p>
              <p className="mt-2 text-sm leading-6 text-[var(--govgraph-muted)]">
                live parsers feeding the search and node pages right now.
              </p>
            </Card>
            <Card className="p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--govgraph-muted)]">
                Public entities
              </p>
              <p className="mt-4 text-4xl font-semibold text-[var(--govgraph-ink)]">
                {catalog.summary.countsByType.public_entity}
              </p>
              <p className="mt-2 text-sm leading-6 text-[var(--govgraph-muted)]">
                employer records pulled in from the live VPSC directory snapshot.
              </p>
            </Card>
            <Card className="p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--govgraph-muted)]">
                Budget documents
              </p>
              <p className="mt-4 text-4xl font-semibold text-[var(--govgraph-ink)]">
                {catalog.summary.countsByType.budget_document}
              </p>
              <p className="mt-2 text-sm leading-6 text-[var(--govgraph-muted)]">
                indexed papers and budget tools now searchable from the same atlas.
              </p>
            </Card>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-4">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--govgraph-muted)]">
                Search results
              </p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight text-[var(--govgraph-ink)]">
                {query ? `Results for “${query}”` : "Featured records"}
              </h2>
            </div>
            {query ? (
              <p className="text-sm text-[var(--govgraph-muted)]">
                {totalSearchMatches} matches
              </p>
            ) : null}
          </div>

          <div className="grid gap-4">
            {query ? (
              <>
                {results.length > 0 ? (
                  <>
                    <SearchSectionHeading
                      eyebrow="Atlas results"
                      title="Current graph records"
                    />
                    {results.map((result) => {
                      const node = result.node;

                      return (
                        <Card
                          key={node.id}
                          className="p-5 transition-transform duration-200 hover:-translate-y-0.5"
                        >
                          <div className="flex flex-wrap gap-3">
                            <Badge>{humanizeNodeType(node.nodeType)}</Badge>
                          </div>
                          <Link
                            href={`/nodes/${node.slug}`}
                            className="mt-4 block text-2xl font-semibold tracking-tight text-[var(--govgraph-ink)] underline-offset-4 hover:underline"
                          >
                            {node.canonicalName}
                          </Link>
                          <p className="mt-2 text-sm leading-6 text-[var(--govgraph-muted)]">
                            {node.description ??
                              "Current record in the live government graph snapshot."}
                          </p>
                        </Card>
                      );
                    })}
                  </>
                ) : null}

                {generalOrderSearch.status === "ready" &&
                generalOrderResults.length > 0 ? (
                  <>
                    <SearchSectionHeading
                      eyebrow="General Order"
                      title="Act allocations and offices"
                    />
                    {generalOrderResults.map((result) => (
                      <GeneralOrderSearchCard
                        key={
                          result.kind === "office"
                            ? `office-${result.officeSlug}`
                            : `act-${result.officeSlug}-${result.actName}-${result.headingText}`
                        }
                        result={result}
                      />
                    ))}
                  </>
                ) : null}

                {generalOrderSearch.status === "empty" ? (
                  <Card className="p-5">
                    <h3 className="text-xl font-semibold text-[var(--govgraph-ink)]">
                      General Order records are not loaded yet
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-[var(--govgraph-muted)]">
                      The main atlas search is working, but Act allocation matches
                      will only appear after the General Order import has been
                      loaded into Postgres.
                    </p>
                  </Card>
                ) : null}

                {generalOrderSearch.status === "error" ? (
                  <Card className="p-5">
                    <h3 className="text-xl font-semibold text-[var(--govgraph-ink)]">
                      General Order search is unavailable right now
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-[var(--govgraph-muted)]">
                      The rest of the atlas search still works, but the app could
                      not reach the imported General Order records. Error:{" "}
                      {generalOrderSearch.message}
                    </p>
                  </Card>
                ) : null}

                {results.length === 0 &&
                generalOrderResults.length === 0 &&
                generalOrderSearch.status === "ready" ? (
                  <EmptySearchState body="Try another office, Act title, or provision reference." />
                ) : null}
              </>
            ) : (
              featuredNodes.map((node) => (
                <Card
                  key={node.id}
                  className="p-5 transition-transform duration-200 hover:-translate-y-0.5"
                >
                  <div className="flex flex-wrap gap-3">
                    <Badge>{humanizeNodeType(node.nodeType)}</Badge>
                  </div>
                  <Link
                    href={`/nodes/${node.slug}`}
                    className="mt-4 block text-2xl font-semibold tracking-tight text-[var(--govgraph-ink)] underline-offset-4 hover:underline"
                  >
                    {node.canonicalName}
                  </Link>
                  <p className="mt-2 text-sm leading-6 text-[var(--govgraph-muted)]">
                    {node.description ??
                      "Current record in the live government graph snapshot."}
                  </p>
                </Card>
              ))
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--govgraph-muted)]">
              Source registry
            </p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-[var(--govgraph-ink)]">
              Current connectors
            </h2>
          </div>
          <div className="grid gap-4">
            {sourceRegistry.map((entry) => (
              <Card key={entry.id} className="p-5">
                <div className="flex flex-wrap gap-3">
                  <Badge>{humanizeSourceFamily(entry.sourceFamily)}</Badge>
                  <Badge>{entry.implementationStatus}</Badge>
                </div>
                <h3 className="mt-4 text-xl font-semibold text-[var(--govgraph-ink)]">
                  {entry.name}
                </h3>
                <p className="mt-2 text-sm leading-6 text-[var(--govgraph-muted)]">
                  {entry.description}
                </p>
                <p className="mt-3 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--govgraph-muted)]">
                  {entry.cadence}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

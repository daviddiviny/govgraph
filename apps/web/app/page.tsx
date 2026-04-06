import Link from "next/link";

import { searchGovernmentCatalog } from "@govgraph/domain";
import { loadGovernmentCatalog, sourceRegistry } from "@govgraph/parsers";
import { Badge, Card } from "@govgraph/ui";

import { SearchForm } from "./_components/search-form";
import {
  firstQueryValue,
  humanizeNodeType,
  humanizeSourceFamily,
} from "./_lib/presenters";

type HomePageProps = {
  searchParams: Promise<{ q?: string | string[] | undefined }>;
};

export default async function HomePage({ searchParams }: HomePageProps) {
  const { q } = await searchParams;
  const query = firstQueryValue(q)?.trim();
  const catalog = await loadGovernmentCatalog();
  const results = query ? searchGovernmentCatalog(catalog, query, 12) : [];
  const featuredNodes = catalog.nodes
    .filter((node) =>
      ["person", "portfolio", "department"].includes(node.nodeType),
    )
    .slice(0, 6);
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
              <Badge>Sprint 1 prototype</Badge>
            </div>
            <div className="space-y-4">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--govgraph-muted)]">
                Victorian Government Map
              </p>
              <h1 className="max-w-4xl text-5xl font-semibold tracking-tight text-[var(--govgraph-ink)] sm:text-6xl">
                A civic atlas for ministers, portfolios, and departments.
              </h1>
              <p className="max-w-3xl text-base leading-8 text-[var(--govgraph-muted)] sm:text-lg">
                This first sprint turns the current ministry and VPSC portfolio
                structure into a searchable graph, with every visible fact
                linked back to the source pages that produced it.
              </p>
            </div>
            <SearchForm {...(query ? { defaultValue: query } : {})} />
          </div>

          <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
            <Card className="p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--govgraph-muted)]">
                Live snapshot
              </p>
              <p className="mt-4 text-4xl font-semibold text-[var(--govgraph-ink)]">
                {catalog.summary.totalNodes}
              </p>
              <p className="mt-2 text-sm leading-6 text-[var(--govgraph-muted)]">
                nodes across people, portfolios, departments, and the current
                ministry.
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
                Relationships
              </p>
              <p className="mt-4 text-4xl font-semibold text-[var(--govgraph-ink)]">
                {catalog.summary.totalEdges}
              </p>
              <p className="mt-2 text-sm leading-6 text-[var(--govgraph-muted)]">
                current links between ministers, portfolios, departments, and
                the ministry.
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
                {results.length} matches
              </p>
            ) : null}
          </div>

          <div className="grid gap-4">
            {(query ? results.map((result) => result.node) : featuredNodes).map(
              (node) => (
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
              ),
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--govgraph-muted)]">
              Source registry
            </p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-[var(--govgraph-ink)]">
              Sprint 1 connectors
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

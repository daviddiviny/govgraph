import type { Route } from "next";
import Link from "next/link";

import { searchGovernmentCatalog } from "@govgraph/domain";
import type { GeneralOrderSearchResult } from "@govgraph/db";
import { loadGovernmentCatalog, sourceRegistry } from "@govgraph/parsers";
import {
  Badge,
  EmptyState,
  NodeCard,
  NodeTypeBadge,
  PageShell,
  SectionHeader,
  SourceCard,
  StatCard,
} from "@govgraph/ui";

import { GovernmentAtlasGraph } from "./_components/government-atlas-graph";
import { SearchForm } from "./_components/search-form";
import { loadGeneralOrderSearch } from "./general-order/_lib/data";
import { buildHomeGraph } from "./_lib/home-graph";
import { firstQueryValue, humanizeSourceFamily } from "./_lib/presenters";

type HomePageProps = {
  searchParams: Promise<{ q?: string | string[] | undefined }>;
};

function SearchSubsectionHeading({
  eyebrow,
  title,
}: {
  eyebrow: string;
  title: string;
}) {
  return (
    <div className="space-y-[var(--gg-space-1)]">
      <p className="text-[length:var(--gg-font-size-xs)] font-semibold uppercase tracking-[var(--gg-font-letter-spacing-eyebrow)] text-[var(--gg-color-semantic-text-secondary)]">
        {eyebrow}
      </p>
      <h3 className="font-[family-name:var(--gg-font-family-display)] text-[length:var(--gg-font-size-2xl)] font-semibold tracking-[var(--gg-font-letter-spacing-tight)] text-[var(--gg-color-ink)]">
        {title}
      </h3>
    </div>
  );
}

function GeneralOrderSearchCard({
  result,
}: {
  result: GeneralOrderSearchResult;
}) {
  if (result.kind === "office") {
    return (
      <NodeCard
        badges={
          <>
            <Badge tone="accent">General Order office</Badge>
            <Badge>{result.actEntryCount} Acts</Badge>
            <Badge>{result.ruleCount} rules</Badge>
            {result.sharedRuleCount > 0 ? (
              <Badge tone="muted">{result.sharedRuleCount} shared</Badge>
            ) : null}
            {result.partialRuleCount > 0 ? (
              <Badge tone="warning">{result.partialRuleCount} partial</Badge>
            ) : null}
          </>
        }
        description="Browse the Acts and carve-outs recorded for this office in the latest imported General Order."
        footer={
          <p className="text-[length:var(--gg-font-size-xs)] font-semibold uppercase tracking-[var(--gg-font-letter-spacing-caps)] text-[var(--gg-color-semantic-text-secondary)]">
            Match: {result.matchReason}
          </p>
        }
        title={
          <Link
            href={`/general-order/${result.officeSlug}` as Route}
            className="underline-offset-4 hover:underline"
          >
            {result.officeName}
          </Link>
        }
      />
    );
  }

  return (
    <NodeCard
      badges={
        <>
          <Badge tone="accent">General Order Act</Badge>
          <Badge>{result.ruleCount} rules</Badge>
          {result.sharedRuleCount > 0 ? (
            <Badge tone="muted">{result.sharedRuleCount} shared</Badge>
          ) : null}
          {result.partialRuleCount > 0 ? (
            <Badge tone="warning">{result.partialRuleCount} partial</Badge>
          ) : null}
        </>
      }
      description={<span className="font-medium">Under {result.officeName}</span>}
      footer={
        <div className="space-y-[var(--gg-space-2)]">
          <p className="text-[length:var(--gg-font-size-sm)] leading-[var(--gg-font-line-height-body)] text-[var(--gg-color-semantic-text-secondary)]">
            {result.previewText}
          </p>
          <p className="text-[length:var(--gg-font-size-xs)] font-semibold uppercase tracking-[var(--gg-font-letter-spacing-caps)] text-[var(--gg-color-semantic-text-secondary)]">
            Match: {result.matchReason}
          </p>
        </div>
      }
      title={
        <Link
          href={`/general-order/${result.officeSlug}` as Route}
          className="underline-offset-4 hover:underline"
        >
          {result.actName}
        </Link>
      }
    />
  );
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const { q } = await searchParams;
  const query = firstQueryValue(q)?.trim();
  const [catalog, generalOrderSearch] = await Promise.all([
    loadGovernmentCatalog(),
    query
      ? loadGeneralOrderSearch(query)
      : Promise.resolve({ status: "empty" as const }),
  ]);
  const results = query ? searchGovernmentCatalog(catalog, query, 12) : [];
  const homeGraph = buildHomeGraph(catalog, query);
  const featuredNodes = homeGraph.nodes.slice(0, 8);
  const generalOrderResults =
    generalOrderSearch.status === "ready" ? generalOrderSearch.results : [];
  const totalSearchMatches = results.length + generalOrderResults.length;
  const implementedConnectors = sourceRegistry.filter(
    (entry) => entry.implementationStatus === "implemented",
  );

  return (
    <main>
      <PageShell className="max-w-[92rem] gap-[var(--gg-space-10)]">
        <section className="relative overflow-hidden rounded-[var(--gg-radius-2xl)] border border-[var(--gg-color-border)] bg-[linear-gradient(135deg,rgba(255,255,255,0.9),rgba(250,245,235,0.92))] p-[var(--gg-space-6)] shadow-[var(--gg-shadow-lg)] backdrop-blur-sm sm:p-[var(--gg-space-8)] lg:p-[var(--gg-space-10)]">
          <div className="absolute -right-24 top-0 h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(185,74,55,0.22),rgba(185,74,55,0))]" />
          <div className="absolute -left-10 bottom-0 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(32,96,79,0.18),rgba(32,96,79,0))]" />

          <div className="relative grid gap-[var(--gg-space-8)] xl:grid-cols-[0.68fr_1.32fr] xl:items-start">
            <div className="space-y-[var(--gg-space-6)]">
              <div className="flex flex-wrap gap-[var(--gg-space-3)]">
                <Badge tone="accent">Official source first</Badge>
                <Badge tone="success">Graph-led homepage</Badge>
              </div>

              <div className="space-y-[var(--gg-space-4)]">
                <p className="text-[length:var(--gg-font-size-xs)] font-semibold uppercase tracking-[var(--gg-font-letter-spacing-eyebrow)] text-[var(--gg-color-semantic-text-secondary)]">
                  Victorian Government Atlas
                </p>
                <h1 className="max-w-4xl font-[family-name:var(--gg-font-family-display)] text-[length:var(--gg-font-size-5xl)] font-semibold tracking-[var(--gg-font-letter-spacing-tight)] text-[var(--gg-color-ink)] sm:text-[length:var(--gg-font-size-6xl)]">
                  Explore the website as a living map of relationships, not just a
                  search box.
                </h1>
                <p className="max-w-3xl text-[length:var(--gg-font-size-base)] leading-[var(--gg-font-line-height-relaxed)] text-[var(--gg-color-semantic-text-secondary)] sm:text-[length:var(--gg-font-size-lg)]">
                  GovGraph now opens on a visual network of ministers, offices,
                  departments, public entities, and published outputs so the
                  shape of government is visible before you drill into records.
                </p>
              </div>

              <div className="space-y-[var(--gg-space-4)]">
                <SearchForm
                  {...(query ? { defaultValue: query } : {})}
                  placeholder="Search the graph by minister, office, department, or entity"
                  size="lg"
                />
                <div className="flex flex-wrap gap-[var(--gg-space-4)] text-[length:var(--gg-font-size-sm)] font-medium text-[var(--gg-color-semantic-text-secondary)]">
                  <Link
                    href={"/general-order" as Route}
                    className="underline-offset-4 hover:text-[var(--gg-color-deep)] hover:underline"
                  >
                    Browse General Order Act allocations
                  </Link>
                  <Link
                    href={featuredNodes[0]?.href ?? ("/" as Route)}
                    className="underline-offset-4 hover:text-[var(--gg-color-deep)] hover:underline"
                  >
                    Open a featured graph record
                  </Link>
                </div>
              </div>
            </div>

            <GovernmentAtlasGraph graph={homeGraph} query={query} />
          </div>

          <div className="relative mt-[var(--gg-space-8)] grid gap-[var(--gg-space-4)] sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              description="Active nodes participating in the relationship map right now."
              label="Connected records"
              value={homeGraph.summary.connectedNodes}
            />
            <StatCard
              description="Direct relationships currently feeding the visual network."
              label="Live links"
              value={homeGraph.summary.connectedEdges}
            />
            <StatCard
              description="Budget papers and source documents searchable outside the live map."
              label="Searchable documents"
              value={homeGraph.summary.isolatedDocuments}
            />
            <StatCard
              description="Source pipelines currently keeping the atlas fresh."
              label="Connectors"
              value={implementedConnectors.length}
            />
          </div>
        </section>

        <section className="grid gap-[var(--gg-space-6)] lg:grid-cols-[1.18fr_0.82fr]">
          <div className="space-y-[var(--gg-space-4)]">
            <SectionHeader
              eyebrow="Search and records"
              title={query ? `Results for “${query}”` : "Records featured in the map"}
              trailing={
                query
                  ? `${totalSearchMatches} ${totalSearchMatches === 1 ? "match" : "matches"}`
                  : undefined
              }
            />

            <div className="grid gap-[var(--gg-space-4)]">
              {query ? (
                <>
                  <SearchSubsectionHeading
                    eyebrow="Atlas results"
                    title="Current graph records"
                  />
                  {results.length > 0 ? (
                    results.map((result) => {
                      const node = result.node;

                      return (
                        <NodeCard
                          key={node.id}
                          badges={
                            <>
                              <NodeTypeBadge nodeType={node.nodeType} />
                              <Badge tone="muted">{result.matchReason}</Badge>
                            </>
                          }
                          description={
                            node.description ??
                            "Current record in the live government graph snapshot."
                          }
                          title={
                            <Link
                              href={`/nodes/${node.slug}` as Route}
                              className="underline-offset-4 hover:underline"
                            >
                              {node.canonicalName}
                            </Link>
                          }
                        />
                      );
                    })
                  ) : (
                    <EmptyState
                      description={`Try a minister title, department name, public entity, or budget keyword from the current Victorian Government data.`}
                      title={`No live records match “${query}”`}
                    />
                  )}

                  <SearchSubsectionHeading
                    eyebrow="General Order"
                    title="Act allocations and offices"
                  />
                  {generalOrderSearch.status === "ready" ? (
                    generalOrderResults.length > 0 ? (
                      generalOrderResults.map((result) => (
                        <GeneralOrderSearchCard
                          key={
                            result.kind === "office"
                              ? `office-${result.officeSlug}`
                              : `act-${result.officeSlug}-${result.actName}-${result.headingText}`
                          }
                          result={result}
                        />
                      ))
                    ) : (
                      <EmptyState
                        description={`No imported Act allocations matched “${query}”. Try an office name, Act title, or provision reference.`}
                        title="No General Order matches"
                      />
                    )
                  ) : null}
                  {generalOrderSearch.status === "empty" ? (
                    <EmptyState
                      description="The main atlas search still works, but Act allocation matches only appear after the General Order import has been loaded into Postgres."
                      title="General Order records are not loaded yet"
                    />
                  ) : null}
                  {generalOrderSearch.status === "error" ? (
                    <EmptyState
                      description={`The rest of the atlas search still works, but the app could not reach the imported General Order records. Error: ${generalOrderSearch.message}`}
                      title="General Order search is unavailable"
                    />
                  ) : null}
                </>
              ) : (
                featuredNodes.map((node) => (
                  <NodeCard
                    key={node.id}
                    badges={
                      <>
                        <NodeTypeBadge nodeType={node.nodeType} />
                        <Badge tone="muted">
                          {node.degree} live link{node.degree === 1 ? "" : "s"}
                        </Badge>
                      </>
                    }
                    description={
                      node.description ??
                      "Current record in the live government graph snapshot."
                    }
                    title={
                      <Link
                        href={node.href}
                        className="underline-offset-4 hover:underline"
                      >
                        {node.label}
                      </Link>
                    }
                  />
                ))
              )}
            </div>
          </div>

          <div className="space-y-[var(--gg-space-4)]">
            <SectionHeader
              eyebrow="Graph inputs"
              title="Current connectors"
              description="These source pipelines are what keep the map grounded in official records instead of static hand-written content."
            />
            <div className="grid gap-[var(--gg-space-4)]">
              {sourceRegistry.map((entry) => (
                <SourceCard
                  key={entry.id}
                  badges={
                    <>
                      <Badge>{humanizeSourceFamily(entry.sourceFamily)}</Badge>
                      <Badge
                        tone={
                          entry.implementationStatus === "implemented"
                            ? "success"
                            : "muted"
                        }
                      >
                        {entry.implementationStatus}
                      </Badge>
                    </>
                  }
                  description={entry.description}
                  metadata={entry.cadence}
                  title={entry.name}
                />
              ))}
            </div>
          </div>
        </section>
      </PageShell>
    </main>
  );
}

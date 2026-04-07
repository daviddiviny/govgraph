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

import { SearchForm } from "./_components/search-form";
import { loadGeneralOrderSearch } from "./general-order/_lib/data";
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
      description={
        <>
          <span className="font-medium">Under {result.officeName}</span>
        </>
      }
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
  const generalOrderResults =
    generalOrderSearch.status === "ready" ? generalOrderSearch.results : [];
  const totalSearchMatches = results.length + generalOrderResults.length;
  const featuredNodes = [
    ...catalog.nodes
      .filter((node) => node.nodeType === "budget_document")
      .slice(0, 2),
    ...catalog.nodes
      .filter((node) => node.nodeType === "public_entity")
      .slice(0, 2),
    ...catalog.nodes.filter((node) => node.nodeType === "department").slice(0, 2),
    ...catalog.nodes
      .filter((node) => node.nodeType === "ministerial_office")
      .slice(0, 1),
    ...catalog.nodes.filter((node) => node.nodeType === "person").slice(0, 1),
  ].slice(0, 8);
  const implementedConnectors = sourceRegistry.filter(
    (entry) => entry.implementationStatus === "implemented",
  );

  return (
    <main>
      <PageShell className="gap-[var(--gg-space-10)]">
        <section className="relative overflow-hidden rounded-[var(--gg-radius-2xl)] border border-[var(--gg-color-border)] bg-[linear-gradient(135deg,rgba(255,255,255,0.9),rgba(250,245,235,0.92))] p-[var(--gg-space-6)] shadow-[var(--gg-shadow-lg)] backdrop-blur-sm sm:p-[var(--gg-space-8)] lg:p-[var(--gg-space-10)]">
          <div className="absolute -right-16 top-0 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(185,74,55,0.22),rgba(185,74,55,0))]" />
          <div className="absolute -left-8 bottom-0 h-40 w-40 rounded-full bg-[radial-gradient(circle,rgba(32,96,79,0.18),rgba(32,96,79,0))]" />
          <div className="relative grid gap-[var(--gg-space-8)] lg:grid-cols-[1.2fr_0.8fr]">
            <div className="space-y-[var(--gg-space-6)]">
              <div className="flex flex-wrap gap-[var(--gg-space-3)]">
                <Badge tone="accent">Official source first</Badge>
                <Badge tone="success">Sprint 2 underway</Badge>
              </div>
              <div className="space-y-[var(--gg-space-4)]">
                <p className="text-[length:var(--gg-font-size-xs)] font-semibold uppercase tracking-[var(--gg-font-letter-spacing-eyebrow)] text-[var(--gg-color-semantic-text-secondary)]">
                  Victorian Government Map
                </p>
                <h1 className="max-w-4xl font-[family-name:var(--gg-font-family-display)] text-[length:var(--gg-font-size-5xl)] font-semibold tracking-[var(--gg-font-letter-spacing-tight)] text-[var(--gg-color-ink)] sm:text-[length:var(--gg-font-size-6xl)]">
                  Search the Victorian Government across structure, offices,
                  entities, and budget papers.
                </h1>
                <p className="max-w-3xl text-[length:var(--gg-font-size-base)] leading-[var(--gg-font-line-height-relaxed)] text-[var(--gg-color-semantic-text-secondary)] sm:text-[length:var(--gg-font-size-lg)]">
                  The graph now combines the current ministry and office map
                  with the VPSC employers directory and the Victorian Budget
                  paper index, plus structured budget outputs and performance
                  measures, so public entities and budget records sit beside
                  the core government structure.
                </p>
              </div>
              <div className="space-y-[var(--gg-space-4)]">
                <SearchForm
                  {...(query ? { defaultValue: query } : {})}
                  size="lg"
                />
                <div className="flex flex-wrap gap-[var(--gg-space-4)] text-[length:var(--gg-font-size-sm)] font-medium text-[var(--gg-color-semantic-text-secondary)]">
                  <Link
                    href={"/general-order" as Route}
                    className="underline-offset-4 hover:text-[var(--gg-color-deep)] hover:underline"
                  >
                    Browse General Order Act allocations
                  </Link>
                </div>
              </div>
            </div>

            <div className="grid gap-[var(--gg-space-4)] sm:grid-cols-2 lg:grid-cols-2">
              <StatCard
                description="Records across ministers, offices, departments, public entities, outputs, measures, and budget documents."
                label="Live snapshot"
                value={catalog.summary.totalNodes}
              />
              <StatCard
                description="Live parsers feeding the search and node pages right now."
                label="Connectors"
                value={implementedConnectors.length}
              />
              <StatCard
                description="Employer records pulled in from the live VPSC directory snapshot."
                label="Public entities"
                value={catalog.summary.countsByType.public_entity}
              />
              <StatCard
                description="Indexed papers and budget tools now searchable from the same atlas."
                label="Budget documents"
                value={catalog.summary.countsByType.budget_document}
              />
            </div>
          </div>
        </section>

        <section className="grid gap-[var(--gg-space-6)] lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-[var(--gg-space-4)]">
            <SectionHeader
              eyebrow="Search results"
              title={query ? `Results for “${query}”` : "Featured records"}
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
                  {results.length === 0 ? (
                    <EmptyState
                      description={`Try a minister title, department name, public entity, or budget keyword from the current Victorian Government data.`}
                      title={`No live records match “${query}”`}
                    />
                  ) : (
                    results.map((result) => {
                      const node = result.node;

                      return (
                        <NodeCard
                          key={node.id}
                          badges={<NodeTypeBadge nodeType={node.nodeType} />}
                          description={
                            node.description ??
                            "Current record in the live government graph snapshot."
                          }
                          title={
                            <Link
                              href={`/nodes/${node.slug}`}
                              className="underline-offset-4 hover:underline"
                            >
                              {node.canonicalName}
                            </Link>
                          }
                        />
                      );
                    })
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
                    badges={<NodeTypeBadge nodeType={node.nodeType} />}
                    description={
                      node.description ??
                      "Current record in the live government graph snapshot."
                    }
                    title={
                      <Link
                        href={`/nodes/${node.slug}`}
                        className="underline-offset-4 hover:underline"
                      >
                        {node.canonicalName}
                      </Link>
                    }
                  />
                ))
              )}
            </div>
          </div>

          <div className="space-y-[var(--gg-space-4)]">
            <SectionHeader
              eyebrow="Source registry"
              title="Current connectors"
              description="Every live parser feeding the atlas, shown with its source family, cadence, and current implementation status."
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

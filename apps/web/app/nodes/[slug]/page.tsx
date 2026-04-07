import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getNodeProfile } from "@govgraph/domain";
import { loadGovernmentCatalog } from "@govgraph/parsers";
import {
  Badge,
  Breadcrumb,
  Card,
  KeyValue,
  NodeTypeBadge,
  PageShell,
  SectionHeader,
  SourceCard,
} from "@govgraph/ui";

import { RelationshipList } from "../../_components/relationship-list";
import { SearchForm } from "../../_components/search-form";
import { humanizeNodeType, humanizeSourceFamily } from "../../_lib/presenters";

type NodePageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params,
}: NodePageProps): Promise<Metadata> {
  const { slug } = await params;
  const catalog = await loadGovernmentCatalog();
  const profile = getNodeProfile(catalog, slug);

  if (!profile) {
    return {
      title: "Node not found | GovGraph",
    };
  }

  return {
    title: `${profile.node.canonicalName} | GovGraph`,
    description:
      profile.node.description ??
      `Relationship and source view for ${profile.node.canonicalName}.`,
  };
}

export default async function NodePage({ params }: NodePageProps) {
  const { slug } = await params;
  const catalog = await loadGovernmentCatalog();
  const profile = getNodeProfile(catalog, slug);

  if (!profile) {
    notFound();
  }

  return (
    <main>
      <PageShell className="gap-[var(--gg-space-10)]">
        <header className="grid gap-[var(--gg-space-8)] rounded-[var(--gg-radius-xl)] border border-[var(--gg-color-border)] bg-[color:rgba(255,255,255,0.74)] p-[var(--gg-space-6)] shadow-[var(--gg-shadow-lg)] backdrop-blur-sm lg:grid-cols-[1.3fr_0.7fr] lg:p-[var(--gg-space-8)]">
          <div className="space-y-[var(--gg-space-5)]">
            <Breadcrumb
              items={[
                {
                  content: (
                    <Link href="/" className="underline-offset-4 hover:underline">
                      Home
                    </Link>
                  ),
                },
                {
                  content: (
                    <span>{humanizeNodeType(profile.node.nodeType)}</span>
                  ),
                },
                {
                  content: <span>{profile.node.canonicalName}</span>,
                  current: true,
                },
              ]}
            />
            <div className="flex flex-wrap gap-[var(--gg-space-3)]">
              <NodeTypeBadge nodeType={profile.node.nodeType} />
              <Badge tone="muted">{profile.relatedNodes.length} linked records</Badge>
            </div>
            <div className="space-y-[var(--gg-space-3)]">
              <h1 className="max-w-4xl font-[family-name:var(--gg-font-family-display)] text-[length:var(--gg-font-size-4xl)] font-semibold tracking-[var(--gg-font-letter-spacing-tight)] text-[var(--gg-color-ink)] sm:text-[length:var(--gg-font-size-5xl)]">
                {profile.node.canonicalName}
              </h1>
              <p className="max-w-3xl text-[length:var(--gg-font-size-base)] leading-[var(--gg-font-line-height-body)] text-[var(--gg-color-semantic-text-secondary)] sm:text-[length:var(--gg-font-size-lg)]">
                {profile.node.description ??
                  "This node is part of the current government map snapshot."}
              </p>
              {profile.node.websiteUrl ? (
                <a
                  href={profile.node.websiteUrl}
                  className="inline-flex text-[length:var(--gg-font-size-sm)] font-medium text-[var(--gg-color-accent)] underline-offset-4 hover:underline"
                >
                  Open official page
                </a>
              ) : null}
            </div>
          </div>

          <div className="grid gap-[var(--gg-space-4)]">
            <Card className="p-[var(--gg-space-5)]">
              <p className="text-[length:var(--gg-font-size-xs)] font-semibold uppercase tracking-[var(--gg-font-letter-spacing-caps)] text-[var(--gg-color-semantic-text-secondary)]">
                Search again
              </p>
              <div className="mt-[var(--gg-space-4)]">
                <SearchForm size="md" />
              </div>
            </Card>
            <Card className="p-[var(--gg-space-5)]" tone="muted">
              <p className="text-[length:var(--gg-font-size-xs)] font-semibold uppercase tracking-[var(--gg-font-letter-spacing-caps)] text-[var(--gg-color-semantic-text-secondary)]">
                Record summary
              </p>
              <dl className="mt-[var(--gg-space-4)]">
                <KeyValue
                  label="Node type"
                  value={humanizeNodeType(profile.node.nodeType)}
                />
                <KeyValue
                  label="Connected records"
                  value={profile.relatedNodes.length.toString()}
                />
                <KeyValue
                  label="Source citations"
                  value={profile.citations.length.toString()}
                />
              </dl>
            </Card>
          </div>
        </header>

        <section className="grid gap-[var(--gg-space-6)] lg:grid-cols-[1.25fr_0.75fr]">
          <div className="space-y-[var(--gg-space-4)]">
            <SectionHeader
              title="Connected records"
              trailing={
                <span className="inline-flex rounded-[var(--gg-radius-full)] border border-[var(--gg-color-border)] px-[var(--gg-space-3)] py-[var(--gg-space-1)] text-[length:var(--gg-font-size-xs)] font-semibold uppercase tracking-[var(--gg-font-letter-spacing-caps)]">
                  Current snapshot
                </span>
              }
            />
            <RelationshipList relatedNodes={profile.relatedNodes} />
          </div>

          <div className="space-y-[var(--gg-space-4)]">
            <SectionHeader
              title="Sources"
              description="Every visible fact on this page should trace back to one of these cited records."
            />
            <div className="grid gap-[var(--gg-space-4)]">
              {profile.citations.map((citation) => (
                <SourceCard
                  key={citation.id}
                  action={
                    <a
                      href={citation.sourceUrl}
                      className="inline-flex text-[length:var(--gg-font-size-sm)] font-medium text-[var(--gg-color-accent)] underline-offset-4 hover:underline"
                    >
                      Open source
                    </a>
                  }
                  badges={
                    <>
                      <Badge>{humanizeSourceFamily(citation.sourceFamily)}</Badge>
                      <Badge tone="muted">{citation.sourceType}</Badge>
                    </>
                  }
                  description={
                    <>
                      Published by {citation.publisher}
                      {citation.effectiveDate
                        ? ` • effective ${citation.effectiveDate}`
                        : ""}
                    </>
                  }
                  metadata={citation.id}
                  title={citation.title}
                />
              ))}
            </div>
          </div>
        </section>
      </PageShell>
    </main>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getNodeProfile } from "@govgraph/domain";
import { loadGovernmentCatalog } from "@govgraph/parsers";
import { Badge, Card } from "@govgraph/ui";

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
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-8 px-6 py-8 sm:px-8 lg:px-10 lg:py-12">
      <header className="grid gap-8 rounded-[2rem] border border-[var(--govgraph-border)] bg-white/75 p-6 shadow-[0_24px_80px_rgba(14,44,36,0.08)] backdrop-blur-sm lg:grid-cols-[1.3fr_0.7fr] lg:p-8">
        <div className="space-y-5">
          <Link
            href="/"
            className="inline-flex text-sm font-medium uppercase tracking-[0.2em] text-[var(--govgraph-muted)] underline-offset-4 hover:underline"
          >
            Back to atlas
          </Link>
          <div className="flex flex-wrap gap-3">
            <Badge>{humanizeNodeType(profile.node.nodeType)}</Badge>
            <Badge>{profile.relatedNodes.length} linked records</Badge>
          </div>
          <div className="space-y-3">
            <h1 className="max-w-4xl text-4xl font-semibold tracking-tight text-[var(--govgraph-ink)] sm:text-5xl">
              {profile.node.canonicalName}
            </h1>
            <p className="max-w-3xl text-base leading-7 text-[var(--govgraph-muted)] sm:text-lg">
              {profile.node.description ??
                "This node is part of the current government map snapshot."}
            </p>
            {profile.node.websiteUrl ? (
              <a
                href={profile.node.websiteUrl}
                className="inline-flex text-sm font-medium text-[var(--govgraph-accent)] underline-offset-4 hover:underline"
              >
                Open official page
              </a>
            ) : null}
          </div>
        </div>

        <Card className="p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--govgraph-muted)]">
            Search again
          </p>
          <div className="mt-4">
            <SearchForm />
          </div>
        </Card>
      </header>

      <section className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-2xl font-semibold tracking-tight text-[var(--govgraph-ink)]">
              Connected records
            </h2>
            <p className="text-sm text-[var(--govgraph-muted)]">
              Current snapshot
            </p>
          </div>
          <RelationshipList relatedNodes={profile.relatedNodes} />
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-semibold tracking-tight text-[var(--govgraph-ink)]">
            Sources
          </h2>
          <div className="grid gap-4">
            {profile.citations.map((citation) => (
              <Card key={citation.id} className="p-5">
                <div className="flex flex-wrap gap-3">
                  <Badge>{humanizeSourceFamily(citation.sourceFamily)}</Badge>
                  <Badge>{citation.sourceType}</Badge>
                </div>
                <h3 className="mt-4 text-lg font-semibold text-[var(--govgraph-ink)]">
                  {citation.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-[var(--govgraph-muted)]">
                  Published by {citation.publisher}
                  {citation.effectiveDate
                    ? ` • effective ${citation.effectiveDate}`
                    : ""}
                </p>
                <a
                  href={citation.sourceUrl}
                  className="mt-4 inline-flex text-sm font-medium text-[var(--govgraph-accent)] underline-offset-4 hover:underline"
                >
                  Open source
                </a>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

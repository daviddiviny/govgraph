import Link from "next/link";

import type { RelatedNode } from "@govgraph/domain";
import { Badge, Card } from "@govgraph/ui";

import { describeRelationship, humanizeNodeType } from "../_lib/presenters";

type RelationshipListProps = {
  relatedNodes: RelatedNode[];
};

export function RelationshipList({ relatedNodes }: RelationshipListProps) {
  if (relatedNodes.length === 0) {
    return (
      <Card className="p-6">
        <p className="text-sm text-[var(--govgraph-muted)]">
          No connected records are available for this node yet.
        </p>
      </Card>
    );
  }

  return (
    <div className="grid gap-4">
      {relatedNodes.map((entry) => (
        <Card
          key={`${entry.edgeType}-${entry.direction}-${entry.node.id}`}
          className="p-5 transition-transform duration-200 hover:-translate-y-0.5"
        >
          <div className="flex flex-wrap items-center gap-3">
            <Badge>{describeRelationship(entry)}</Badge>
            <Badge>{humanizeNodeType(entry.node.nodeType)}</Badge>
          </div>
          <Link
            href={`/nodes/${entry.node.slug}`}
            className="mt-4 block text-xl font-semibold tracking-tight text-[var(--govgraph-ink)] underline-offset-4 hover:underline"
          >
            {entry.node.canonicalName}
          </Link>
          {entry.node.description ? (
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--govgraph-muted)]">
              {entry.node.description}
            </p>
          ) : null}
        </Card>
      ))}
    </div>
  );
}

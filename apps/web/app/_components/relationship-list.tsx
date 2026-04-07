import Link from "next/link";

import type { RelatedNode } from "@govgraph/domain";
import { Badge, EmptyState, NodeCard, NodeTypeBadge } from "@govgraph/ui";

import { describeRelationship } from "../_lib/presenters";

type RelationshipListProps = {
  relatedNodes: RelatedNode[];
};

export function RelationshipList({ relatedNodes }: RelationshipListProps) {
  if (relatedNodes.length === 0) {
    return (
      <EmptyState
        description="This record is in the live snapshot, but its relationships have not been connected yet."
        title="No linked records yet"
      />
    );
  }

  return (
    <div className="grid gap-[var(--gg-space-4)]">
      {relatedNodes.map((entry) => (
        <NodeCard
          key={`${entry.edgeType}-${entry.direction}-${entry.node.id}`}
          badges={
            <>
              <Badge>{describeRelationship(entry)}</Badge>
              <NodeTypeBadge nodeType={entry.node.nodeType} />
            </>
          }
          description={entry.node.description}
          title={
            <Link
              href={`/nodes/${entry.node.slug}`}
              className="underline-offset-4 hover:underline"
            >
              {entry.node.canonicalName}
            </Link>
          }
        />
      ))}
    </div>
  );
}

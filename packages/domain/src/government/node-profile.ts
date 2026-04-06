import type { EdgeType } from "./edge-types";
import type {
  GovernmentCatalog,
  GovernmentEdge,
  GovernmentNode,
  SourceDocument,
} from "./schemas";

export type RelatedNode = {
  edgeType: EdgeType;
  direction: "incoming" | "outgoing";
  node: GovernmentNode;
};

export type NodeProfile = {
  node: GovernmentNode;
  relatedNodes: RelatedNode[];
  citations: SourceDocument[];
};

export function getNodeBySlug(
  catalog: GovernmentCatalog,
  slug: string,
): GovernmentNode | undefined {
  return catalog.nodes.find((node) => node.slug === slug);
}

function collectCitations(
  catalog: GovernmentCatalog,
  node: GovernmentNode,
  relationships: GovernmentEdge[],
): SourceDocument[] {
  const ids = new Set<string>(node.sourceDocumentIds);

  for (const relationship of relationships) {
    for (const sourceDocumentId of relationship.sourceDocumentIds) {
      ids.add(sourceDocumentId);
    }
  }

  return catalog.sourceDocuments.filter((document) => ids.has(document.id));
}

export function getNodeProfile(
  catalog: GovernmentCatalog,
  slug: string,
): NodeProfile | null {
  const node = getNodeBySlug(catalog, slug);
  if (!node) {
    return null;
  }

  const relationships = catalog.edges.filter(
    (edge) => edge.fromNodeId === node.id || edge.toNodeId === node.id,
  );

  const relatedNodes = relationships
    .map((edge) => {
      const direction = edge.fromNodeId === node.id ? "outgoing" : "incoming";
      const relatedNodeId =
        direction === "outgoing" ? edge.toNodeId : edge.fromNodeId;
      const relatedNode = catalog.nodes.find(
        (candidate) => candidate.id === relatedNodeId,
      );

      if (!relatedNode) {
        return null;
      }

      return {
        edgeType: edge.edgeType,
        direction,
        node: relatedNode,
      };
    })
    .filter((entry): entry is RelatedNode => entry !== null)
    .sort((left, right) =>
      left.node.canonicalName.localeCompare(right.node.canonicalName),
    );

  return {
    node,
    relatedNodes,
    citations: collectCitations(catalog, node, relationships),
  };
}

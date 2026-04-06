import type { NodeType, RelatedNode } from "@govgraph/domain";

export function firstQueryValue(
  value: string | string[] | undefined,
): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

export function humanizeNodeType(nodeType: NodeType): string {
  return nodeType.replace(/_/g, " ");
}

export function humanizeSourceFamily(sourceFamily: string): string {
  return sourceFamily.replace(/_/g, " ");
}

export function describeRelationship(entry: RelatedNode): string {
  switch (entry.edgeType) {
    case "HOLDS_PORTFOLIO":
      return entry.direction === "outgoing" ? "Holds portfolio" : "Held by";
    case "MEMBER_OF_MINISTRY":
      return entry.direction === "outgoing" ? "Member of" : "Includes";
    case "SUPPORTED_BY_DEPARTMENT":
      return entry.direction === "outgoing" ? "Supported by" : "Supports";
    case "RESPONSIBLE_FOR":
      return entry.direction === "outgoing" ? "Responsible for" : "Responsibility held by";
    default:
      return entry.edgeType.toLowerCase().replace(/_/g, " ");
  }
}

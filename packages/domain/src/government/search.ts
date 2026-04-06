import type { GovernmentCatalog, GovernmentNode } from "./schemas";
import { normalizeForMatch } from "./utils";

export type SearchResult = {
  node: GovernmentNode;
  score: number;
  matchReason: string;
};

function scoreNode(node: GovernmentNode, query: string): SearchResult | null {
  const canonical = normalizeForMatch(node.canonicalName);
  const aliases = node.aliases.map((alias) => normalizeForMatch(alias));

  if (canonical === query) {
    return { node, score: 100, matchReason: "exact name match" };
  }

  if (aliases.includes(query)) {
    return { node, score: 95, matchReason: "alias match" };
  }

  if (canonical.startsWith(query)) {
    return { node, score: 88, matchReason: "name starts with query" };
  }

  if (aliases.some((alias) => alias.startsWith(query))) {
    return { node, score: 83, matchReason: "alias starts with query" };
  }

  if (canonical.includes(query)) {
    return { node, score: 75, matchReason: "name contains query" };
  }

  if (aliases.some((alias) => alias.includes(query))) {
    return { node, score: 72, matchReason: "alias contains query" };
  }

  const description = normalizeForMatch(node.description ?? "");
  if (description.includes(query)) {
    return { node, score: 48, matchReason: "description contains query" };
  }

  return null;
}

export function searchGovernmentCatalog(
  catalog: GovernmentCatalog,
  rawQuery: string,
  limit = 12,
): SearchResult[] {
  const query = normalizeForMatch(rawQuery);

  if (!query) {
    return [];
  }

  return catalog.nodes
    .filter((node) => node.status === "active")
    .map((node) => scoreNode(node, query))
    .filter((result): result is SearchResult => result !== null)
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }

      return left.node.canonicalName.localeCompare(right.node.canonicalName);
    })
    .slice(0, limit);
}

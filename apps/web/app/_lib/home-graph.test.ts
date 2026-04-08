import { describe, expect, it } from "vitest";

import { loadGovernmentCatalog } from "@govgraph/parsers";

import { buildHomeGraph } from "./home-graph";

describe("buildHomeGraph", () => {
  it("builds a readable connected preview from the fixture catalog", async () => {
    const catalog = await loadGovernmentCatalog("fixture");

    const graph = buildHomeGraph(catalog);

    expect(graph.nodes.length).toBeGreaterThanOrEqual(10);
    expect(graph.edges.length).toBeGreaterThanOrEqual(9);
    expect(graph.nodes.some((node) => node.nodeType === "ministry")).toBe(true);
    expect(graph.nodes.some((node) => node.nodeType === "department")).toBe(true);
    expect(graph.edges.every((edge) => graph.nodes.some((node) => node.id === edge.fromNodeId))).toBe(
      true,
    );
    expect(graph.edges.every((edge) => graph.nodes.some((node) => node.id === edge.toNodeId))).toBe(
      true,
    );
  });

  it("pins matching records into the preview when search terms hit connected nodes", async () => {
    const catalog = await loadGovernmentCatalog("fixture");

    const graph = buildHomeGraph(catalog, "education");
    const educationNode = graph.nodes.find(
      (node) => node.label === "Department of Education",
    );

    expect(educationNode).toBeDefined();
    if (!educationNode) {
      throw new Error("Expected Department of Education to appear in the graph preview.");
    }

    expect(graph.initialSelectedNodeId).toBe(educationNode.id);
    expect(graph.matchedNodeIds).toContain(educationNode.id);
  });
});

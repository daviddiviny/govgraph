import type { Route } from "next";

import {
  searchGovernmentCatalog,
  type GovernmentCatalog,
  type GovernmentEdge,
  type GovernmentNode,
  type NodeType,
} from "@govgraph/domain";

const homeGraphNodeTypes = [
  "ministry",
  "person",
  "ministerial_office",
  "department",
  "public_entity",
  "administrative_office",
  "program_output",
] as const;

const homeGraphNodeTypeSet = new Set<string>(homeGraphNodeTypes);

type HomeGraphNodeType = (typeof homeGraphNodeTypes)[number];
type EligibleHomeGraphNode = GovernmentNode & { nodeType: HomeGraphNodeType };

type HomeGraphSummary = {
  previewNodes: number;
  previewEdges: number;
  connectedNodes: number;
  connectedEdges: number;
  isolatedDocuments: number;
};

export type HomeGraphNode = {
  id: string;
  slug: string;
  label: string;
  shortLabel: string;
  description?: string;
  nodeType: HomeGraphNodeType;
  degree: number;
  href: Route;
  x: number;
  y: number;
};

export type HomeGraphEdge = {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  edgeType: GovernmentEdge["edgeType"];
};

export type HomeGraphData = {
  nodes: HomeGraphNode[];
  edges: HomeGraphEdge[];
  summary: HomeGraphSummary;
  matchedNodeIds: string[];
  initialSelectedNodeId?: string;
};

type ClusterLayout = {
  x: number;
  y: number;
  radiusX: number;
  radiusY: number;
  startAngle: number;
  endAngle: number;
};

const HOME_GRAPH_MAX_NODES = 21;

const homeGraphLimits: Record<HomeGraphNodeType, number> = {
  ministry: 1,
  person: 3,
  ministerial_office: 4,
  department: 4,
  public_entity: 4,
  administrative_office: 2,
  program_output: 3,
};

const clusterLayouts: Record<HomeGraphNodeType, ClusterLayout> = {
  ministry: { x: 50, y: 16, radiusX: 0, radiusY: 0, startAngle: -90, endAngle: -90 },
  person: { x: 22, y: 28, radiusX: 10, radiusY: 11, startAngle: -160, endAngle: -15 },
  ministerial_office: {
    x: 22,
    y: 58,
    radiusX: 11,
    radiusY: 12,
    startAngle: 165,
    endAngle: 20,
  },
  department: { x: 52, y: 44, radiusX: 13, radiusY: 10, startAngle: 205, endAngle: 18 },
  public_entity: { x: 80, y: 38, radiusX: 10, radiusY: 12, startAngle: -165, endAngle: 35 },
  administrative_office: {
    x: 82,
    y: 63,
    radiusX: 8,
    radiusY: 8,
    startAngle: 180,
    endAngle: 35,
  },
  program_output: { x: 56, y: 78, radiusX: 15, radiusY: 8, startAngle: 195, endAngle: -10 },
};

function isHomeGraphNodeType(nodeType: NodeType): nodeType is HomeGraphNodeType {
  return homeGraphNodeTypeSet.has(nodeType);
}

function isEligibleHomeGraphNode(node: GovernmentNode): node is EligibleHomeGraphNode {
  return node.status === "active" && isHomeGraphNodeType(node.nodeType);
}

function isDefined<T>(value: T | undefined): value is T {
  return value !== undefined;
}

function toEligibleHomeGraphNode(
  node: GovernmentNode,
): EligibleHomeGraphNode | undefined {
  if (!isHomeGraphNodeType(node.nodeType)) {
    return undefined;
  }

  return {
    ...node,
    nodeType: node.nodeType,
  };
}

function sortNodes<T extends GovernmentNode>(
  nodes: readonly T[],
  degreeByNodeId: ReadonlyMap<string, number>,
): T[] {
  return [...nodes].sort((left, right) => {
    const leftDegree = degreeByNodeId.get(left.id) ?? 0;
    const rightDegree = degreeByNodeId.get(right.id) ?? 0;

    if (rightDegree !== leftDegree) {
      return rightDegree - leftDegree;
    }

    return left.canonicalName.localeCompare(right.canonicalName);
  });
}

function getShortLabel(node: GovernmentNode): string {
  const baseLabel =
    node.nodeType === "program_output"
      ? node.canonicalName.split(": ").at(-1) ?? node.canonicalName
      : node.canonicalName;

  if (baseLabel.length <= 34) {
    return baseLabel;
  }

  return `${baseLabel.slice(0, 31).trimEnd()}…`;
}

function getNeighborNodeId(edge: GovernmentEdge, nodeId: string): string {
  return edge.fromNodeId === nodeId ? edge.toNodeId : edge.fromNodeId;
}

function positionNodes(
  nodes: readonly GovernmentNode[],
  degreeByNodeId: ReadonlyMap<string, number>,
): Map<string, { x: number; y: number }> {
  const positions = new Map<string, { x: number; y: number }>();

  for (const nodeType of homeGraphNodeTypes) {
    const layout = clusterLayouts[nodeType];
    const typedNodes = sortNodes(
      nodes.filter((node) => node.nodeType === nodeType),
      degreeByNodeId,
    );

    typedNodes.forEach((node, index) => {
      if (typedNodes.length === 1) {
        positions.set(node.id, { x: layout.x, y: layout.y });
        return;
      }

      const progress = typedNodes.length === 1 ? 0.5 : index / (typedNodes.length - 1);
      const angle =
        layout.startAngle + (layout.endAngle - layout.startAngle) * progress;
      const ring = 1 + Math.floor(index / 5) * 0.18;
      const angleInRadians = (angle * Math.PI) / 180;

      positions.set(node.id, {
        x: layout.x + Math.cos(angleInRadians) * layout.radiusX * ring,
        y: layout.y + Math.sin(angleInRadians) * layout.radiusY * ring,
      });
    });
  }

  return positions;
}

export function buildHomeGraph(
  catalog: GovernmentCatalog,
  query?: string,
): HomeGraphData {
  const eligibleNodes = catalog.nodes.filter(isEligibleHomeGraphNode);
  const eligibleNodeById = new Map(eligibleNodes.map((node) => [node.id, node]));
  const eligibleEdges = catalog.edges.filter(
    (edge) =>
      edge.status === "active" &&
      eligibleNodeById.has(edge.fromNodeId) &&
      eligibleNodeById.has(edge.toNodeId),
  );

  const degreeByNodeId = new Map<string, number>();
  const edgesByNodeId = new Map<string, GovernmentEdge[]>();

  for (const edge of eligibleEdges) {
    degreeByNodeId.set(edge.fromNodeId, (degreeByNodeId.get(edge.fromNodeId) ?? 0) + 1);
    degreeByNodeId.set(edge.toNodeId, (degreeByNodeId.get(edge.toNodeId) ?? 0) + 1);
    edgesByNodeId.set(edge.fromNodeId, [
      ...(edgesByNodeId.get(edge.fromNodeId) ?? []),
      edge,
    ]);
    edgesByNodeId.set(edge.toNodeId, [...(edgesByNodeId.get(edge.toNodeId) ?? []), edge]);
  }

  const preferredNodes = query
    ? searchGovernmentCatalog(catalog, query, 5)
        .map((result) => toEligibleHomeGraphNode(result.node))
        .filter(isDefined)
    : [];

  const selectedNodeIds = new Set<string>();
  const selectedCounts = new Map<HomeGraphNodeType, number>();

  const addNode = (node: GovernmentNode): boolean => {
    if (!isHomeGraphNodeType(node.nodeType)) {
      return false;
    }

    if (selectedNodeIds.has(node.id)) {
      return true;
    }

    if (selectedNodeIds.size >= HOME_GRAPH_MAX_NODES) {
      return false;
    }

    const currentCount = selectedCounts.get(node.nodeType) ?? 0;

    if (currentCount >= homeGraphLimits[node.nodeType]) {
      return false;
    }

    selectedNodeIds.add(node.id);
    selectedCounts.set(node.nodeType, currentCount + 1);
    return true;
  };

  const addTopNodesByType = (nodeType: HomeGraphNodeType, limit: number): void => {
    const nodesOfType = sortNodes(
      eligibleNodes.filter((node) => node.nodeType === nodeType),
      degreeByNodeId,
    );

    let added = 0;

    for (const node of nodesOfType) {
      if (added >= limit) {
        break;
      }

      if (addNode(node)) {
        added += 1;
      }
    }
  };

  const addConnectedNodes = (
    node: GovernmentNode,
    allowedTypes: readonly HomeGraphNodeType[],
    limit: number,
  ): void => {
    const allowedTypeSet = new Set<HomeGraphNodeType>(allowedTypes);
    const connectedNodes = sortNodes(
      (edgesByNodeId.get(node.id) ?? [])
        .map((edge) => eligibleNodeById.get(getNeighborNodeId(edge, node.id)))
        .filter(isDefined)
        .filter((candidate) => allowedTypeSet.has(candidate.nodeType)),
      degreeByNodeId,
    );

    let added = 0;

    for (const connectedNode of connectedNodes) {
      if (added >= limit) {
        break;
      }

      if (addNode(connectedNode)) {
        added += 1;
      }
    }
  };

  for (const preferredNode of preferredNodes) {
    addNode(preferredNode);
  }

  addTopNodesByType("ministry", 1);
  addTopNodesByType("person", 3);

  const selectedPeople = sortNodes(
    Array.from(selectedNodeIds)
      .map((nodeId) => eligibleNodeById.get(nodeId))
      .filter(isDefined)
      .filter((node) => node.nodeType === "person"),
    degreeByNodeId,
  );

  for (const person of selectedPeople) {
    addConnectedNodes(person, ["ministry", "ministerial_office", "department"], 4);
  }

  addTopNodesByType("department", 2);
  addTopNodesByType("ministerial_office", 2);

  const selectedDepartments = sortNodes(
    Array.from(selectedNodeIds)
      .map((nodeId) => eligibleNodeById.get(nodeId))
      .filter(isDefined)
      .filter((node) => node.nodeType === "department"),
    degreeByNodeId,
  );

  for (const department of selectedDepartments) {
    addConnectedNodes(
      department,
      ["public_entity", "administrative_office", "program_output", "person"],
      4,
    );
  }

  const selectedOwners = sortNodes(
    Array.from(selectedNodeIds)
      .map((nodeId) => eligibleNodeById.get(nodeId))
      .filter(isDefined)
      .filter(
        (node) =>
          (node.nodeType === "department" ||
            node.nodeType === "public_entity" ||
            node.nodeType === "administrative_office"),
      ),
    degreeByNodeId,
  );

  for (const owner of selectedOwners) {
    addConnectedNodes(owner, ["program_output", "public_entity", "administrative_office"], 3);
  }

  addTopNodesByType("public_entity", 3);
  addTopNodesByType("administrative_office", 2);
  addTopNodesByType("program_output", 2);

  for (const node of sortNodes(eligibleNodes, degreeByNodeId)) {
    if (selectedNodeIds.size >= HOME_GRAPH_MAX_NODES) {
      break;
    }

    addNode(node);
  }

  let selectedEdges = eligibleEdges.filter(
    (edge) => selectedNodeIds.has(edge.fromNodeId) && selectedNodeIds.has(edge.toNodeId),
  );

  if (selectedEdges.length === 0 && eligibleEdges.length > 0) {
    const [fallbackEdge] = [...eligibleEdges].sort((left, right) => {
      const leftWeight =
        (degreeByNodeId.get(left.fromNodeId) ?? 0) + (degreeByNodeId.get(left.toNodeId) ?? 0);
      const rightWeight =
        (degreeByNodeId.get(right.fromNodeId) ?? 0) + (degreeByNodeId.get(right.toNodeId) ?? 0);

      return rightWeight - leftWeight;
    });

    if (fallbackEdge) {
      const fallbackFromNode = eligibleNodeById.get(fallbackEdge.fromNodeId);
      const fallbackToNode = eligibleNodeById.get(fallbackEdge.toNodeId);

      if (fallbackFromNode && fallbackToNode) {
        selectedNodeIds.clear();
        selectedCounts.clear();
        addNode(fallbackFromNode);
        addNode(fallbackToNode);
        selectedEdges = [fallbackEdge];
      }
    }
  }

  const connectedNodeIds = new Set<string>();

  for (const edge of selectedEdges) {
    connectedNodeIds.add(edge.fromNodeId);
    connectedNodeIds.add(edge.toNodeId);
  }

  const finalNodes = sortNodes(
    Array.from(selectedNodeIds)
      .map((nodeId) => eligibleNodeById.get(nodeId))
      .filter(isDefined)
      .filter((node) => connectedNodeIds.size === 0 || connectedNodeIds.has(node.id)),
    degreeByNodeId,
  );
  const positionsByNodeId = positionNodes(finalNodes, degreeByNodeId);
  const finalNodeIds = new Set(finalNodes.map((node) => node.id));
  const finalEdges = selectedEdges.filter(
    (edge) => finalNodeIds.has(edge.fromNodeId) && finalNodeIds.has(edge.toNodeId),
  );
  const finalMatchedNodeIds = preferredNodes
    .map((node) => node.id)
    .filter((nodeId) => finalNodeIds.has(nodeId));
  const connectedEligibleNodeIds = new Set<string>();

  for (const edge of eligibleEdges) {
    connectedEligibleNodeIds.add(edge.fromNodeId);
    connectedEligibleNodeIds.add(edge.toNodeId);
  }

  const initialSelectedNodeId =
    finalMatchedNodeIds[0] ??
    finalNodes.find((node) => node.nodeType === "ministry")?.id ??
    finalNodes[0]?.id;

  return {
    nodes: finalNodes.map((node) => {
      const position = positionsByNodeId.get(node.id) ?? { x: 50, y: 50 };

      return {
        id: node.id,
        slug: node.slug,
        label: node.canonicalName,
        shortLabel: getShortLabel(node),
        nodeType: node.nodeType,
        degree: degreeByNodeId.get(node.id) ?? 0,
        href: `/nodes/${node.slug}` as Route,
        x: position.x,
        y: position.y,
        ...(node.description !== undefined
          ? { description: node.description }
          : {}),
      };
    }),
    edges: finalEdges.map((edge) => ({
      id: edge.id,
      fromNodeId: edge.fromNodeId,
      toNodeId: edge.toNodeId,
      edgeType: edge.edgeType,
    })),
    summary: {
      previewNodes: finalNodes.length,
      previewEdges: finalEdges.length,
      connectedNodes: connectedEligibleNodeIds.size,
      connectedEdges: eligibleEdges.length,
      isolatedDocuments: catalog.nodes.filter(
        (node) => node.status === "active" && node.nodeType === "budget_document",
      ).length,
    },
    matchedNodeIds: finalMatchedNodeIds,
    ...(initialSelectedNodeId !== undefined ? { initialSelectedNodeId } : {}),
  };
}

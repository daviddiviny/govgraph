import type {
  GovernmentCatalog,
  GovernmentEdge,
  GovernmentNode,
  MinistryDataset,
  PortfolioSectionInput,
  SourceDocument,
  VpscPortfolioDataset,
} from "./schemas";
import { governmentCatalogSchema } from "./schemas";
import {
  deterministicId,
  normalizeForMatch,
  slugify,
  todayIsoDate,
} from "./utils";

type NodeSeed = Omit<
  GovernmentNode,
  "id" | "slug" | "aliases" | "sourceDocumentIds"
> & {
  aliases?: string[];
  sourceDocumentIds?: string[];
};

type EdgeSeed = Omit<GovernmentEdge, "id" | "sourceDocumentIds"> & {
  sourceDocumentIds?: string[];
};

function createNode(seed: NodeSeed): GovernmentNode {
  const slug = slugify(`${seed.nodeType}-${seed.canonicalName}`);

  return {
    id: deterministicId(seed.nodeType, seed.canonicalName),
    aliases: seed.aliases ?? [],
    sourceDocumentIds: seed.sourceDocumentIds ?? [],
    slug,
    ...seed,
  };
}

function createEdge(seed: EdgeSeed): GovernmentEdge {
  return {
    id: deterministicId(
      seed.edgeType,
      `${seed.fromNodeId}:${seed.toNodeId}:${seed.notes ?? ""}`,
    ),
    sourceDocumentIds: seed.sourceDocumentIds ?? [],
    ...seed,
  };
}

function createCounts(nodes: GovernmentNode[]) {
  const counts = {
    person: 0,
    ministry: 0,
    portfolio: 0,
    department: 0,
    administrative_office: 0,
    public_entity: 0,
    program_output: 0,
    capital_project: 0,
    performance_measure: 0,
    budget_document: 0,
    source_document: 0,
    organisation_group: 0,
  } satisfies GovernmentCatalog["summary"]["countsByType"];

  for (const node of nodes) {
    counts[node.nodeType] += 1;
  }

  return counts;
}

function upsertNode(
  store: Map<string, GovernmentNode>,
  seed: NodeSeed,
): GovernmentNode {
  const key = `${seed.nodeType}:${normalizeForMatch(seed.canonicalName)}`;
  const existing = store.get(key);

  if (existing) {
    existing.description ??= seed.description;
    existing.websiteUrl ??= seed.websiteUrl;
    existing.sourceDocumentIds = Array.from(
      new Set([...existing.sourceDocumentIds, ...(seed.sourceDocumentIds ?? [])]),
    );
    existing.aliases = Array.from(
      new Set([...existing.aliases, ...(seed.aliases ?? [])]),
    );

    return existing;
  }

  const node = createNode(seed);
  store.set(key, node);
  return node;
}

function upsertEdge(
  store: Map<string, GovernmentEdge>,
  seed: EdgeSeed,
): GovernmentEdge {
  const key = `${seed.edgeType}:${seed.fromNodeId}:${seed.toNodeId}`;
  const existing = store.get(key);

  if (existing) {
    existing.sourceDocumentIds = Array.from(
      new Set([...existing.sourceDocumentIds, ...(seed.sourceDocumentIds ?? [])]),
    );
    existing.notes ??= seed.notes;
    existing.validFrom ??= seed.validFrom;
    return existing;
  }

  const edge = createEdge(seed);
  store.set(key, edge);
  return edge;
}

function buildPortfolioNodes(
  sections: PortfolioSectionInput[],
  source: SourceDocument,
  nodeStore: Map<string, GovernmentNode>,
  edgeStore: Map<string, GovernmentEdge>,
  departmentByPortfolioTitle: Map<string, GovernmentNode>,
) {
  for (const section of sections) {
    const department = upsertNode(nodeStore, {
      nodeType: "department",
      canonicalName: section.departmentName,
      description: section.departmentDescription,
      status: "active",
      sourceConfidence: "high",
      sourceDocumentIds: [source.id],
    });

    for (const title of section.portfolioTitles) {
      const portfolio = upsertNode(nodeStore, {
        nodeType: "portfolio",
        canonicalName: title,
        description: `${title} is supported by ${section.departmentName}.`,
        status: "active",
        sourceConfidence: "high",
        sourceDocumentIds: [source.id],
      });

      departmentByPortfolioTitle.set(normalizeForMatch(title), department);

      upsertEdge(edgeStore, {
        edgeType: "SUPPORTED_BY_DEPARTMENT",
        fromNodeId: portfolio.id,
        toNodeId: department.id,
        validFrom: todayIsoDate(),
        status: "active",
        notes: `Portfolio group: ${section.portfolioGroupName}`,
        sourceDocumentIds: [source.id],
      });
    }
  }
}

function buildMinistryNodes(
  ministry: MinistryDataset,
  nodeStore: Map<string, GovernmentNode>,
  edgeStore: Map<string, GovernmentEdge>,
  departmentByPortfolioTitle: Map<string, GovernmentNode>,
) {
  const ministryNode = upsertNode(nodeStore, {
    nodeType: "ministry",
    canonicalName: "Current Victorian ministry",
    description: "The current Victorian Government ministry.",
    status: "active",
    sourceConfidence: "high",
    sourceDocumentIds: [ministry.source.id],
  });

  for (const member of ministry.members) {
    const person = upsertNode(nodeStore, {
      nodeType: "person",
      canonicalName: member.personName,
      description: "Current member of the Victorian ministry.",
      status: "active",
      sourceConfidence: "high",
      websiteUrl: member.detailUrl,
      sourceDocumentIds: [ministry.source.id],
    });

    upsertEdge(edgeStore, {
      edgeType: "MEMBER_OF_MINISTRY",
      fromNodeId: person.id,
      toNodeId: ministryNode.id,
      validFrom: todayIsoDate(),
      status: "active",
      sourceDocumentIds: [ministry.source.id],
    });

    const responsibleDepartments = new Set<string>();

    for (const title of member.titles) {
      const portfolio = upsertNode(nodeStore, {
        nodeType: "portfolio",
        canonicalName: title,
        description: "Current ministerial portfolio.",
        status: "active",
        sourceConfidence: "high",
        sourceDocumentIds: [ministry.source.id],
      });

      upsertEdge(edgeStore, {
        edgeType: "HOLDS_PORTFOLIO",
        fromNodeId: person.id,
        toNodeId: portfolio.id,
        validFrom: todayIsoDate(),
        status: "active",
        sourceDocumentIds: [ministry.source.id],
      });

      const department = departmentByPortfolioTitle.get(normalizeForMatch(title));
      if (department) {
        responsibleDepartments.add(department.id);
      }
    }

    for (const departmentId of responsibleDepartments) {
      upsertEdge(edgeStore, {
        edgeType: "RESPONSIBLE_FOR",
        fromNodeId: person.id,
        toNodeId: departmentId,
        validFrom: todayIsoDate(),
        status: "active",
        sourceDocumentIds: [ministry.source.id],
      });
    }
  }
}

export function buildGovernmentCatalog(input: {
  portfolios: VpscPortfolioDataset;
  ministry: MinistryDataset;
}): GovernmentCatalog {
  const nodeStore = new Map<string, GovernmentNode>();
  const edgeStore = new Map<string, GovernmentEdge>();
  const departmentByPortfolioTitle = new Map<string, GovernmentNode>();

  buildPortfolioNodes(
    input.portfolios.sections,
    input.portfolios.source,
    nodeStore,
    edgeStore,
    departmentByPortfolioTitle,
  );
  buildMinistryNodes(
    input.ministry,
    nodeStore,
    edgeStore,
    departmentByPortfolioTitle,
  );

  const nodes = Array.from(nodeStore.values()).sort((left, right) =>
    left.canonicalName.localeCompare(right.canonicalName),
  );
  const edges = Array.from(edgeStore.values()).sort((left, right) =>
    left.edgeType.localeCompare(right.edgeType),
  );
  const sourceDocuments = [input.portfolios.source, input.ministry.source];

  return governmentCatalogSchema.parse({
    generatedAt: new Date().toISOString(),
    nodes,
    edges,
    sourceDocuments,
    summary: {
      totalNodes: nodes.length,
      totalEdges: edges.length,
      countsByType: createCounts(nodes),
    },
  });
}

import type {
  BudgetIndexDataset,
  BudgetPerformanceMeasureInput,
  BudgetPerformanceMeasuresDataset,
  GovernmentCatalog,
  GovernmentEdge,
  GovernmentNode,
  MinistryDataset,
  PortfolioSectionInput,
  SourceDocument,
  VpscEmployerInput,
  VpscEmployersDataset,
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

function collectSourceDocuments(
  ...groups: Array<SourceDocument[] | undefined>
): SourceDocument[] {
  const documents = new Map<string, SourceDocument>();

  for (const group of groups) {
    if (!group) {
      continue;
    }

    for (const document of group) {
      documents.set(document.id, document);
    }
  }

  return Array.from(documents.values()).sort((left, right) =>
    left.title.localeCompare(right.title),
  );
}

function createBudgetDocumentAliases(title: string): string[] {
  const aliases = new Set<string>();
  const match = title.match(/^Budget Paper (\d+):/i);

  if (match?.[1]) {
    aliases.add(`Budget Paper ${match[1]}`);
    aliases.add(`BP${match[1]}`);
  }

  if (title === "Department Performance Statement") {
    aliases.add("DPS");
  }

  return Array.from(aliases);
}

function extractEmployerAliases(employerName: string): string[] {
  const trimmedName = employerName.trim();
  const aliases = new Set<string>();
  const match = trimmedName.match(/^(.*?)\s*\((.+)\)$/);
  const leadName = match?.[1]?.trim();
  const alternateName = match?.[2]?.trim();

  if (leadName && leadName !== trimmedName) {
    aliases.add(leadName);
  }

  if (alternateName && alternateName !== trimmedName) {
    aliases.add(alternateName);
  }

  return Array.from(aliases);
}

function determineEmployerNodeType(
  employer: VpscEmployerInput,
): GovernmentNode["nodeType"] {
  const normalizedType = normalizeForMatch(
    `${employer.publicSectorBodyType} ${employer.subSector}`,
  );

  if (normalizedType.includes("administrative office")) {
    return "administrative_office";
  }

  return "public_entity";
}

function describeEmployer(employer: VpscEmployerInput): string {
  const parts = [
    employer.publicSectorBodyType
      ? `${employer.publicSectorBodyType} in the ${employer.portfolioDepartment} portfolio.`
      : undefined,
    employer.subSector ? `Sub-sector: ${employer.subSector}.` : undefined,
    employer.industry ? `Industry: ${employer.industry}.` : undefined,
    employer.executivePolicy
      ? `Executive policy: ${employer.executivePolicy}.`
      : undefined,
  ];

  return parts.filter((value): value is string => value !== undefined).join(" ");
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

function buildEmployerNodes(
  employers: VpscEmployersDataset,
  nodeStore: Map<string, GovernmentNode>,
  edgeStore: Map<string, GovernmentEdge>,
) {
  const validFrom =
    employers.asOfDate ?? employers.source.effectiveDate ?? todayIsoDate();

  for (const employer of employers.employers) {
    const department = upsertNode(nodeStore, {
      nodeType: "department",
      canonicalName: employer.portfolioDepartment,
      description:
        "Portfolio department listed by the VPSC public sector employers directory.",
      status: "active",
      sourceConfidence: "high",
      sourceDocumentIds: [employers.source.id],
    });

    const entity = upsertNode(nodeStore, {
      nodeType: determineEmployerNodeType(employer),
      canonicalName: employer.employerName,
      description: describeEmployer(employer),
      status: "active",
      sourceConfidence: "high",
      aliases: extractEmployerAliases(employer.employerName),
      sourceDocumentIds: [employers.source.id],
    });

    upsertEdge(edgeStore, {
      edgeType: "IN_PORTFOLIO",
      fromNodeId: entity.id,
      toNodeId: department.id,
      validFrom,
      status: "active",
      notes: `Portfolio department listed by VPSC: ${employer.portfolioDepartment}`,
      sourceDocumentIds: [employers.source.id],
    });
  }
}

function buildBudgetDocumentNodes(
  budgetIndex: BudgetIndexDataset,
  nodeStore: Map<string, GovernmentNode>,
) {
  for (const entry of budgetIndex.entries) {
    const sourceDocumentIds = Array.from(
      new Set([
        budgetIndex.source.id,
        ...entry.sourceDocuments.map((document) => document.id),
      ]),
    );

    upsertNode(nodeStore, {
      nodeType: "budget_document",
      canonicalName: entry.title,
      description: entry.summary,
      websiteUrl: entry.landingUrl,
      status: "active",
      sourceConfidence: "high",
      aliases: [...createBudgetDocumentAliases(entry.title), ...(entry.aliases ?? [])],
      sourceDocumentIds,
    });
  }
}

function describeBudgetOutput(
  ownerName: string,
  outputName: string,
  measureCount: number,
  budgetYear?: string,
): string {
  const parts = [
    `${outputName} is a published output for ${ownerName}.`,
    budgetYear
      ? `Captured from the ${budgetYear} departmental performance measures workbook.`
      : "Captured from the departmental performance measures workbook.",
    `${measureCount} linked performance measure${measureCount === 1 ? "" : "s"}.`,
  ];

  return parts.join(" ");
}

function describePerformanceMeasure(
  ownerName: string,
  outputName: string,
  measure: BudgetPerformanceMeasureInput,
): string {
  const currentSeries = measure.series[0];
  const parts = [
    `${measure.category} performance measure for ${outputName} in ${ownerName}.`,
    measure.unitOfMeasure ? `Unit: ${measure.unitOfMeasure}.` : undefined,
    currentSeries ? `${currentSeries.label}: ${currentSeries.value}.` : undefined,
    measure.note,
  ];

  return parts.filter((value): value is string => value !== undefined).join(" ");
}

function buildBudgetPerformanceMeasureNodes(
  dataset: BudgetPerformanceMeasuresDataset,
  nodeStore: Map<string, GovernmentNode>,
  edgeStore: Map<string, GovernmentEdge>,
) {
  for (const owner of dataset.owners) {
    const sourceDocumentIds = [dataset.source.id, owner.source.id];
    const ownerNode = upsertNode(nodeStore, {
      nodeType: owner.ownerNodeType,
      canonicalName: owner.ownerName,
      description:
        "Published owner record from the Victorian Budget departmental performance measures dataset.",
      status: "active",
      sourceConfidence: "high",
      sourceDocumentIds,
    });

    for (const output of owner.outputs) {
      const outputNode = upsertNode(nodeStore, {
        nodeType: "program_output",
        canonicalName: `${owner.ownerName}: ${output.outputName}`,
        description: describeBudgetOutput(
          owner.ownerName,
          output.outputName,
          output.measures.length,
          dataset.budgetYear,
        ),
        status: "active",
        sourceConfidence: "high",
        aliases: [output.outputName],
        sourceDocumentIds,
      });

      upsertEdge(edgeStore, {
        edgeType: "DELIVERS_OUTPUT",
        fromNodeId: ownerNode.id,
        toNodeId: outputNode.id,
        status: "active",
        notes: `Published in ${owner.source.title}`,
        sourceDocumentIds,
      });

      for (const measure of output.measures) {
        const measureNode = upsertNode(nodeStore, {
          nodeType: "performance_measure",
          canonicalName: `${owner.ownerName}: ${output.outputName}: ${measure.measureName}`,
          description: describePerformanceMeasure(
            owner.ownerName,
            output.outputName,
            measure,
          ),
          status: "active",
          sourceConfidence: "high",
          aliases: [measure.measureName, `${output.outputName} ${measure.measureName}`],
          sourceDocumentIds,
        });

        upsertEdge(edgeStore, {
          edgeType: "HAS_PERFORMANCE_MEASURE",
          fromNodeId: outputNode.id,
          toNodeId: measureNode.id,
          status: "active",
          notes: measure.category,
          sourceDocumentIds,
        });
        upsertEdge(edgeStore, {
          edgeType: "HAS_PERFORMANCE_MEASURE",
          fromNodeId: ownerNode.id,
          toNodeId: measureNode.id,
          status: "active",
          notes: measure.category,
          sourceDocumentIds,
        });
      }
    }
  }
}

export function buildGovernmentCatalog(input: {
  portfolios: VpscPortfolioDataset;
  ministry: MinistryDataset;
  employers?: VpscEmployersDataset;
  budgetIndex?: BudgetIndexDataset;
  performanceMeasures?: BudgetPerformanceMeasuresDataset;
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

  if (input.employers) {
    buildEmployerNodes(input.employers, nodeStore, edgeStore);
  }

  if (input.budgetIndex) {
    buildBudgetDocumentNodes(input.budgetIndex, nodeStore);
  }

  if (input.performanceMeasures) {
    buildBudgetPerformanceMeasureNodes(
      input.performanceMeasures,
      nodeStore,
      edgeStore,
    );
  }

  const nodes = Array.from(nodeStore.values()).sort((left, right) =>
    left.canonicalName.localeCompare(right.canonicalName),
  );
  const edges = Array.from(edgeStore.values()).sort((left, right) =>
    left.edgeType.localeCompare(right.edgeType),
  );
  const sourceDocuments = collectSourceDocuments(
    [input.portfolios.source],
    [input.ministry.source],
    input.employers ? [input.employers.source] : undefined,
    input.budgetIndex
      ? [
          input.budgetIndex.source,
          ...input.budgetIndex.entries.flatMap((entry) => entry.sourceDocuments),
        ]
      : undefined,
    input.performanceMeasures
      ? [
          input.performanceMeasures.source,
          ...input.performanceMeasures.owners.map((owner) => owner.source),
        ]
      : undefined,
  );

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

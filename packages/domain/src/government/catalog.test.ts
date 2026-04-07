import { buildGovernmentCatalog } from "./catalog";
import { getNodeProfile } from "./node-profile";
import { searchGovernmentCatalog } from "./search";
import type {
  BudgetIndexDataset,
  BudgetPerformanceMeasuresDataset,
  MinistryDataset,
  VpscEmployersDataset,
  VpscPortfolioDataset,
} from "./schemas";

const sourceBase = {
  sourceType: "html" as const,
  parserVersion: "test",
  rawStoragePath: "fixtures",
  retrievedAt: new Date("2026-04-06T00:00:00.000Z").toISOString(),
};

const portfolios: VpscPortfolioDataset = {
  source: {
    ...sourceBase,
    id: "c104aaf1-b4f3-4d88-afdc-a182840ec5dc",
    sourceFamily: "vpsc",
    title: "VPSC portfolios",
    sourceUrl:
      "https://www.vpsc.vic.gov.au/working-public-sector/conduct-integrity-and-values/working-ministers/working-ministerial-officer/portfolios",
    publisher: "VPSC",
    effectiveDate: "2025-06-05",
  },
  asOfDate: "2025-06-05",
  sections: [
    {
      portfolioGroupName: "Education",
      departmentName: "Department of Education",
      departmentDescription: "Supports education in Victoria.",
      officeTitles: ["Minister for Education", "Minister for Children"],
    },
  ],
};

const ministry: MinistryDataset = {
  source: {
    ...sourceBase,
    id: "c5e0b36d-c5a1-43a7-a975-ac8c9f297efa",
    sourceFamily: "parliament",
    title: "Parliament ministry",
    sourceUrl: "https://www.parliament.vic.gov.au/portfolios/",
    publisher: "Parliament of Victoria",
  },
  members: [
    {
      personName: "Ben Carroll",
      officeTitles: ["Minister for Education", "Deputy Premier"],
    },
  ],
};

const employers: VpscEmployersDataset = {
  source: {
    ...sourceBase,
    id: "0193d9a1-b145-4cb4-acb9-4dcebe81e765",
    sourceFamily: "vpsc",
    title: "VPSC public sector employers",
    sourceUrl:
      "https://www.vpsc.vic.gov.au/about-public-sector/list-public-sector-employers",
    publisher: "VPSC",
    effectiveDate: "2026-02-05",
  },
  asOfDate: "2026-02-05",
  employers: [
    {
      employerName:
        "Accident Compensation Conciliation Service (Workplace Injury Commission)",
      employerType: "Sector",
      publicSectorBodyType: "Public entity",
      industry: "Creative Industries, Finance, Transport and Other",
      subSector: "Regulator",
      portfolioDepartment: "Department of Treasury and Finance",
      virtDetermination: "Prescribed public entities",
      executivePolicy: "Public Entity Executive Remuneration",
    },
  ],
};

const budgetIndex: BudgetIndexDataset = {
  source: {
    ...sourceBase,
    id: "c5fb60f7-9609-4fcb-beb9-5bc2e26789eb",
    sourceFamily: "budget",
    title: "Victorian Budget papers",
    sourceUrl: "https://www.budget.vic.gov.au/budget-papers",
    publisher: "Victorian Government",
    publicationDate: "2025-10-14",
  },
  budgetYear: "2025/26",
  entries: [
    {
      title: "Budget Paper 3: Service Delivery",
      summary: "Outlines funded outputs and service delivery priorities.",
      landingUrl:
        "https://www.budget.vic.gov.au/budget-papers#budget-paper-3-service-delivery",
      sourceDocuments: [
        {
          ...sourceBase,
          id: "7dbf31bf-c81a-47cd-9f6e-6766a4838452",
          sourceFamily: "budget",
          sourceType: "pdf",
          title: "Budget Paper 3: Service Delivery",
          sourceUrl:
            "https://s3.ap-southeast-2.amazonaws.com/vicbudgetfiles2025.26budgetvic/2025-26+State+Budget+-+Service+Delivery.pdf",
          publisher: "Victorian Government",
          publicationDate: "2025-10-14",
          parserVersion: "test",
          rawStoragePath: "fixtures/bp3.pdf",
        },
      ],
    },
  ],
};

const performanceMeasures: BudgetPerformanceMeasuresDataset = {
  source: {
    ...sourceBase,
    id: "7d0fe3e7-4c39-4b91-a877-c8ac17309fa6",
    sourceFamily: "budget",
    title: "State Budget 2025-26 Departmental performance measures",
    sourceUrl:
      "https://discover.data.vic.gov.au/dataset/state-budget-2025-26-departmental-performance-measures",
    publisher: "Victorian Government DataVic",
    publicationDate: "2025-05-23",
  },
  budgetYear: "2025/26",
  owners: [
    {
      ownerName: "Department of Education",
      ownerNodeType: "department",
      source: {
        ...sourceBase,
        id: "f068b133-41f4-4339-afb4-2d88ecb0ac26",
        sourceFamily: "budget",
        sourceType: "xlsx",
        title: "Department of Education output performance measures 2025-26",
        sourceUrl:
          "https://www.dtf.vic.gov.au/sites/default/files/2025-05/Department-of-Education-output-performance-measures-2025-26.xlsx",
        publisher: "Department of Treasury and Finance",
        publicationDate: "2025-05-23",
        parserVersion: "test",
        rawStoragePath: "fixtures/education-performance-measures.xlsx",
      },
      outputs: [
        {
          outputName: "Kindergarten Delivery",
          measures: [
            {
              category: "Quantity",
              measureName:
                "Children funded to participate in kindergarten in the year before school",
              unitOfMeasure: "number",
              note:
                "This performance measure relates to the calendar year.",
              series: [
                { label: "2025-2026 target", value: "79 000" },
                { label: "2024-2025 expected outcome", value: "78 554" },
              ],
            },
          ],
        },
      ],
    },
  ],
};

describe("buildGovernmentCatalog", () => {
  it("creates departments, ministerial offices, people, employers, budget documents, and budget measures", () => {
    const catalog = buildGovernmentCatalog({
      portfolios,
      ministry,
      employers,
      budgetIndex,
      performanceMeasures,
    });

    expect(catalog.summary.totalNodes).toBeGreaterThanOrEqual(9);
    expect(
      catalog.edges.some((edge) => edge.edgeType === "SUPPORTED_BY_DEPARTMENT"),
    ).toBe(true);
    expect(catalog.edges.some((edge) => edge.edgeType === "HOLDS_OFFICE")).toBe(
      true,
    );
    expect(
      catalog.edges.some((edge) => edge.edgeType === "IN_PORTFOLIO"),
    ).toBe(true);
    expect(
      catalog.nodes.some((node) => node.nodeType === "budget_document"),
    ).toBe(true);
    expect(
      catalog.nodes.some((node) => node.nodeType === "program_output"),
    ).toBe(true);
    expect(
      catalog.nodes.some((node) => node.nodeType === "performance_measure"),
    ).toBe(true);
  });

  it("supports search and node profile queries", () => {
    const catalog = buildGovernmentCatalog({
      portfolios,
      ministry,
      employers,
      budgetIndex,
      performanceMeasures,
    });

    const results = searchGovernmentCatalog(catalog, "education");
    expect(results[0]?.node.canonicalName).toBe("Department of Education");

    const employerResults = searchGovernmentCatalog(
      catalog,
      "workplace injury commission",
    );
    expect(employerResults[0]?.node.canonicalName).toBe(
      "Accident Compensation Conciliation Service (Workplace Injury Commission)",
    );

    const budgetResults = searchGovernmentCatalog(catalog, "bp3");
    expect(budgetResults[0]?.node.canonicalName).toBe(
      "Budget Paper 3: Service Delivery",
    );

    const outputResults = searchGovernmentCatalog(catalog, "kindergarten delivery");
    expect(outputResults[0]?.node.nodeType).toBe("program_output");

    const measureResults = searchGovernmentCatalog(
      catalog,
      "children funded to participate in kindergarten in the year before school",
    );
    expect(measureResults[0]?.node.nodeType).toBe("performance_measure");

    const benCarroll = catalog.nodes.find(
      (node) => node.canonicalName === "Ben Carroll",
    );
    if (!benCarroll) {
      throw new Error("Expected Ben Carroll to exist in the catalog.");
    }

    const profile = getNodeProfile(catalog, benCarroll.slug);
    expect(
      profile?.relatedNodes.some((entry) => entry.edgeType === "HOLDS_OFFICE"),
    ).toBe(true);

    const education = catalog.nodes.find(
      (node) => node.canonicalName === "Department of Education",
    );
    if (!education) {
      throw new Error("Expected Department of Education to exist in the catalog.");
    }

    const educationProfile = getNodeProfile(catalog, education.slug);
    expect(
      educationProfile?.relatedNodes.some(
        (entry) => entry.edgeType === "DELIVERS_OUTPUT",
      ),
    ).toBe(true);
    expect(
      educationProfile?.relatedNodes.some(
        (entry) => entry.edgeType === "HAS_PERFORMANCE_MEASURE",
      ),
    ).toBe(true);
  });
});

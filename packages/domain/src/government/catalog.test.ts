import { buildGovernmentCatalog } from "./catalog";
import { getNodeProfile } from "./node-profile";
import { searchGovernmentCatalog } from "./search";
import type { MinistryDataset, VpscPortfolioDataset } from "./schemas";

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
      portfolioTitles: ["Minister for Education", "Minister for Children"],
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
      titles: ["Minister for Education", "Deputy Premier"],
    },
  ],
};

describe("buildGovernmentCatalog", () => {
  it("creates departments, portfolios, people, and supporting relationships", () => {
    const catalog = buildGovernmentCatalog({ portfolios, ministry });

    expect(catalog.summary.totalNodes).toBeGreaterThanOrEqual(5);
    expect(
      catalog.edges.some((edge) => edge.edgeType === "SUPPORTED_BY_DEPARTMENT"),
    ).toBe(true);
    expect(
      catalog.edges.some((edge) => edge.edgeType === "HOLDS_PORTFOLIO"),
    ).toBe(true);
  });

  it("supports search and node profile queries", () => {
    const catalog = buildGovernmentCatalog({ portfolios, ministry });

    const results = searchGovernmentCatalog(catalog, "education");
    expect(results[0]?.node.canonicalName).toBe("Department of Education");

    const benCarroll = catalog.nodes.find(
      (node) => node.canonicalName === "Ben Carroll",
    );
    expect(benCarroll).toBeDefined();

    const profile = getNodeProfile(catalog, benCarroll!.slug);
    expect(
      profile?.relatedNodes.some((entry) => entry.edgeType === "HOLDS_PORTFOLIO"),
    ).toBe(true);
  });
});

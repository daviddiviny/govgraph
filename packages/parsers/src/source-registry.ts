export type SourceRegistryEntry = {
  id: string;
  name: string;
  description: string;
  cadence: string;
  sourceFamily: "budget" | "gazette" | "vpsc" | "vic_gov" | "parliament";
  urls: string[];
  implementationStatus: "implemented" | "planned";
};

export const sourceRegistry: SourceRegistryEntry[] = [
  {
    id: "budget-index",
    name: "Victorian Budget index",
    description: "Registers official budget documents for downstream ingestion.",
    cadence: "manual + monthly",
    sourceFamily: "budget",
    urls: ["https://www.budget.vic.gov.au/budget-papers"],
    implementationStatus: "planned",
  },
  {
    id: "vpsc-portfolios",
    name: "VPSC portfolios",
    description:
      "Maps current ministerial portfolios to their supporting departments.",
    cadence: "weekly",
    sourceFamily: "vpsc",
    urls: [
      "https://www.vpsc.vic.gov.au/working-public-sector/conduct-integrity-and-values/working-ministers/working-ministerial-officer/portfolios",
    ],
    implementationStatus: "implemented",
  },
  {
    id: "ministry-parliament",
    name: "Parliament government ministry",
    description: "Lists current ministers and the portfolios they hold.",
    cadence: "daily",
    sourceFamily: "parliament",
    urls: ["https://www.parliament.vic.gov.au/portfolios/"],
    implementationStatus: "implemented",
  },
  {
    id: "ministry-vicgov-landing",
    name: "Victorian Government ministers landing page",
    description:
      "Executive source that links to the ministry and related ministerial resources.",
    cadence: "daily",
    sourceFamily: "vic_gov",
    urls: [
      "https://www.vic.gov.au/premier-and-ministers",
      "https://www.vic.gov.au/ministers",
    ],
    implementationStatus: "planned",
  },
];

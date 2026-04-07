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
    description:
      "Registers the current budget paper PDFs plus the projects index page.",
    cadence: "manual + monthly",
    sourceFamily: "budget",
    urls: ["https://www.budget.vic.gov.au/budget-papers"],
    implementationStatus: "implemented",
  },
  {
    id: "budget-performance-measures",
    name: "DataVic budget performance measures",
    description:
      "Loads the official workbook set for departmental outputs and performance measures.",
    cadence: "annual + manual",
    sourceFamily: "budget",
    urls: [
      "https://discover.data.vic.gov.au/dataset/state-budget-2025-26-departmental-performance-measures",
    ],
    implementationStatus: "implemented",
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
    id: "vpsc-employers",
    name: "VPSC public sector employers",
    description:
      "Loads the current employer directory and portfolio department assignments.",
    cadence: "weekly",
    sourceFamily: "vpsc",
    urls: [
      "https://www.vpsc.vic.gov.au/about-public-sector/list-public-sector-employers",
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

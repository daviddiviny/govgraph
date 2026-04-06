import type { BudgetPerformanceMeasuresDataset } from "@govgraph/domain";

import { createSourceDocument } from "../shared/source-document";

export function createBudgetPerformanceMeasuresFixture(): BudgetPerformanceMeasuresDataset {
  const source = createSourceDocument({
    sourceType: "html",
    sourceFamily: "budget",
    title: "State Budget 2025-26 Departmental performance measures",
    sourceUrl:
      "https://discover.data.vic.gov.au/dataset/state-budget-2025-26-departmental-performance-measures",
    publisher: "Victorian Government DataVic",
    publicationDate: "2025-05-23",
    parserVersion: "sprint-2",
    rawStoragePath: "fixtures/budget-performance-measures.json",
  });
  const educationWorkbook = createSourceDocument({
    sourceType: "xlsx",
    sourceFamily: "budget",
    title: "Department of Education output performance measures 2025-26",
    sourceUrl:
      "https://www.dtf.vic.gov.au/sites/default/files/2025-05/Department-of-Education-output-performance-measures-2025-26.xlsx",
    publisher: "Department of Treasury and Finance",
    publicationDate: "2025-05-23",
    parserVersion: "sprint-2",
    rawStoragePath: "fixtures/education-output-performance-measures-2025-26.xlsx",
  });

  return {
    source,
    budgetYear: "2025/26",
    owners: [
      {
        ownerName: "Department of Education",
        ownerNodeType: "department",
        source: educationWorkbook,
        outputs: [
          {
            outputName: "Kindergarten Delivery",
            measures: [
              {
                category: "Quantity",
                measureName:
                  "Children funded to participate in kindergarten in the year before school",
                unitOfMeasure: "number",
                note: "This performance measure relates to the calendar year.",
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
}

import JSZip from "jszip";
import { describe, expect, it } from "vitest";

import type { BudgetPerformanceMeasuresDataset } from "@govgraph/domain";

import {
  parseBudgetPaper3OutputSummaryDocx,
  validateBudgetPaper3OutputSummaryTables,
} from "./bp3";

function createSourceDocument() {
  return {
    id: "71dff362-ed1a-445b-b0b0-d874b03d6481",
    sourceType: "docx" as const,
    sourceFamily: "budget" as const,
    title: "Budget Paper 3: Service Delivery",
    sourceUrl: "https://example.com/bp3.docx",
    publisher: "Victorian Government",
    retrievedAt: new Date("2026-04-06T00:00:00.000Z").toISOString(),
    parserVersion: "test",
    rawStoragePath: "fixtures/bp3.docx",
  };
}

function createPerformanceMeasuresFixture(): BudgetPerformanceMeasuresDataset {
  return {
    source: {
      id: "79d3249e-f6b5-4e9d-8094-1597f5b660fd",
      sourceType: "html",
      sourceFamily: "budget",
      title: "State Budget 2025-26 Departmental performance measures",
      sourceUrl: "https://example.com/performance-measures",
      publisher: "Victorian Government DataVic",
      retrievedAt: new Date("2026-04-06T00:00:00.000Z").toISOString(),
      parserVersion: "test",
      rawStoragePath: "fixtures/performance-measures.json",
    },
    budgetYear: "2025/26",
    owners: [
      {
        ownerName: "Department of Education",
        ownerNodeType: "department",
        source: {
          id: "59d2d775-0dfa-4ea3-80df-c5a7d7b0d9e5",
          sourceType: "xlsx",
          sourceFamily: "budget",
          title: "Department of Education output performance measures 2025-26",
          sourceUrl: "https://example.com/education.xlsx",
          publisher: "Department of Treasury and Finance",
          retrievedAt: new Date("2026-04-06T00:00:00.000Z").toISOString(),
          parserVersion: "test",
          rawStoragePath: "fixtures/education.xlsx",
        },
        outputs: [
          {
            outputName: "Kindergarten Delivery",
            measures: [
              {
                category: "Cost",
                measureName: "Total output cost",
                series: [{ label: "2025-2026 target", value: "79.0" }],
              },
            ],
          },
          {
            outputName: "Family Services",
            measures: [
              {
                category: "Cost",
                measureName: "Total output cost",
                series: [{ label: "2025-2026 target", value: "21.0" }],
              },
            ],
          },
        ],
      },
    ],
  };
}

function createCustomPerformanceMeasuresFixture(input: {
  ownerName: string;
  outputs: Array<{ outputName: string; total: string }>;
}): BudgetPerformanceMeasuresDataset {
  return {
    source: {
      id: "79d3249e-f6b5-4e9d-8094-1597f5b660fd",
      sourceType: "html",
      sourceFamily: "budget",
      title: "State Budget 2025-26 Departmental performance measures",
      sourceUrl: "https://example.com/performance-measures",
      publisher: "Victorian Government DataVic",
      retrievedAt: new Date("2026-04-06T00:00:00.000Z").toISOString(),
      parserVersion: "test",
      rawStoragePath: "fixtures/performance-measures.json",
    },
    budgetYear: "2025/26",
    owners: [
      {
        ownerName: input.ownerName,
        ownerNodeType: "department",
        source: {
          id: "59d2d775-0dfa-4ea3-80df-c5a7d7b0d9e5",
          sourceType: "xlsx",
          sourceFamily: "budget",
          title: `${input.ownerName} output performance measures 2025-26`,
          sourceUrl: "https://example.com/owner.xlsx",
          publisher: "Department of Treasury and Finance",
          retrievedAt: new Date("2026-04-06T00:00:00.000Z").toISOString(),
          parserVersion: "test",
          rawStoragePath: "fixtures/owner.xlsx",
        },
        outputs: input.outputs.map((output) => ({
          outputName: output.outputName,
          measures: [
            {
              category: "Cost",
              measureName: "Total output cost",
              series: [{ label: "2025-2026 target", value: output.total }],
            },
          ],
        })),
      },
    ],
  };
}

function paragraph(text: string): string {
  return `<w:p><w:r><w:t>${text}</w:t></w:r></w:p>`;
}

function cell(text: string): string {
  return `<w:tc><w:p><w:r><w:t>${text}</w:t></w:r></w:p></w:tc>`;
}

function row(values: string[]): string {
  return `<w:tr>${values.map((value) => cell(value)).join("")}</w:tr>`;
}

function table(rows: string[][]): string {
  return `<w:tbl>${rows.map((values) => row(values)).join("")}</w:tbl>`;
}

function createDocumentXmlFromTableMarkup(
  tableMarkup: string,
  leadingParagraphs: string[] = [],
  departmentHeading = "Department of Education",
): string {
  return [
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
    '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">',
    "<w:body>",
    ...leadingParagraphs.map((text) => paragraph(text)),
    paragraph("Chapter 1 – Output, asset investment, savings and revenue initiatives"),
    paragraph("Table 1.1: Output summary ($ million)"),
    table([
      ["", "2024-25", "2025-26", "2026-27", "2027-28", "2028-29"],
      ["Whole of government", "1", "2", "3", "4", "5"],
    ]),
    ...(departmentHeading ? [paragraph(departmentHeading)] : []),
    paragraph("Output summary by departmental objectives"),
    paragraph("Table 2.1: Output summary ($ million)"),
    tableMarkup,
    "</w:body>",
    "</w:document>",
  ].join("");
}

function createDocumentXml(
  tableRows: string[][],
  leadingParagraphs: string[] = [],
  departmentHeading = "Department of Education",
): string {
  return createDocumentXmlFromTableMarkup(
    table(tableRows),
    leadingParagraphs,
    departmentHeading,
  );
}

async function createDocxBuffer(documentXml: string): Promise<ArrayBuffer> {
  const zip = new JSZip();
  zip.file("word/document.xml", documentXml);
  return zip.generateAsync({ type: "arraybuffer" });
}

describe("parseBudgetPaper3OutputSummaryDocx", () => {
  it("passes when the table structure, totals, and spreadsheet cross-checks all line up", async () => {
    const report = await parseBudgetPaper3OutputSummaryDocx({
      source: createSourceDocument(),
      arrayBuffer: await createDocxBuffer(
        createDocumentXml([
          [
            "",
            "2024-25 budget",
            "2024-25 revised",
            "2025-26 budget",
            "Variation % (a)",
          ],
          ["Support children and families", "", "", "", ""],
          ["Kindergarten Delivery", "70.0", "75.0", "79.0", "12.9"],
          ["Family Services", "20.0", "20.5", "21.0", "5.0"],
          ["Total (a)", "90.0", "95.5", "100.0", "11.1"],
        ]),
      ),
      performanceMeasures: createPerformanceMeasuresFixture(),
    });

    expect(report.verdict).toBe("pass");
    expect(report.departmentCount).toBe(1);
    expect(report.missingDepartments).toEqual([]);
    expect(report.departments[0]?.verdict).toBe("pass");
    expect(report.departments[0]?.checks.every((check) => check.status === "pass")).toBe(
      true,
    );
  });

  it("handles large DOCX files with many XML entities without tripping the parser limit", async () => {
    const noisyParagraph = Array.from({ length: 1_100 }, () => "&amp;").join(" ");
    const report = await parseBudgetPaper3OutputSummaryDocx({
      source: createSourceDocument(),
      arrayBuffer: await createDocxBuffer(
        createDocumentXml(
          [
            [
              "",
              "2024-25 budget",
              "2024-25 revised",
              "2025-26 budget",
              "Variation % (a)",
            ],
            ["Support children and families", "", "", "", ""],
            ["Kindergarten Delivery", "70.0", "75.0", "79.0", "12.9"],
            ["Family Services", "20.0", "20.5", "21.0", "5.0"],
            ["Total (a)", "90.0", "95.5", "100.0", "11.1"],
          ],
          [noisyParagraph],
        ),
      ),
      performanceMeasures: createPerformanceMeasuresFixture(),
    });

    expect(report.verdict).toBe("pass");
    expect(report.departmentCount).toBe(1);
  });

  it("preserves split numeric cells that use xml:space to keep thousands separators", async () => {
    const report = await parseBudgetPaper3OutputSummaryDocx({
      source: createSourceDocument(),
      arrayBuffer: await createDocxBuffer(
        createDocumentXmlFromTableMarkup(
          [
            '<w:tbl>',
            row([
              "",
              "2024-25 budget",
              "2024-25 revised",
              "2025-26 budget",
              "Variation % (a)",
            ]),
            row(["Create and maintain jobs", "", "", "", ""]),
            row(["Output A", "2 502.5", "2 503.4", "2 502.7", "0.0"]),
            row(["Output B", "2 283.2", "2 542.4", "2 330.7", "2.1"]),
            '<w:tr><w:tc><w:p><w:r><w:t>Total (a)</w:t></w:r></w:p></w:tc><w:tc><w:p><w:r><w:t>4 785.7</w:t></w:r></w:p></w:tc><w:tc><w:p><w:r><w:t>5</w:t></w:r><w:r><w:t xml:space="preserve"> </w:t></w:r><w:r><w:t>045</w:t></w:r><w:r><w:t>.8</w:t></w:r></w:p></w:tc><w:tc><w:p><w:r><w:t>4</w:t></w:r><w:r><w:t xml:space="preserve"> </w:t></w:r><w:r><w:t>833</w:t></w:r><w:r><w:t>.4</w:t></w:r></w:p></w:tc><w:tc><w:p><w:r><w:t>1.0</w:t></w:r></w:p></w:tc></w:tr>',
            '</w:tbl>',
          ].join(""),
          [],
          "Department of Jobs, Skills, Industry and Regions",
        ),
      ),
      performanceMeasures: createCustomPerformanceMeasuresFixture({
        ownerName: "Department of Jobs, Skills, Industry and Regions",
        outputs: [
          { outputName: "Output A", total: "2 502.7" },
          { outputName: "Output B", total: "2 330.7" },
        ],
      }),
    });

    expect(report.verdict).toBe("pass");
    expect(report.departments[0]?.totalsDifference.priorRevised).toBe(0);
    expect(report.departments[0]?.totalsDifference.currentBudget).toBe(0);
  });

  it("matches compacted DOCX headers and department names deterministically", async () => {
    const report = await parseBudgetPaper3OutputSummaryDocx({
      source: createSourceDocument(),
      arrayBuffer: await createDocxBuffer(
        createDocumentXml(
          [
            [
              "",
              "202425budget",
              "202425revised",
              "202526budget",
              "Variation%(a)",
            ],
            ["Support children and families", "", "", "", ""],
            ["Kindergarten Delivery", "70.0", "75.0", "79.0", "12.9"],
            ["Family Services", "20.0", "20.5", "21.0", "5.0"],
            ["Total (a)", "90.0", "95.5", "100.0", "11.1"],
          ],
          [],
          "Department ofEducation",
        ),
      ),
      performanceMeasures: createPerformanceMeasuresFixture(),
    });

    expect(report.verdict).toBe("pass");
    expect(report.departments[0]?.departmentName).toBe("Department of Education");
  });

  it("infers the department from the output rows when the heading text is missing", async () => {
    const report = await parseBudgetPaper3OutputSummaryDocx({
      source: createSourceDocument(),
      arrayBuffer: await createDocxBuffer(
        createDocumentXml(
          [
            [
              "",
              "2024-25 budget",
              "2024-25 revised",
              "2025-26 budget",
              "Variation % (a)",
            ],
            ["Support children and families", "", "", "", ""],
            ["Kindergarten Delivery", "70.0", "75.0", "79.0", "12.9"],
            ["Family Services", "20.0", "20.5", "21.0", "5.0"],
            ["Total (a)", "90.0", "95.5", "100.0", "11.1"],
          ],
          [],
          "",
        ),
      ),
      performanceMeasures: createPerformanceMeasuresFixture(),
    });

    expect(report.verdict).toBe("pass");
    expect(report.departments[0]?.departmentName).toBe("Department of Education");
  });

  it("matches grouped spreadsheet outputs by their shared base name", async () => {
    const report = await parseBudgetPaper3OutputSummaryDocx({
      source: createSourceDocument(),
      arrayBuffer: await createDocxBuffer(
        createDocumentXml(
          [
            [
              "",
              "2024-25 budget",
              "2024-25 revised",
              "2025-26 budget",
              "Variation % (a)",
            ],
            ["Reliable and people focused transport services", "", "", "", ""],
            ["Bus Services", "90.0", "95.0", "100.0", "11.1"],
            ["Total (a)", "90.0", "95.0", "100.0", "11.1"],
          ],
          [],
          "Department of Transport and Planning",
        ),
      ),
      performanceMeasures: createCustomPerformanceMeasuresFixture({
        ownerName: "Department of Transport and Planning",
        outputs: [
          { outputName: "Bus Services – Metropolitan", total: "70.0" },
          { outputName: "Bus Services – Regional", total: "20.0" },
          { outputName: "Bus Services – Statewide", total: "10.0" },
        ],
      }),
    });

    expect(report.verdict).toBe("pass");
    expect(report.departments[0]?.unmatchedOutputs).toEqual([]);
    expect(report.departments[0]?.spreadsheetAmountMismatches).toEqual([]);
  });

  it("matches grouped spreadsheet outputs by a unique amount combination when the row label is broader", async () => {
    const report = await parseBudgetPaper3OutputSummaryDocx({
      source: createSourceDocument(),
      arrayBuffer: await createDocxBuffer(
        createDocumentXml(
          [
            [
              "",
              "2024-25 budget",
              "2024-25 revised",
              "2025-26 budget",
              "Variation % (a)",
            ],
            ["Productive and sustainably used natural resources", "", "", "", ""],
            ["Agriculture", "500.0", "520.0", "537.2", "7.4"],
            ["Climate Action", "18.0", "18.1", "18.4", "2.2"],
            ["Total (a)", "518.0", "538.1", "555.6", "7.3"],
          ],
          [],
          "Department of Energy, Environment and Climate Action",
        ),
      ),
      performanceMeasures: createCustomPerformanceMeasuresFixture({
        ownerName: "Department of Energy, Environment and Climate Action",
        outputs: [
          { outputName: "Agriculture industry development and regulation", total: "149.5" },
          { outputName: "Agriculture research", total: "98.0" },
          { outputName: "Biosecurity and Agriculture Services", total: "139.3" },
          { outputName: "Sustainably Manage Forest Resources", total: "150.4" },
          { outputName: "Climate Action", total: "18.4" },
        ],
      }),
    });

    expect(report.verdict).toBe("pass");
    expect(report.departments[0]?.unmatchedOutputs).toEqual([]);
    expect(report.departments[0]?.spreadsheetAmountMismatches).toEqual([]);
  });

  it("fails when the displayed total does not add up", async () => {
    const report = await parseBudgetPaper3OutputSummaryDocx({
      source: createSourceDocument(),
      arrayBuffer: await createDocxBuffer(
        createDocumentXml([
          [
            "",
            "2024-25 budget",
            "2024-25 revised",
            "2025-26 budget",
            "Variation % (a)",
          ],
          ["Support children and families", "", "", "", ""],
          ["Kindergarten Delivery", "70.0", "75.0", "79.0", "12.9"],
          ["Family Services", "20.0", "20.5", "21.0", "5.0"],
          ["Total (a)", "91.0", "95.5", "101.0", "11.1"],
        ]),
      ),
      performanceMeasures: createPerformanceMeasuresFixture(),
    });

    expect(report.verdict).toBe("fail");
    expect(
      report.departments[0]?.checks.find((check) => check.id === "column-totals")?.status,
    ).toBe("fail");
  });
});

describe("validateBudgetPaper3OutputSummaryTables", () => {
  it("fails cleanly when the expected output-summary header shape drifts", () => {
    const report = validateBudgetPaper3OutputSummaryTables({
      source: createSourceDocument(),
      documentXml: createDocumentXml([
        ["", "2024-25 plan", "2024-25 revised", "2025-26 budget", "Variation % (a)"],
        ["Support children and families", "", "", "", ""],
        ["Kindergarten Delivery", "70.0", "75.0", "79.0", "12.9"],
        ["Total (a)", "70.0", "75.0", "79.0", "12.9"],
      ]),
      performanceMeasures: createPerformanceMeasuresFixture(),
    });

    expect(report.verdict).toBe("fail");
    expect(report.departmentCount).toBe(0);
    expect(report.missingDepartments).toEqual(["Department of Education"]);
  });

  it("fails coverage when any spreadsheet owner is missing from the BP3 tables", () => {
    const report = validateBudgetPaper3OutputSummaryTables({
      source: createSourceDocument(),
      documentXml: createDocumentXml([
        [
          "",
          "2024-25 budget",
          "2024-25 revised",
          "2025-26 budget",
          "Variation % (a)",
        ],
        ["Support children and families", "", "", "", ""],
        ["Kindergarten Delivery", "70.0", "75.0", "79.0", "12.9"],
        ["Total (a)", "70.0", "75.0", "79.0", "12.9"],
      ]),
      performanceMeasures: createCustomPerformanceMeasuresFixture({
        ownerName: "Department of Treasury and Finance",
        outputs: [{ outputName: "Budget Strategy", total: "79.0" }],
      }),
    });

    expect(report.verdict).toBe("fail");
    expect(report.missingDepartments).toEqual(["Department of Treasury and Finance"]);
    expect(
      report.departments[0]?.checks.find((check) => check.id === "department")?.status,
    ).toBe("pass");
  });
});

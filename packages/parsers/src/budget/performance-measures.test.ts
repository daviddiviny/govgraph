import { describe, expect, it } from "vitest";
import { utils, write } from "xlsx";

import {
  parseBudgetPerformanceMeasuresPackage,
  parseBudgetPerformanceMeasuresWorkbook,
} from "./performance-measures";

function createWorkbookBuffer(rows: string[][]): ArrayBuffer {
  const workbook = utils.book_new();
  const sheet = utils.aoa_to_sheet(rows);
  utils.book_append_sheet(workbook, sheet, "DE Performance Statement");
  const buffer = write(workbook, { bookType: "xlsx", type: "buffer" }) as Buffer;
  const arrayBuffer = new ArrayBuffer(buffer.byteLength);
  new Uint8Array(arrayBuffer).set(buffer);

  return arrayBuffer;
}

describe("parseBudgetPerformanceMeasuresPackage", () => {
  it("extracts the dataset source and workbook sources", () => {
    const parsed = parseBudgetPerformanceMeasuresPackage({
      result: {
        title: "State Budget 2025-26 Departmental performance measures",
        metadata_created: "2025-05-23T02:27:18.346333",
        resources: [
          {
            name: "Department of Education - output performance measures 2025-26",
            format: "XLSX",
            url: "https://example.com/education.xlsx",
          },
          {
            name: "Court Services Victoria - output performance measures 2025-26",
            format: "XLSX",
            url: "https://example.com/csv.xlsx",
          },
        ],
      },
    });

    expect(parsed.source.publicationDate).toBe("2025-05-23");
    expect(parsed.budgetYear).toBe("2025/26");
    expect(parsed.workbooks).toHaveLength(2);
    expect(parsed.workbooks[0]?.ownerName).toBe("Court Services Victoria");
    expect(parsed.workbooks[0]?.ownerNodeType).toBe("public_entity");
    expect(parsed.workbooks[1]?.ownerName).toBe("Department of Education");
    expect(parsed.workbooks[1]?.ownerNodeType).toBe("department");
  });
});

describe("parseBudgetPerformanceMeasuresWorkbook", () => {
  it("extracts outputs, measure categories, series values, and notes", () => {
    const workbook = createWorkbookBuffer([
      ["DEPARTMENT OF EDUCATION OUTPUT PERFORMANCE MEASURES"],
      [
        "Major Outputs/Deliverables\n\nPerformance measures",
        "Unit of measure",
        "2025-2026 target",
        "2024-2025 expected outcome",
        "2024-2025 target",
        "2023-2024 actual",
      ],
      ["Kindergarten Delivery"],
      ["Quantity"],
      [
        "Children funded to participate in kindergarten in the year before school",
        "number",
        "79 000",
        "78 554",
        "79 000",
        "78 293",
      ],
      ["This performance measure relates to the calendar year."],
      ["Quality"],
      [
        "Average parent satisfaction with kindergarten program",
        "per cent",
        "90",
        "89",
        "88",
        "87",
      ],
      [
        "Victorian Auditor-General's Office - Audit opinions on financial and performance statements",
      ],
      ["Cost"],
      [
        "Average cost per family supported",
        "$",
        "120",
        "118",
        "119",
        "115",
      ],
    ]);

    const parsed = parseBudgetPerformanceMeasuresWorkbook(workbook, {
      ownerName: "Department of Education",
      ownerNodeType: "department",
      source: {
        id: "8694e6d5-d8d7-49ba-bdb2-d44598936dbb",
        sourceType: "xlsx",
        sourceFamily: "budget",
        title: "Department of Education output performance measures",
        sourceUrl: "https://example.com/education.xlsx",
        publisher: "Department of Treasury and Finance",
        publicationDate: "2025-05-23",
        retrievedAt: new Date("2026-04-06T00:00:00.000Z").toISOString(),
        parserVersion: "test",
        rawStoragePath: "fixtures/education.xlsx",
      },
    });

    expect(parsed.outputs).toHaveLength(2);
    expect(parsed.outputs[0]?.outputName).toBe("Kindergarten Delivery");
    expect(parsed.outputs[0]?.measures).toHaveLength(2);
    expect(parsed.outputs[0]?.measures[0]).toMatchObject({
      category: "Quantity",
      measureName:
        "Children funded to participate in kindergarten in the year before school",
      unitOfMeasure: "number",
      note: "This performance measure relates to the calendar year.",
    });
    expect(parsed.outputs[0]?.measures[0]?.series[0]).toEqual({
      label: "2025-2026 target",
      value: "79 000",
    });
    expect(parsed.outputs[0]?.measures[1]?.category).toBe("Quality");
    expect(parsed.outputs[1]?.outputName).toBe(
      "Victorian Auditor-General's Office - Audit opinions on financial and performance statements",
    );
    expect(parsed.outputs[1]?.measures[0]?.category).toBe("Cost");
  });
});

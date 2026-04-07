import { formatCellValue, sortRows } from "./data-table-sort";

const rows = [
  {
    agency: "Transport and Planning",
    budget: 16_700_000_000,
    workforce: 3940,
  },
  {
    agency: "Treasury and Finance",
    budget: 8_300_000_000,
    workforce: 1450,
  },
  {
    agency: "Education",
    budget: null,
    workforce: 2180,
  },
] as const;

describe("sortRows", () => {
  it("sorts ascending while keeping nulls at the end", () => {
    const sorted = sortRows(rows, {
      columnKey: "budget",
      direction: "asc",
    });

    expect(sorted.map((row) => row.agency)).toEqual([
      "Treasury and Finance",
      "Transport and Planning",
      "Education",
    ]);
  });

  it("sorts descending for numeric columns", () => {
    const sorted = sortRows(rows, {
      columnKey: "workforce",
      direction: "desc",
    });

    expect(sorted.map((row) => row.agency)).toEqual([
      "Transport and Planning",
      "Education",
      "Treasury and Finance",
    ]);
  });
});

describe("formatCellValue", () => {
  it("formats numbers for table display", () => {
    expect(formatCellValue(1450, "number")).toBe("1,450");
    expect(formatCellValue(8300000000, "currency")).toBe("$8,300,000,000");
    expect(formatCellValue(null, "text")).toBe("—");
  });
});

import type { DataTableColumn } from "./data-table-sort";
import { sortRows } from "./data-table-sort";
import {
  getDataTableRowKeyLookup,
  getDataTableRowSignature,
} from "./data-table-row-key";

const columns = [
  {
    header: "Agency",
    key: "agency",
    sortable: true,
  },
  {
    header: "Budget",
    key: "budget",
    sortable: true,
  },
] as const satisfies readonly DataTableColumn<{
  agency: string;
  budget: number | null;
}>[];

describe("getDataTableRowSignature", () => {
  it("uses the configured column order to build a stable signature", () => {
    expect(
      getDataTableRowSignature(
        {
          agency: "Treasury and Finance",
          budget: 8_300_000_000,
        },
        columns,
      ),
    ).toBe('[\"Treasury and Finance\",8300000000]');
  });
});

describe("getDataTableRowKeyLookup", () => {
  it("creates stable unique keys for duplicate rows after sorting", () => {
    const rows = [
      {
        agency: "Transport and Planning",
        budget: 16_700_000_000,
      },
      {
        agency: "Transport and Planning",
        budget: 16_700_000_000,
      },
      {
        agency: "Treasury and Finance",
        budget: 8_300_000_000,
      },
    ] as const;

    const rowKeyLookup = getDataTableRowKeyLookup(rows, columns);
    const sortedRows = sortRows(rows, {
      columnKey: "agency",
      direction: "asc",
    });

    expect(sortedRows.map((row) => rowKeyLookup.get(row))).toEqual([
      '[\"Transport and Planning\",16700000000]::0',
      '[\"Transport and Planning\",16700000000]::1',
      '[\"Treasury and Finance\",8300000000]::0',
    ]);
  });
});

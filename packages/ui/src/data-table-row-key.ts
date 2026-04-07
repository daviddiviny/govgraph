import type { DataTableColumn, DataTableRow } from "./data-table-sort";

export function getDataTableRowSignature<Row extends DataTableRow>(
  row: Row,
  columns: readonly DataTableColumn<Row>[],
): string {
  return JSON.stringify(columns.map((column) => row[column.key] ?? null));
}

export function getDataTableRowKeyLookup<Row extends DataTableRow>(
  rows: readonly Row[],
  columns: readonly DataTableColumn<Row>[],
): Map<Row, string> {
  const signatureCounts = new Map<string, number>();
  const rowKeyLookup = new Map<Row, string>();

  for (const row of rows) {
    const signature = getDataTableRowSignature(row, columns);
    const occurrence = signatureCounts.get(signature) ?? 0;

    signatureCounts.set(signature, occurrence + 1);
    rowKeyLookup.set(row, `${signature}::${occurrence}`);
  }

  return rowKeyLookup;
}

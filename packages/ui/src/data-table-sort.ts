export type DataTableValue = number | string | null;

export type DataTableRow = Record<string, DataTableValue>;

export type DataTableColumn<Row extends DataTableRow> = {
  align?: "left" | "right";
  format?: "currency" | "number" | "text";
  header: string;
  key: keyof Row & string;
  sortable?: boolean;
};

export type DataTableSortState<Row extends DataTableRow> = {
  columnKey: keyof Row & string;
  direction: "asc" | "desc";
} | null;

function compareValues(left: DataTableValue, right: DataTableValue): number {
  if (left === right) {
    return 0;
  }

  if (left === null) {
    return 1;
  }

  if (right === null) {
    return -1;
  }

  if (typeof left === "number" && typeof right === "number") {
    return left - right;
  }

  return String(left).localeCompare(String(right), undefined, {
    numeric: true,
    sensitivity: "base",
  });
}

export function sortRows<Row extends DataTableRow>(
  rows: readonly Row[],
  sortState: DataTableSortState<Row>,
): Row[] {
  if (!sortState) {
    return [...rows];
  }

  return [...rows].sort((left, right) => {
    const result = compareValues(
      left[sortState.columnKey] ?? null,
      right[sortState.columnKey] ?? null,
    );

    return sortState.direction === "asc" ? result : -result;
  });
}

export function formatCellValue(
  value: DataTableValue,
  format: DataTableColumn<DataTableRow>["format"],
): string {
  if (value === null) {
    return "—";
  }

  if (format === "currency" && typeof value === "number") {
    return new Intl.NumberFormat("en-AU", {
      style: "currency",
      currency: "AUD",
      maximumFractionDigits: 0,
    }).format(value);
  }

  if (format === "number" && typeof value === "number") {
    return value.toLocaleString("en-AU");
  }

  return String(value);
}

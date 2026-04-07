"use client";

import type { HTMLAttributes } from "react";
import { useState } from "react";

import {
  formatCellValue,
  sortRows,
  type DataTableColumn,
  type DataTableRow,
  type DataTableSortState,
} from "./data-table-sort";
import {
  getDataTableRowKeyLookup,
  getDataTableRowSignature,
} from "./data-table-row-key";
import { cn } from "./utils";

type DataTableProps<Row extends DataTableRow> = HTMLAttributes<HTMLDivElement> & {
  caption?: string;
  columns: readonly DataTableColumn<Row>[];
  emptyMessage?: string;
  rows: readonly Row[];
};

function nextSortDirection<Row extends DataTableRow>(
  current: DataTableSortState<Row>,
  columnKey: keyof Row & string,
): DataTableSortState<Row> {
  if (!current || current.columnKey !== columnKey) {
    return { columnKey, direction: "asc" };
  }

  if (current.direction === "asc") {
    return { columnKey, direction: "desc" };
  }

  return null;
}

export function DataTable<Row extends DataTableRow>({
  caption,
  className,
  columns,
  emptyMessage = "No rows to display.",
  rows,
  ...props
}: DataTableProps<Row>) {
  const [sortState, setSortState] = useState<DataTableSortState<Row>>(null);
  const sortedRows = sortRows(rows, sortState);
  const rowKeyLookup = getDataTableRowKeyLookup(rows, columns);

  return (
    <div
      className={cn(
        "overflow-hidden rounded-[var(--gg-radius-lg)] border border-[var(--gg-color-border)] bg-[var(--gg-color-semantic-surface-strong)] shadow-[var(--gg-shadow-sm)]",
        className,
      )}
      {...props}
    >
      <table className="min-w-full border-collapse">
        {caption ? (
          <caption className="sr-only">{caption}</caption>
        ) : null}
        <thead className="bg-[var(--gg-color-semantic-surface-muted)]">
          <tr>
            {columns.map((column) => {
              const isSorted = sortState?.columnKey === column.key;
              const indicator = !column.sortable
                ? null
                : isSorted
                  ? sortState?.direction === "asc"
                    ? "ASC"
                    : "DESC"
                  : "SORT";

              return (
                <th
                  key={column.key}
                  className={cn(
                    "px-[var(--gg-space-4)] py-[var(--gg-space-3)] text-left text-[length:var(--gg-font-size-xs)] font-semibold uppercase tracking-[var(--gg-font-letter-spacing-caps)] text-[var(--gg-color-semantic-text-secondary)]",
                    column.align === "right" ? "text-right" : undefined,
                  )}
                  scope="col"
                >
                  {column.sortable ? (
                    <button
                      className={cn(
                        "inline-flex items-center gap-[var(--gg-space-2)] underline-offset-4 hover:text-[var(--gg-color-deep)] hover:underline",
                        column.align === "right" ? "ml-auto" : undefined,
                      )}
                      onClick={() =>
                        setSortState((current) =>
                          nextSortDirection(current, column.key),
                        )
                      }
                      type="button"
                    >
                      <span>{column.header}</span>
                      {indicator ? (
                        <span className="text-[10px]">{indicator}</span>
                      ) : null}
                    </button>
                  ) : (
                    column.header
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {sortedRows.length === 0 ? (
            <tr>
              <td
                className="px-[var(--gg-space-4)] py-[var(--gg-space-6)] text-[length:var(--gg-font-size-sm)] text-[var(--gg-color-semantic-text-secondary)]"
                colSpan={columns.length}
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            sortedRows.map((row) => (
              <tr
                key={
                  rowKeyLookup.get(row) ?? getDataTableRowSignature(row, columns)
                }
                className="border-t border-[var(--gg-color-border)] first:border-t-0"
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={cn(
                      "px-[var(--gg-space-4)] py-[var(--gg-space-4)] text-[length:var(--gg-font-size-sm)] leading-[var(--gg-font-line-height-body)] text-[var(--gg-color-ink)]",
                      column.align === "right" ? "text-right" : undefined,
                    )}
                  >
                    {formatCellValue(row[column.key] ?? null, column.format)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

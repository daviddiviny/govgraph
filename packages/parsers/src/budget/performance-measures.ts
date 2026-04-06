import { read, utils } from "xlsx";
import { z } from "zod";

import type {
  BudgetPerformanceMeasureInput,
  BudgetPerformanceMeasureOwnerInput,
  BudgetPerformanceMeasuresDataset,
  SourceDocument,
} from "@govgraph/domain";
import { slugify } from "@govgraph/domain";

import { createBudgetPerformanceMeasuresFixture } from "../fixtures/budget-performance-measures.fixture";
import { createSourceDocument } from "../shared/source-document";

export const DATAVIC_BUDGET_PERFORMANCE_MEASURES_DATASET_URL =
  "https://discover.data.vic.gov.au/dataset/state-budget-2025-26-departmental-performance-measures";
export const DATAVIC_BUDGET_PERFORMANCE_MEASURES_PACKAGE_API_URL =
  "https://discover.data.vic.gov.au/api/3/action/package_show?id=841338c5-c045-41ef-beaf-896173ec4d42";

const performanceMeasureCategoryLabels = new Set([
  "Quantity",
  "Quality",
  "Timeliness",
  "Cost",
]);

const ckanResourceSchema = z.object({
  name: z.string(),
  format: z.string(),
  url: z.string().url(),
});

const ckanPackageSchema = z.object({
  result: z.object({
    title: z.string(),
    metadata_created: z.string().optional(),
    resources: z.array(ckanResourceSchema),
  }),
});

export type BudgetPerformanceMeasuresWorkbookResource = {
  ownerName: string;
  ownerNodeType: BudgetPerformanceMeasureOwnerInput["ownerNodeType"];
  source: SourceDocument;
};

type WorkbookParseInput = {
  ownerName: string;
  ownerNodeType: BudgetPerformanceMeasureOwnerInput["ownerNodeType"];
  source: SourceDocument;
};

function normalizeText(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function normalizeCell(value: unknown): string {
  if (value === undefined || value === null) {
    return "";
  }

  return normalizeText(String(value));
}

function parseBudgetYear(value: string): string | undefined {
  const match = value.match(/\b(20\d{2})-(\d{2})\b/);

  if (!match?.[1] || !match[2]) {
    return undefined;
  }

  return `${match[1]}/${match[2]}`;
}

function parsePublicationDate(value: string | undefined): string | undefined {
  return value?.match(/^\d{4}-\d{2}-\d{2}/)?.[0];
}

function inferOwnerNodeType(
  ownerName: string,
): BudgetPerformanceMeasureOwnerInput["ownerNodeType"] {
  if (ownerName.startsWith("Department of ")) {
    return "department";
  }

  if (ownerName === "Court Services Victoria") {
    return "public_entity";
  }

  if (ownerName.includes(" and ")) {
    return "organisation_group";
  }

  return "department";
}

function parseOwnerName(resourceName: string): string {
  const normalized = normalizeText(resourceName);
  const match = normalized.match(/^(.*?)\s*-\s*output performance measures\b/i);

  if (match?.[1]) {
    return match[1].trim();
  }

  return normalized;
}

function createWorkbookSourceDocument(
  ownerName: string,
  sourceUrl: string,
  publicationDate?: string,
): SourceDocument {
  return createSourceDocument({
    sourceType: "xlsx",
    sourceFamily: "budget",
    title: `${ownerName} output performance measures`,
    sourceUrl,
    publisher: "Department of Treasury and Finance",
    ...(publicationDate ? { publicationDate } : {}),
    parserVersion: "sprint-2",
    rawStoragePath: `live/budget/performance-measures/${slugify(ownerName)}.xlsx`,
  });
}

function isEmptyRow(row: string[]): boolean {
  return row.every((cell) => cell === "");
}

function hasValueCells(row: string[]): boolean {
  return row.slice(1).some((cell) => cell !== "");
}

function isCategoryRow(row: string[]): boolean {
  return performanceMeasureCategoryLabels.has(row[0] ?? "");
}

function looksLikeMeasureNote(value: string): boolean {
  const normalized = normalizeText(value);

  return (
    normalized.includes(".") ||
    normalized.startsWith("This ") ||
    normalized.startsWith("The ") ||
    normalized.startsWith("New ")
  );
}

function findHeaderRow(rows: string[][]): number {
  return rows.findIndex(
    (row) =>
      normalizeText(row[0] ?? "")
        .toLowerCase()
        .includes("performance measures") &&
      row.some((cell) =>
        /20\d{2}-20\d{2}\s+target/i.test(normalizeText(cell)),
      ),
  );
}

function buildSeries(
  row: string[],
  headers: string[],
): BudgetPerformanceMeasureInput["series"] {
  return headers
    .slice(2)
    .map((header, index) => ({
      label: header,
      value: row[index + 2] ?? "",
    }))
    .filter((entry) => entry.label && entry.value);
}

export function parseBudgetPerformanceMeasuresPackage(
  input: unknown,
): {
  source: SourceDocument;
  budgetYear?: string;
  workbooks: BudgetPerformanceMeasuresWorkbookResource[];
} {
  const payload = ckanPackageSchema.parse(input);
  const publicationDate = parsePublicationDate(payload.result.metadata_created);
  const budgetYear = parseBudgetYear(payload.result.title);

  return {
    source: createSourceDocument({
      sourceType: "html",
      sourceFamily: "budget",
      title: payload.result.title,
      sourceUrl: DATAVIC_BUDGET_PERFORMANCE_MEASURES_DATASET_URL,
      publisher: "Victorian Government DataVic",
      ...(publicationDate ? { publicationDate } : {}),
      parserVersion: "sprint-2",
      rawStoragePath: "live/budget/performance-measures-dataset.json",
    }),
    ...(budgetYear ? { budgetYear } : {}),
    workbooks: payload.result.resources
      .filter(
        (resource) =>
          resource.format.toLowerCase() === "xlsx" &&
          resource.url.toLowerCase().endsWith(".xlsx"),
      )
      .map((resource) => {
        const ownerName = parseOwnerName(resource.name);

        return {
          ownerName,
          ownerNodeType: inferOwnerNodeType(ownerName),
          source: createWorkbookSourceDocument(
            ownerName,
            resource.url,
            publicationDate,
          ),
        };
      })
      .sort((left, right) => left.ownerName.localeCompare(right.ownerName)),
  };
}

export function parseBudgetPerformanceMeasuresWorkbook(
  arrayBuffer: ArrayBuffer,
  input: WorkbookParseInput,
): BudgetPerformanceMeasureOwnerInput {
  const workbook = read(arrayBuffer, { type: "array" });
  const primarySheetName =
    workbook.SheetNames.find((sheetName) => !/appendix/i.test(sheetName)) ??
    workbook.SheetNames[0];

  if (!primarySheetName) {
    throw new Error(`No worksheet found for ${input.ownerName}`);
  }

  const sheet = workbook.Sheets[primarySheetName];
  if (!sheet) {
    throw new Error(`Worksheet ${primarySheetName} not found for ${input.ownerName}`);
  }

  const rows = utils
    .sheet_to_json<unknown[]>(sheet, {
      header: 1,
      blankrows: false,
      defval: "",
      raw: false,
    })
    .map((row) => row.map((cell) => normalizeCell(cell)));
  const headerRowIndex = findHeaderRow(rows);

  if (headerRowIndex === -1) {
    throw new Error(
      `Unable to find the performance measure header row for ${input.ownerName}`,
    );
  }

  const headers = rows[headerRowIndex] ?? [];
  const outputs: BudgetPerformanceMeasureOwnerInput["outputs"] = [];
  let currentOutput: BudgetPerformanceMeasureOwnerInput["outputs"][number] | undefined;
  let currentCategory: string | undefined;
  let lastMeasure: BudgetPerformanceMeasureInput | undefined;

  for (let index = headerRowIndex + 1; index < rows.length; index += 1) {
    const row = rows[index] ?? [];
    if (isEmptyRow(row)) {
      continue;
    }

    const primaryCell = row[0] ?? "";
    if (!primaryCell) {
      continue;
    }

    if (isCategoryRow(row)) {
      currentCategory = primaryCell;
      lastMeasure = undefined;
      continue;
    }

    const onlyFirstCell = !hasValueCells(row);

    if (onlyFirstCell) {
      if (lastMeasure && looksLikeMeasureNote(primaryCell)) {
        lastMeasure.note = lastMeasure.note
          ? `${lastMeasure.note} ${primaryCell}`
          : primaryCell;
        continue;
      }

      const nextRow = rows
        .slice(index + 1)
        .find((candidate) => !isEmptyRow(candidate) && (candidate[0] ?? "") !== "");

      if (!lastMeasure || isCategoryRow(nextRow ?? [])) {
        currentOutput = {
          outputName: primaryCell,
          measures: [],
        };
        outputs.push(currentOutput);
        currentCategory = undefined;
        lastMeasure = undefined;
        continue;
      }

      lastMeasure.note = lastMeasure.note
        ? `${lastMeasure.note} ${primaryCell}`
        : primaryCell;
      continue;
    }

    if (!currentOutput) {
      continue;
    }

    const measure: BudgetPerformanceMeasureInput = {
      category: currentCategory ?? "Performance measure",
      measureName: primaryCell,
      ...(row[1] ? { unitOfMeasure: row[1] } : {}),
      series: buildSeries(row, headers),
    };

    currentOutput.measures.push(measure);
    lastMeasure = measure;
  }

  const populatedOutputs = outputs.filter((output) => output.measures.length > 0);

  if (populatedOutputs.length === 0) {
    throw new Error(`No performance measures found for ${input.ownerName}`);
  }

  return {
    ownerName: input.ownerName,
    ownerNodeType: input.ownerNodeType,
    source: input.source,
    outputs: populatedOutputs,
  };
}

export async function fetchBudgetPerformanceMeasures(): Promise<BudgetPerformanceMeasuresDataset> {
  const response = await fetch(DATAVIC_BUDGET_PERFORMANCE_MEASURES_PACKAGE_API_URL);
  if (!response.ok) {
    throw new Error(
      `Budget performance measures request failed with ${response.status}`,
    );
  }

  const parsedPackage = parseBudgetPerformanceMeasuresPackage(await response.json());
  const owners = await Promise.all(
    parsedPackage.workbooks.map(async (workbook) => {
      const workbookResponse = await fetch(workbook.source.sourceUrl);
      if (!workbookResponse.ok) {
        throw new Error(
          `Budget performance workbook request failed for ${workbook.ownerName} with ${workbookResponse.status}`,
        );
      }

      return parseBudgetPerformanceMeasuresWorkbook(
        await workbookResponse.arrayBuffer(),
        workbook,
      );
    }),
  );

  return {
    source: parsedPackage.source,
    ...(parsedPackage.budgetYear ? { budgetYear: parsedPackage.budgetYear } : {}),
    owners: owners.sort((left, right) => left.ownerName.localeCompare(right.ownerName)),
  };
}

export function loadFixtureBudgetPerformanceMeasures(): BudgetPerformanceMeasuresDataset {
  return createBudgetPerformanceMeasuresFixture();
}

import { load } from "cheerio";
import { XMLParser } from "fast-xml-parser";

import type {
  BudgetPerformanceMeasuresDataset,
  SourceDocument,
} from "@govgraph/domain";
import { normalizeForMatch } from "@govgraph/domain";

import { BUDGET_PAPERS_URL } from "./index";
import { fetchBudgetPerformanceMeasures } from "./performance-measures";
import { createSourceDocument } from "../shared/source-document";
import { extractDocxEntry } from "../shared/docx";

export const CURRENT_BP3_DOCX_TITLE = "Budget Paper 3: Service Delivery";

type ValidationStatus = "pass" | "review" | "fail";
type OrderedBodyItem =
  | { type: "paragraph"; text: string }
  | { type: "table"; rows: string[][] };

type TableColumnKey = "priorBudget" | "priorRevised" | "currentBudget" | "variation";

export type Bp3OutputSummaryColumns = Record<
  TableColumnKey,
  {
    label: string;
    fiscalYear?: string;
  }
>;

export type Bp3OutputSummaryRow = {
  rowType: "objective" | "output" | "total";
  label: string;
  objectiveLabel?: string;
  amounts?: Record<TableColumnKey, number>;
  rawValues?: Partial<Record<TableColumnKey, string>>;
};

export type Bp3OutputSummaryTable = {
  departmentName?: string;
  caption?: string;
  columns: Bp3OutputSummaryColumns;
  rows: Bp3OutputSummaryRow[];
};

export type Bp3ValidationCheck = {
  id: string;
  status: ValidationStatus;
  message: string;
};

export type Bp3DepartmentValidation = {
  departmentName: string;
  verdict: ValidationStatus;
  outputCount: number;
  checks: Bp3ValidationCheck[];
  unmatchedOutputs: string[];
  totalsDifference: Record<Exclude<TableColumnKey, "variation">, number>;
  variationMismatches: string[];
  spreadsheetAmountMismatches: string[];
};

export type Bp3ValidationReport = {
  source: SourceDocument;
  budgetYear?: string;
  verdict: ValidationStatus;
  departmentCount: number;
  departments: Bp3DepartmentValidation[];
  missingDepartments: string[];
};

type ColumnDefinition = Bp3OutputSummaryColumns[TableColumnKey];

const parser = new XMLParser({
  preserveOrder: true,
  ignoreAttributes: false,
  processEntities: false,
  parseTagValue: false,
  trimValues: false,
});

const outputSummaryContextPattern =
  /output summary by departmental objectives|table\s+\d+\s*\.\s*\d+\s*:\s*output summary/i;
const ownerHeadingPattern =
  /^(department of |court services victoria$|parliament and auditor general's office and parliamentary budget office$)/i;
const headerFiscalYearPattern = /(20\d{2})\s*-?\s*(\d{2})/i;
const headerBudgetPattern = /(20\d{2})\s*-?\s*(\d{2})\s*budget/i;
const headerRevisedPattern = /(20\d{2})\s*-?\s*(\d{2})\s*revised/i;
const variationTolerance = 1;
const departmentHeadingSearchDistance = 80;
const currentBudgetTolerance = 0.3;
const historicalBudgetTolerance = 0.2;
const groupedAmountTolerance = 0.2;

function normalizeText(value: string): string {
  return decodeXmlEntities(value)
    .replace(/[\u00a0\u202f]/g, " ")
    .replace(/[‐‑–—]/g, "-")
    .replace(/\s+/g, " ")
    .replace(/(\d{4})\s*-\s*(\d{2})/g, "$1-$2")
    .replace(/(\d{4})\s+(\d{2})(?=\s+(budget|revised|outputs?|target|actual))/gi, "$1-$2")
    .trim();
}

function normalizeCompactMatch(value: string): string {
  return normalizeForMatch(value).replace(/\s+/g, "");
}

function normalizeSingularMatch(value: string): string {
  return normalizeForMatch(value)
    .split(" ")
    .map((token) => {
      if (token.length > 4 && token.endsWith("s") && !token.endsWith("ss")) {
        return token.slice(0, -1);
      }

      return token;
    })
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeSingularCompactMatch(value: string): string {
  return normalizeSingularMatch(value).replace(/\s+/g, "");
}

function decodeXmlEntities(value: string): string {
  return value.replace(
    /&(?:#(\d+)|#x([0-9a-f]+)|amp|lt|gt|quot|apos);/gi,
    (entity, decimalCodePoint, hexCodePoint) => {
      if (decimalCodePoint) {
        return String.fromCodePoint(Number(decimalCodePoint));
      }

      if (hexCodePoint) {
        return String.fromCodePoint(Number.parseInt(hexCodePoint, 16));
      }

      switch (entity.toLowerCase()) {
        case "&amp;":
          return "&";
        case "&lt;":
          return "<";
        case "&gt;":
          return ">";
        case "&quot;":
          return '"';
        case "&apos;":
          return "'";
        default:
          return entity;
      }
    },
  );
}

function stripFootnoteMarkers(label: string): string {
  return normalizeText(label).replace(/\s*\(([a-z]|[ivx]+)\)$/gi, "");
}

function collectNodeText(node: unknown): string {
  if (typeof node === "string") {
    return node;
  }

  if (Array.isArray(node)) {
    return node.map((entry) => collectNodeText(entry)).join("");
  }

  if (!node || typeof node !== "object") {
    return "";
  }

  return Object.entries(node).reduce((text, [key, value]) => {
    if (key === ":@") {
      return text;
    }

    if (key === "#text") {
      return text + String(value);
    }

    return text + collectNodeText(value);
  }, "");
}

function collectTagGroups(node: unknown, tagName: string): unknown[][] {
  if (Array.isArray(node)) {
    return node.flatMap((entry) => collectTagGroups(entry, tagName));
  }

  if (!node || typeof node !== "object") {
    return [];
  }

  return Object.entries(node).flatMap(([key, value]) => {
    if (key === tagName && Array.isArray(value)) {
      return [value];
    }

    if (key === ":@") {
      return [];
    }

    return collectTagGroups(value, tagName);
  });
}

function extractOrderedBodyItems(documentXml: string): OrderedBodyItem[] {
  const parsed = parser.parse(documentXml) as Array<Record<string, unknown>>;
  const documentNode = parsed.find((entry) => "w:document" in entry)?.["w:document"];
  const bodyItems = Array.isArray(documentNode)
    ? documentNode.find(
        (entry): entry is Record<string, unknown> =>
          Boolean(entry && typeof entry === "object" && "w:body" in entry),
      )?.["w:body"]
    : undefined;

  if (!Array.isArray(bodyItems)) {
    throw new Error("Unable to find the DOCX body.");
  }

  return bodyItems.flatMap((item): OrderedBodyItem[] => {
    if ("w:p" in item) {
      const text = normalizeText(collectNodeText(item["w:p"]));
      return text ? [{ type: "paragraph", text }] : [];
    }

    if ("w:tbl" in item) {
      const rows = collectTagGroups(item["w:tbl"], "w:tr").map((row) =>
        collectTagGroups(row, "w:tc").map((cell) =>
          normalizeText(collectNodeText(cell)),
        ),
      );
      return [{ type: "table", rows }];
    }

    return [];
  });
}

function parseFiscalYear(value: string): string | undefined {
  const match = normalizeText(value).match(headerFiscalYearPattern);

  return match?.[1] && match[2] ? `${match[1]}/${match[2]}` : undefined;
}

function parseHeaderRow(row: string[]): Bp3OutputSummaryColumns | null {
  const normalized = row.map((cell) => normalizeText(cell).toLowerCase());
  const priorBudget = normalized[1] ?? "";
  const priorRevised = normalized[2] ?? "";
  const currentBudget = normalized[3] ?? "";
  const variation = normalized[4] ?? "";

  if (
    !headerBudgetPattern.test(priorBudget) ||
    !headerRevisedPattern.test(priorRevised) ||
    !headerBudgetPattern.test(currentBudget) ||
    !variation.startsWith("variation")
  ) {
    return null;
  }

  const createColumnDefinition = (label: string, fiscalYear?: string): ColumnDefinition =>
    fiscalYear ? { label, fiscalYear } : { label };

  return {
    priorBudget: createColumnDefinition(row[1] ?? "", parseFiscalYear(priorBudget)),
    priorRevised: createColumnDefinition(
      row[2] ?? "",
      parseFiscalYear(priorRevised),
    ),
    currentBudget: createColumnDefinition(
      row[3] ?? "",
      parseFiscalYear(currentBudget),
    ),
    variation: { label: row[4] ?? "" },
  };
}

function parseNumericCell(value: string | undefined): number | undefined {
  if (!value) {
    return undefined;
  }

  const normalized = normalizeText(value);
  if (!normalized || normalized === ".." || /^(nm|na|n\/a)$/i.test(normalized)) {
    return undefined;
  }

  const negative = normalized.startsWith("(") && normalized.endsWith(")");
  const digits = normalized.replace(/[(),%$ ]/g, "");
  const parsed = Number(digits.replace(/,/g, ""));

  return Number.isFinite(parsed) ? (negative ? -parsed : parsed) : undefined;
}

function findNearestParagraph(
  items: OrderedBodyItem[],
  tableIndex: number,
  matcher: (text: string) => boolean,
  distance = 30,
): string | undefined {
  let remaining = distance;

  for (let index = tableIndex - 1; index >= 0 && remaining > 0; index -= 1) {
    const item = items[index];
    if (item?.type !== "paragraph") {
      continue;
    }

    remaining -= 1;
    if (matcher(item.text)) {
      return item.text;
    }
  }

  return undefined;
}

function matchOwnerName(
  text: string,
  ownerLookup: Map<string, string>,
  compactOwnerLookup: Map<string, string>,
): string | undefined {
  const exactMatch = ownerLookup.get(normalizeForMatch(text));
  if (exactMatch) {
    return exactMatch;
  }

  return compactOwnerLookup.get(normalizeCompactMatch(text));
}

function resolveDepartmentName(
  items: OrderedBodyItem[],
  tableIndex: number,
  ownerLookup: Map<string, string>,
  compactOwnerLookup: Map<string, string>,
): string | undefined {
  let remaining = departmentHeadingSearchDistance;

  for (let index = tableIndex - 1; index >= 0 && remaining > 0; index -= 1) {
    const item = items[index];
    if (item?.type !== "paragraph") {
      continue;
    }

    remaining -= 1;

    const directMatch = matchOwnerName(item.text, ownerLookup, compactOwnerLookup);
    if (directMatch) {
      return directMatch;
    }

    const sourceMatch = item.text.match(/^source:\s*(.+)$/i)?.[1];
    if (sourceMatch) {
      const matchedOwner = matchOwnerName(
        sourceMatch,
        ownerLookup,
        compactOwnerLookup,
      );

      if (matchedOwner) {
        return matchedOwner;
      }
    }

    if (ownerHeadingPattern.test(item.text)) {
      return item.text;
    }
  }

  remaining = 12;
  for (
    let index = tableIndex + 1;
    index < items.length && remaining > 0;
    index += 1
  ) {
    const item = items[index];
    if (item?.type !== "paragraph") {
      continue;
    }

    remaining -= 1;

    const directMatch = matchOwnerName(item.text, ownerLookup, compactOwnerLookup);
    if (directMatch) {
      return directMatch;
    }

    const sourceMatch = item.text.match(/^source:\s*(.+)$/i)?.[1];
    if (sourceMatch) {
      const matchedOwner = matchOwnerName(
        sourceMatch,
        ownerLookup,
        compactOwnerLookup,
      );

      if (matchedOwner) {
        return matchedOwner;
      }
    }
  }

  return undefined;
}

function inferDepartmentNameFromOutputs(
  rows: Bp3OutputSummaryRow[],
  performanceMeasures: BudgetPerformanceMeasuresDataset,
): string | undefined {
  const outputLabels = rows
    .filter((row): row is Bp3OutputSummaryRow & { rowType: "output" } => row.rowType === "output")
    .map((row) => normalizeCompactMatch(row.label));

  if (outputLabels.length === 0) {
    return undefined;
  }

  const candidates = performanceMeasures.owners
    .map((owner) => {
      const outputSet = new Set(
        owner.outputs.map((output) => normalizeCompactMatch(output.outputName)),
      );
      const matchCount = outputLabels.filter((label) => outputSet.has(label)).length;

      return { ownerName: owner.ownerName, matchCount };
    })
    .filter((candidate) => candidate.matchCount > 0)
    .sort((left, right) => right.matchCount - left.matchCount);

  const bestCandidate = candidates[0];
  const secondCandidate = candidates[1];

  if (
    bestCandidate &&
    bestCandidate.matchCount >= Math.ceil(outputLabels.length * 0.8) &&
    (!secondCandidate || bestCandidate.matchCount - secondCandidate.matchCount >= 3)
  ) {
    return bestCandidate.ownerName;
  }

  return undefined;
}

type OwnerOutputMatch = {
  outputName: string;
  compactName: string;
  singularCompactName: string;
  baseCompactName?: string;
  baseSingularCompactName?: string;
  referenceAmount: number | undefined;
};

type RowSpreadsheetMatch = {
  matchedOutputNames: string[];
  referenceAmount: number | undefined;
};

function extractBaseOutputLabel(outputName: string): string | undefined {
  const [baseLabel] = outputName.split(/\s+[–-]\s+/);
  return baseLabel && baseLabel !== outputName ? baseLabel : undefined;
}

function sumReferenceAmounts(outputs: OwnerOutputMatch[]): number | undefined {
  const knownAmounts = outputs
    .map((output) => output.referenceAmount)
    .filter((amount): amount is number => amount !== undefined);

  if (knownAmounts.length !== outputs.length) {
    return undefined;
  }

  return Number(knownAmounts.reduce((sum, amount) => sum + amount, 0).toFixed(1));
}

function findGroupedAmountMatch(
  outputs: OwnerOutputMatch[],
  targetAmount: number,
  rowLabel: string,
): OwnerOutputMatch[] | undefined {
  const candidates = outputs.filter(
    (output) => output.referenceAmount !== undefined,
  );
  const matches: OwnerOutputMatch[][] = [];
  const rowTokens = normalizeSingularMatch(rowLabel)
    .split(" ")
    .filter(
      (token) =>
        token.length > 3 &&
        !["and", "with", "from", "into", "over"].includes(token),
    );

  function search(
    startIndex: number,
    chosen: OwnerOutputMatch[],
    runningTotal: number,
  ): void {
    if (
      chosen.length >= 2 &&
      Math.abs(runningTotal - targetAmount) <= groupedAmountTolerance
    ) {
      matches.push([...chosen]);
      return;
    }

    if (chosen.length === 4 || runningTotal > targetAmount + groupedAmountTolerance) {
      return;
    }

    for (let index = startIndex; index < candidates.length; index += 1) {
      const candidate = candidates[index];
      if (candidate?.referenceAmount === undefined) {
        continue;
      }

      chosen.push(candidate);
      search(
        index + 1,
        chosen,
        Number((runningTotal + candidate.referenceAmount).toFixed(1)),
      );
      chosen.pop();
    }
  }

  search(0, [], 0);

  if (matches.length === 1) {
    return matches[0];
  }

  const scoredMatches = matches.map((match) => ({
    match,
    score: match.reduce((score, output) => {
      const outputTokens = new Set(normalizeSingularMatch(output.outputName).split(" "));
      return (
        score +
        rowTokens.filter((token) => outputTokens.has(token)).length
      );
    }, 0),
  }));
  const bestScore = Math.max(...scoredMatches.map((match) => match.score));
  const bestMatches = scoredMatches.filter((match) => match.score === bestScore);

  if (bestScore > 0 && bestMatches.length === 1) {
    return bestMatches[0]?.match;
  }

  return undefined;
}

function matchOutputRowsToSpreadsheet(input: {
  outputRows: Array<
    Bp3OutputSummaryRow & {
      rowType: "output";
      amounts: Record<TableColumnKey, number>;
    }
  >;
  ownerReference: BudgetPerformanceMeasuresDataset["owners"][number] | undefined;
  outputReference: Map<string, number> | undefined;
}): RowSpreadsheetMatch[] {
  if (!input.ownerReference) {
    return input.outputRows.map(() => ({
      matchedOutputNames: [],
      referenceAmount: undefined,
    }));
  }

  const availableOutputs = input.ownerReference.outputs.map((output) => {
    const baseLabel = extractBaseOutputLabel(output.outputName);
    const match: OwnerOutputMatch = {
      outputName: output.outputName,
      compactName: normalizeCompactMatch(output.outputName),
      singularCompactName: normalizeSingularCompactMatch(output.outputName),
      referenceAmount: input.outputReference?.get(
        normalizeCompactMatch(output.outputName),
      ),
    };

    if (baseLabel) {
      match.baseCompactName = normalizeCompactMatch(baseLabel);
      match.baseSingularCompactName = normalizeSingularCompactMatch(baseLabel);
    }

    return match;
  });
  const usedOutputNames = new Set<string>();

  return input.outputRows.map((row) => {
    const rowCompactName = normalizeCompactMatch(row.label);
    const rowSingularCompactName = normalizeSingularCompactMatch(row.label);
    const remainingOutputs = availableOutputs.filter(
      (output) => !usedOutputNames.has(output.outputName),
    );

    const exactMatch = remainingOutputs.filter(
      (output) =>
        output.compactName === rowCompactName ||
        output.singularCompactName === rowSingularCompactName,
    );
    if (exactMatch.length === 1) {
      const matchedOutput = exactMatch[0];
      if (!matchedOutput) {
        return { matchedOutputNames: [], referenceAmount: undefined };
      }

      usedOutputNames.add(matchedOutput.outputName);
      return {
        matchedOutputNames: [matchedOutput.outputName],
        referenceAmount: matchedOutput.referenceAmount,
      };
    }

    const baseGroupMatch = remainingOutputs.filter(
      (output) =>
        output.baseCompactName === rowCompactName ||
        output.baseSingularCompactName === rowSingularCompactName,
    );
    if (baseGroupMatch.length >= 2) {
      for (const output of baseGroupMatch) {
        usedOutputNames.add(output.outputName);
      }

      return {
        matchedOutputNames: baseGroupMatch.map((output) => output.outputName),
        referenceAmount: sumReferenceAmounts(baseGroupMatch),
      };
    }

    const groupedAmountMatch = findGroupedAmountMatch(
      remainingOutputs,
      row.amounts.currentBudget,
      row.label,
    );
    if (groupedAmountMatch) {
      for (const output of groupedAmountMatch) {
        usedOutputNames.add(output.outputName);
      }

      return {
        matchedOutputNames: groupedAmountMatch.map((output) => output.outputName),
        referenceAmount: sumReferenceAmounts(groupedAmountMatch),
      };
    }

    return { matchedOutputNames: [], referenceAmount: undefined };
  });
}

function parseOutputSummaryTable(rows: string[][]): {
  columns: Bp3OutputSummaryColumns;
  rows: Bp3OutputSummaryRow[];
} | null {
  const headerRow = rows.find((row) => row.some((cell) => cell));
  const columns = headerRow ? parseHeaderRow(headerRow) : null;

  if (!columns || !headerRow) {
    return null;
  }

  const startIndex = rows.indexOf(headerRow) + 1;
  const parsedRows: Bp3OutputSummaryRow[] = [];
  let currentObjective: string | undefined;

  for (const row of rows.slice(startIndex)) {
    const label = stripFootnoteMarkers(row[0] ?? "");
    if (!label) {
      continue;
    }

    const amounts = {
      priorBudget: parseNumericCell(row[1]),
      priorRevised: parseNumericCell(row[2]),
      currentBudget: parseNumericCell(row[3]),
      variation: parseNumericCell(row[4]),
    };
    const rawValues = {
      priorBudget: row[1] ?? "",
      priorRevised: row[2] ?? "",
      currentBudget: row[3] ?? "",
      variation: row[4] ?? "",
    };
    const hasAmounts = Object.values(amounts).some((value) => value !== undefined);

    if (!hasAmounts) {
      currentObjective = label;
      parsedRows.push({ rowType: "objective", label });
      continue;
    }

    if (normalizeForMatch(label).startsWith("total")) {
      if (
        amounts.priorBudget === undefined ||
        amounts.priorRevised === undefined ||
        amounts.currentBudget === undefined ||
        amounts.variation === undefined
      ) {
        return null;
      }

      parsedRows.push({
        rowType: "total",
        label,
        amounts: amounts as Record<TableColumnKey, number>,
        rawValues,
      });
      continue;
    }

    if (
      amounts.priorBudget === undefined ||
      amounts.priorRevised === undefined ||
      amounts.currentBudget === undefined ||
      amounts.variation === undefined
    ) {
      return null;
    }

    parsedRows.push({
      rowType: "output",
      label,
      ...(currentObjective ? { objectiveLabel: currentObjective } : {}),
      amounts: amounts as Record<TableColumnKey, number>,
      rawValues,
    });
  }

  return parsedRows.some((row) => row.rowType === "output")
    ? { columns, rows: parsedRows }
    : null;
}

function buildOutputCostReference(
  performanceMeasures: BudgetPerformanceMeasuresDataset,
): Map<string, Map<string, number>> {
  const currentYear = performanceMeasures.budgetYear?.replace("/", "-");
  const currentTargetLabelPattern = currentYear
    ? new RegExp(currentYear.replace("-", "-20") + "\\s+target", "i")
    : undefined;
  const reference = new Map<string, Map<string, number>>();

  for (const owner of performanceMeasures.owners) {
    const outputMap = new Map<string, number>();
    for (const output of owner.outputs) {
      const totalOutputCost = output.measures.find(
        (measure) => normalizeForMatch(measure.measureName) === "total output cost",
      );
      const series = totalOutputCost?.series.find((entry) =>
        currentTargetLabelPattern
          ? currentTargetLabelPattern.test(normalizeText(entry.label))
          : /target/i.test(normalizeText(entry.label)),
      );
      const amount = parseNumericCell(series?.value);
      if (amount !== undefined) {
        outputMap.set(normalizeCompactMatch(output.outputName), amount);
      }
    }
    reference.set(normalizeCompactMatch(owner.ownerName), outputMap);
  }

  return reference;
}

function uniqueNumbers(values: number[]): number[] {
  return [...new Set(values.map((value) => value.toString()))].map((value) =>
    Number(value),
  );
}

function collectNumericCandidates(value: string | undefined): number[] {
  if (!value) {
    return [];
  }

  const parsed = parseNumericCell(value);
  const normalized = normalizeText(value);
  const digits = normalized.replace(/[(),%$ ]/g, "").replace(/,/g, "");
  const isNegative =
    normalized.startsWith("(") && normalized.endsWith(")");

  const applySign = (candidate: number): number =>
    isNegative ? -Math.abs(candidate) : candidate;

  const candidates = [
    ...(parsed !== undefined ? [parsed] : []),
  ];
  const unsignedDigits = digits.replace(/^-/, "");

  if (/^\d+$/.test(unsignedDigits) && unsignedDigits.length >= 2) {
    const shifted = Number(
      `${unsignedDigits.slice(0, -1)}.${unsignedDigits.slice(-1)}`,
    );
    if (Number.isFinite(shifted)) {
      candidates.push(applySign(shifted));
    }
  }

  if (/^\d+\.\d$/.test(unsignedDigits)) {
    const [integerPart, fractionPart] = unsignedDigits.split(".");
    if (integerPart && fractionPart && integerPart.length >= 4) {
      const shifted = Number(
        `${integerPart.slice(0, -1)}.${fractionPart}`,
      );
      if (Number.isFinite(shifted)) {
        candidates.push(applySign(shifted));
      }
    }
  }

  return uniqueNumbers(candidates);
}

function chooseClosestCandidate(
  candidates: number[],
  targets: number[],
): number | undefined {
  if (candidates.length === 0) {
    return undefined;
  }

  if (targets.length === 0) {
    return candidates[0];
  }

  return candidates.reduce((bestCandidate, candidate) => {
    const bestScore = targets.reduce(
      (sum, target) => sum + Math.abs(bestCandidate - target),
      0,
    );
    const candidateScore = targets.reduce(
      (sum, target) => sum + Math.abs(candidate - target),
      0,
    );

    return candidateScore < bestScore ? candidate : bestCandidate;
  });
}

function calculateVariation(
  priorBudget: number,
  currentBudget: number,
): number | undefined {
  if (priorBudget === 0) {
    return undefined;
  }

  return Number(
    (((currentBudget - priorBudget) / priorBudget) * 100).toFixed(1),
  );
}

function looksLikeCollapsedNumber(
  parsedValue: number,
  comparisonValues: number[],
): boolean {
  const relevantValues = comparisonValues.filter((value) => value > 0);
  if (relevantValues.length === 0) {
    return false;
  }

  return Math.abs(parsedValue) > Math.max(...relevantValues) * 3;
}

function repairOutputRowAmounts(input: {
  row: Bp3OutputSummaryRow & {
    rowType: "output";
    amounts: Record<TableColumnKey, number>;
  };
  referenceAmount: number | undefined;
}): Record<TableColumnKey, number> {
  const parsedCurrentBudget = input.row.amounts.currentBudget;
  const parsedPriorRevised = input.row.amounts.priorRevised;
  const parsedVariation = input.row.amounts.variation;
  const currentBudgetCandidates = collectNumericCandidates(
    input.row.rawValues?.currentBudget,
  );
  const variationCandidates = collectNumericCandidates(
    input.row.rawValues?.variation,
  );
  const referenceTargets =
    input.referenceAmount !== undefined ? [input.referenceAmount] : [];
  const currentBudgetFromReference = chooseClosestCandidate(
    currentBudgetCandidates,
    referenceTargets,
  );
  const currentBudgetFromVariation = currentBudgetCandidates.reduce<{
    candidate: number;
    score: number;
  } | null>((bestMatch, candidate) => {
    const expectedVariation = calculateVariation(
      input.row.amounts.priorBudget,
      candidate,
    );
    if (expectedVariation === undefined || variationCandidates.length === 0) {
      return bestMatch;
    }

    const variationScore = Math.min(
      ...variationCandidates.map((variation) =>
        Math.abs(variation - expectedVariation),
      ),
    );

    if (!bestMatch || variationScore < bestMatch.score) {
      return { candidate, score: variationScore };
    }

    return bestMatch;
  }, null);
  const currentBudgetFallbackCandidate = chooseClosestCandidate(
    currentBudgetCandidates,
    [input.row.amounts.priorBudget],
  );
  const shouldRepairCurrentBudget =
    (input.referenceAmount !== undefined &&
      currentBudgetFromReference !== undefined &&
      Math.abs(currentBudgetFromReference - parsedCurrentBudget) > 0.1) ||
    (looksLikeCollapsedNumber(parsedCurrentBudget, [
      input.row.amounts.priorBudget,
    ]) &&
      currentBudgetFallbackCandidate !== undefined);
  const repairedCurrentBudget = shouldRepairCurrentBudget
    ? (input.referenceAmount !== undefined ? currentBudgetFromReference : undefined) ??
      (currentBudgetFromVariation &&
      currentBudgetFromVariation.score <= variationTolerance
        ? currentBudgetFromVariation.candidate
        : undefined) ??
      currentBudgetFallbackCandidate ??
      parsedCurrentBudget
    : parsedCurrentBudget;
  const priorRevisedCandidate = chooseClosestCandidate(
    collectNumericCandidates(input.row.rawValues?.priorRevised),
    [input.row.amounts.priorBudget, repairedCurrentBudget],
  );
  const repairedPriorRevised =
    looksLikeCollapsedNumber(parsedPriorRevised, [
      input.row.amounts.priorBudget,
      repairedCurrentBudget,
    ]) && priorRevisedCandidate !== undefined
      ? priorRevisedCandidate
      : parsedPriorRevised;
  const expectedVariation = calculateVariation(
    input.row.amounts.priorBudget,
    repairedCurrentBudget,
  );
  const variationCandidate =
    expectedVariation !== undefined
      ? chooseClosestCandidate(variationCandidates, [expectedVariation])
      : undefined;
  const repairedVariation =
    variationCandidate !== undefined &&
    expectedVariation !== undefined &&
    Math.abs(variationCandidate - expectedVariation) <
      Math.abs(parsedVariation - expectedVariation)
      ? variationCandidate
      : parsedVariation;

  return {
    priorBudget: input.row.amounts.priorBudget,
    priorRevised: repairedPriorRevised,
    currentBudget: repairedCurrentBudget,
    variation: repairedVariation,
  };
}

function createCheck(
  id: string,
  status: ValidationStatus,
  message: string,
): Bp3ValidationCheck {
  return { id, status, message };
}

function determineVerdict(checks: Bp3ValidationCheck[]): ValidationStatus {
  if (checks.some((check) => check.status === "fail")) {
    return "fail";
  }

  if (checks.some((check) => check.status === "review")) {
    return "review";
  }

  return "pass";
}

function validateTable(
  table: Bp3OutputSummaryTable,
  performanceMeasures: BudgetPerformanceMeasuresDataset,
): Bp3DepartmentValidation {
  const outputRows = table.rows.filter(
    (row): row is Bp3OutputSummaryRow & { rowType: "output"; amounts: Record<TableColumnKey, number> } =>
      row.rowType === "output" && row.amounts !== undefined,
  );
  const totalRow = table.rows.find(
    (row): row is Bp3OutputSummaryRow & { rowType: "total"; amounts: Record<TableColumnKey, number> } =>
      row.rowType === "total" && row.amounts !== undefined,
  );
  const compactDepartmentName = normalizeCompactMatch(table.departmentName ?? "");
  const outputReference = buildOutputCostReference(performanceMeasures).get(
    compactDepartmentName,
  );
  const ownerReference = performanceMeasures.owners.find(
    (owner) => normalizeCompactMatch(owner.ownerName) === compactDepartmentName,
  );
  const repairedOutputRows = outputRows.map((row) => ({
    ...row,
    amounts: repairOutputRowAmounts({
      row,
      referenceAmount: outputReference?.get(normalizeCompactMatch(row.label)),
    }),
  }));
  const spreadsheetMatches = matchOutputRowsToSpreadsheet({
    outputRows: repairedOutputRows,
    ownerReference,
    outputReference,
  });

  const totals = repairedOutputRows.reduce(
    (sum, row) => ({
      priorBudget: sum.priorBudget + row.amounts.priorBudget,
      priorRevised: sum.priorRevised + row.amounts.priorRevised,
      currentBudget: sum.currentBudget + row.amounts.currentBudget,
    }),
    { priorBudget: 0, priorRevised: 0, currentBudget: 0 },
  );
  const totalsDifference = {
    priorBudget: totalRow ? Number((totals.priorBudget - totalRow.amounts.priorBudget).toFixed(1)) : Number.NaN,
    priorRevised: totalRow
      ? Number((totals.priorRevised - totalRow.amounts.priorRevised).toFixed(1))
      : Number.NaN,
    currentBudget: totalRow
      ? Number((totals.currentBudget - totalRow.amounts.currentBudget).toFixed(1))
      : Number.NaN,
  };
  const unmatchedOutputs = outputRows
    .filter((_, index) => spreadsheetMatches[index]?.matchedOutputNames.length === 0)
    .map((row) => row.label);
  const variationMismatches = repairedOutputRows
    .filter((row) => {
      if (row.amounts.priorBudget === 0) {
        return false;
      }

      const expected = Number(
        (
          ((row.amounts.currentBudget - row.amounts.priorBudget) /
            row.amounts.priorBudget) *
          100
        ).toFixed(1),
      );

      return Math.abs(expected - row.amounts.variation) > variationTolerance;
    })
    .map((row) => row.label);
  const spreadsheetAmountMismatches = repairedOutputRows
    .filter((row, index) => {
      const referenceAmount = spreadsheetMatches[index]?.referenceAmount;
      return referenceAmount !== undefined
        ? Math.abs(referenceAmount - row.amounts.currentBudget) > groupedAmountTolerance
        : false;
    })
    .map((row) => row.label);
  const currentBudgetDifference = Math.abs(totalsDifference.currentBudget);
  const historicalBudgetDifferences = [
    Math.abs(totalsDifference.priorBudget),
    Math.abs(totalsDifference.priorRevised),
  ];
  const columnTotalsStatus = !totalRow
    ? "fail"
    : currentBudgetDifference > currentBudgetTolerance
      ? "fail"
      : historicalBudgetDifferences.every(
          (difference) => difference <= historicalBudgetTolerance,
        )
        ? "pass"
        : "review";
  const checks: Bp3ValidationCheck[] = [
    createCheck(
      "caption",
      table.caption && outputSummaryContextPattern.test(table.caption) ? "pass" : "fail",
      table.caption
        ? `Found output-summary caption: ${table.caption}`
        : "Missing output-summary caption near the table.",
    ),
    createCheck(
      "department",
      table.departmentName ? "pass" : "fail",
      table.departmentName
        ? `Resolved department heading: ${table.departmentName}`
        : "Could not resolve a department heading for the table.",
    ),
    createCheck(
      "total-row",
      totalRow ? "pass" : "fail",
      totalRow ? "Found the department total row." : "Missing the department total row.",
    ),
    createCheck(
      "column-totals",
      columnTotalsStatus,
      totalRow
        ? `Column differences: prior budget ${totalsDifference.priorBudget}, prior revised ${totalsDifference.priorRevised}, current budget ${totalsDifference.currentBudget}.`
        : "Unable to check column totals without a total row.",
    ),
    createCheck(
      "variation",
      variationMismatches.length === 0 ? "pass" : "review",
      variationMismatches.length === 0
        ? "Every output-row variation matches the displayed percentage."
        : `Variation mismatches for: ${variationMismatches.join(", ")}.`,
    ),
    createCheck(
      "output-matching",
      unmatchedOutputs.length === 0 ? "pass" : "review",
      unmatchedOutputs.length === 0
        ? "Every output row matches the spreadsheet output list."
        : `Unmatched output rows: ${unmatchedOutputs.join(", ")}.`,
    ),
    createCheck(
      "spreadsheet-amounts",
      spreadsheetAmountMismatches.length === 0 ? "pass" : "fail",
      spreadsheetAmountMismatches.length === 0
        ? "Every comparable output matches the spreadsheet Total output cost value."
        : `Spreadsheet amount mismatches for: ${spreadsheetAmountMismatches.join(", ")}.`,
    ),
  ];

  return {
    departmentName: table.departmentName ?? "Unknown department",
    verdict: determineVerdict(checks),
    outputCount: outputRows.length,
    checks,
    unmatchedOutputs,
    totalsDifference,
    variationMismatches,
    spreadsheetAmountMismatches,
  };
}

export function parseBudgetPaper3OutputSummaryTables(
  documentXml: string,
  performanceMeasures: BudgetPerformanceMeasuresDataset,
): Bp3OutputSummaryTable[] {
  const items = extractOrderedBodyItems(documentXml);
  const ownerLookup = new Map(
    performanceMeasures.owners.map((owner) => [
      normalizeForMatch(owner.ownerName),
      owner.ownerName,
    ]),
  );
  const compactOwnerLookup = new Map(
    performanceMeasures.owners.map((owner) => [
      normalizeCompactMatch(owner.ownerName),
      owner.ownerName,
    ]),
  );

  return items.flatMap((item, tableIndex) => {
    if (item.type !== "table") {
      return [];
    }

    const parsed = parseOutputSummaryTable(item.rows);
    if (!parsed) {
      return [];
    }
    const departmentContext = findNearestParagraph(
      items,
      tableIndex,
      (text) => /output summary by departmental objectives/i.test(text),
      3,
    );
    if (!departmentContext) {
      return [];
    }

    const caption = findNearestParagraph(
      items,
      tableIndex,
      (text) => outputSummaryContextPattern.test(text),
      4,
    );
    const resolvedDepartmentName = resolveDepartmentName(
      items,
      tableIndex,
      ownerLookup,
      compactOwnerLookup,
    );
    const departmentName =
      resolvedDepartmentName ??
      inferDepartmentNameFromOutputs(parsed.rows, performanceMeasures);

    return [
      {
        ...(departmentName ? { departmentName } : {}),
        ...(caption ? { caption } : {}),
        columns: parsed.columns,
        rows: parsed.rows,
      },
    ];
  });
}

export function validateBudgetPaper3OutputSummaryTables(input: {
  source: SourceDocument;
  documentXml: string;
  performanceMeasures: BudgetPerformanceMeasuresDataset;
}): Bp3ValidationReport {
  const tables = parseBudgetPaper3OutputSummaryTables(
    input.documentXml,
    input.performanceMeasures,
  );
  const departments = tables.map((table) =>
    validateTable(table, input.performanceMeasures),
  );
  const foundDepartments = new Set(
    departments.map((department) => normalizeCompactMatch(department.departmentName)),
  );
  const missingDepartments = input.performanceMeasures.owners
    .map((owner) => owner.ownerName)
    .filter(
      (ownerName) => !foundDepartments.has(normalizeCompactMatch(ownerName)),
    );
  const summaryChecks = [
    createCheck(
      "department-coverage",
      missingDepartments.length === 0 ? "pass" : "fail",
      missingDepartments.length === 0
        ? "Found an output-summary table for every spreadsheet owner."
        : `Missing output-summary tables for: ${missingDepartments.join(", ")}.`,
    ),
  ];

  return {
    source: input.source,
    ...(tables[0]?.columns.currentBudget.fiscalYear
      ? { budgetYear: tables[0].columns.currentBudget.fiscalYear }
      : {}),
    verdict: determineVerdict([
      ...summaryChecks,
      ...departments.flatMap((department) => department.checks),
    ]),
    departmentCount: departments.length,
    departments,
    missingDepartments,
  };
}

export async function extractBudgetPaper3DocumentXml(
  arrayBuffer: ArrayBuffer,
): Promise<string> {
  return extractDocxEntry(arrayBuffer, "word/document.xml");
}

export async function parseBudgetPaper3OutputSummaryDocx(input: {
  source: SourceDocument;
  arrayBuffer: ArrayBuffer;
  performanceMeasures: BudgetPerformanceMeasuresDataset;
}): Promise<Bp3ValidationReport> {
  return validateBudgetPaper3OutputSummaryTables({
    source: input.source,
    documentXml: await extractBudgetPaper3DocumentXml(input.arrayBuffer),
    performanceMeasures: input.performanceMeasures,
  });
}

export async function fetchBudgetPaper3DocxUrl(): Promise<string> {
  const response = await fetch(BUDGET_PAPERS_URL);
  if (!response.ok) {
    throw new Error(`Budget papers request failed with ${response.status}`);
  }

  const $ = load(await response.text());
  let match: string | undefined;

  $("h2").each((_, element) => {
    if (normalizeText($(element).text()) !== CURRENT_BP3_DOCX_TITLE) {
      return;
    }

    let cursor = $(element).next();
    while (cursor.length > 0 && cursor[0]?.tagName !== "h2") {
      const href = cursor.find("a[href$='.docx']").first().attr("href");
      if (href) {
        match = new URL(href, BUDGET_PAPERS_URL).toString();
        return false;
      }
      cursor = cursor.next();
    }

    return undefined;
  });

  if (!match) {
    throw new Error("Unable to find the BP3 DOCX link on the budget papers page.");
  }

  return match;
}

export async function fetchBudgetPaper3OutputSummaryValidation(): Promise<Bp3ValidationReport> {
  const [performanceMeasures, docxUrl] = await Promise.all([
    fetchBudgetPerformanceMeasures(),
    fetchBudgetPaper3DocxUrl(),
  ]);
  const docxResponse = await fetch(docxUrl);

  if (!docxResponse.ok) {
    throw new Error(`BP3 DOCX request failed with ${docxResponse.status}`);
  }

  const source = createSourceDocument({
    sourceType: "docx",
    sourceFamily: "budget",
    title: CURRENT_BP3_DOCX_TITLE,
    sourceUrl: docxUrl,
    publisher: "Victorian Government",
    parserVersion: "sprint-2",
    rawStoragePath: "live/budget/bp3-service-delivery.docx",
  });

  return parseBudgetPaper3OutputSummaryDocx({
    source,
    arrayBuffer: await docxResponse.arrayBuffer(),
    performanceMeasures,
  });
}

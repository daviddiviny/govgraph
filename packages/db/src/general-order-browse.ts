import { and, asc, desc, eq, sql } from "drizzle-orm";

import {
  slugify,
  type GeneralOrderActEntry,
  type GeneralOrderKanonAssistance,
  type GeneralOrderRule,
  type ProvisionReference,
} from "@govgraph/domain";

import type { GovgraphDb } from "./client";
import { actAdministrationRules, sourceDocuments } from "./schema";

type ActAdministrationRuleRow = typeof actAdministrationRules.$inferSelect;

type GeneralOrderSourceSummaryRow = {
  sourceDocumentId: string;
  title: string;
  sourceUrl: string;
  effectiveDate: string | null;
  retrievedAt: Date;
  officeCount: number;
  actEntryCount: number;
  ruleCount: number;
  partialRuleCount: number;
};

export type GeneralOrderSourceSummary = {
  sourceDocumentId: string;
  title: string;
  sourceUrl: string;
  effectiveDate?: string;
  retrievedAt: string;
  officeCount: number;
  actEntryCount: number;
  ruleCount: number;
  partialRuleCount: number;
};

export type GeneralOrderOfficeSummary = {
  officeName: string;
  officeSlug: string;
  actEntryCount: number;
  ruleCount: number;
  partialRuleCount: number;
  sharedRuleCount: number;
};

export type GeneralOrderOfficeDetail = {
  source: GeneralOrderSourceSummary;
  officeName: string;
  officeSlug: string;
  actEntryCount: number;
  partialRuleCount: number;
  acts: GeneralOrderActEntry[];
};

type GeneralOrderOfficeSummaryRow = {
  officeName: string;
  actEntryCount: number;
  ruleCount: number;
  partialRuleCount: number;
  sharedRuleCount: number;
};

type GeneralOrderActEntryRow = Pick<
  ActAdministrationRuleRow,
  | "officeName"
  | "actName"
  | "headingText"
  | "headingStyle"
  | "ruleKind"
  | "scope"
  | "rawText"
  | "scopeText"
  | "administrationMode"
  | "administeringOfficeNames"
  | "provisionReferences"
  | "nestedRawTexts"
  | "parseStatus"
  | "unparsedTail"
  | "kanonAssistance"
>;

function normalizeCount(value: number | string): number {
  return typeof value === "number" ? value : Number(value);
}

function toSourceSummary(
  row: GeneralOrderSourceSummaryRow,
): GeneralOrderSourceSummary {
  return {
    sourceDocumentId: row.sourceDocumentId,
    title: row.title,
    sourceUrl: row.sourceUrl,
    retrievedAt: row.retrievedAt.toISOString(),
    officeCount: normalizeCount(row.officeCount),
    actEntryCount: normalizeCount(row.actEntryCount),
    ruleCount: normalizeCount(row.ruleCount),
    partialRuleCount: normalizeCount(row.partialRuleCount),
    ...(row.effectiveDate ? { effectiveDate: row.effectiveDate } : {}),
  };
}

export function buildGeneralOrderOfficeSummary(
  row: GeneralOrderOfficeSummaryRow,
): GeneralOrderOfficeSummary {
  return {
    officeName: row.officeName,
    officeSlug: slugify(row.officeName),
    actEntryCount: normalizeCount(row.actEntryCount),
    ruleCount: normalizeCount(row.ruleCount),
    partialRuleCount: normalizeCount(row.partialRuleCount),
    sharedRuleCount: normalizeCount(row.sharedRuleCount),
  };
}

function getRuleSortWeight(ruleKind: GeneralOrderRule["ruleKind"]): number {
  switch (ruleKind) {
    case "default":
      return 0;
    case "listed_scope":
      return 1;
    case "residual":
      return 2;
    default:
      return 3;
  }
}

function compareRules(left: GeneralOrderRule, right: GeneralOrderRule): number {
  const weightDifference =
    getRuleSortWeight(left.ruleKind) - getRuleSortWeight(right.ruleKind);

  if (weightDifference !== 0) {
    return weightDifference;
  }

  return left.rawText.localeCompare(right.rawText);
}

function toGeneralOrderRule(row: GeneralOrderActEntryRow): GeneralOrderRule {
  return {
    ruleKind: row.ruleKind,
    scope: row.scope,
    rawText: row.rawText,
    scopeText: row.scopeText ?? undefined,
    administeringOfficeNames: row.administeringOfficeNames as string[],
    administrationMode: row.administrationMode,
    provisionReferences: row.provisionReferences as ProvisionReference[],
    nestedRawTexts: row.nestedRawTexts as string[],
    parseStatus: row.parseStatus,
    unparsedTail: row.unparsedTail ?? undefined,
    kanonAssistance:
      (row.kanonAssistance as GeneralOrderKanonAssistance | null) ?? undefined,
  };
}

export function buildGeneralOrderActEntries(
  rows: GeneralOrderActEntryRow[],
): GeneralOrderActEntry[] {
  const entries = new Map<string, GeneralOrderActEntry>();

  for (const row of rows) {
    const key = `${row.officeName}::${row.actName}::${row.headingText}::${row.headingStyle}`;
    const existing = entries.get(key);

    if (existing) {
      existing.rules.push(toGeneralOrderRule(row));
      continue;
    }

    entries.set(key, {
      officeName: row.officeName,
      actName: row.actName,
      headingText: row.headingText,
      headingStyle: row.headingStyle,
      rules: [toGeneralOrderRule(row)],
    });
  }

  return Array.from(entries.values())
    .map((entry) => ({
      ...entry,
      rules: [...entry.rules].sort(compareRules),
    }))
    .sort((left, right) => left.actName.localeCompare(right.actName));
}

async function getGeneralOrderSourceRowById(
  db: GovgraphDb,
  sourceDocumentId: string,
): Promise<GeneralOrderSourceSummaryRow | null> {
  const [row] = await db
    .select({
      sourceDocumentId: actAdministrationRules.sourceDocumentId,
      title: sourceDocuments.title,
      sourceUrl: sourceDocuments.sourceUrl,
      effectiveDate: sourceDocuments.effectiveDate,
      retrievedAt: sourceDocuments.retrievedAt,
      officeCount: sql<number>`count(distinct ${actAdministrationRules.officeName})`,
      actEntryCount:
        sql<number>`count(distinct ${actAdministrationRules.officeName} || '::' || ${actAdministrationRules.actName} || '::' || ${actAdministrationRules.headingText} || '::' || ${actAdministrationRules.headingStyle})`,
      ruleCount: sql<number>`count(*)`,
      partialRuleCount:
        sql<number>`sum(case when ${actAdministrationRules.parseStatus} <> 'parsed' then 1 else 0 end)`,
    })
    .from(actAdministrationRules)
    .innerJoin(
      sourceDocuments,
      eq(actAdministrationRules.sourceDocumentId, sourceDocuments.id),
    )
    .where(eq(actAdministrationRules.sourceDocumentId, sourceDocumentId))
    .groupBy(
      actAdministrationRules.sourceDocumentId,
      sourceDocuments.title,
      sourceDocuments.sourceUrl,
      sourceDocuments.effectiveDate,
      sourceDocuments.retrievedAt,
    )
    .limit(1);

  return row ?? null;
}

async function getLatestGeneralOrderSourceRow(
  db: GovgraphDb,
): Promise<GeneralOrderSourceSummaryRow | null> {
  const [row] = await db
    .select({
      sourceDocumentId: actAdministrationRules.sourceDocumentId,
      title: sourceDocuments.title,
      sourceUrl: sourceDocuments.sourceUrl,
      effectiveDate: sourceDocuments.effectiveDate,
      retrievedAt: sourceDocuments.retrievedAt,
      officeCount: sql<number>`count(distinct ${actAdministrationRules.officeName})`,
      actEntryCount:
        sql<number>`count(distinct ${actAdministrationRules.officeName} || '::' || ${actAdministrationRules.actName} || '::' || ${actAdministrationRules.headingText} || '::' || ${actAdministrationRules.headingStyle})`,
      ruleCount: sql<number>`count(*)`,
      partialRuleCount:
        sql<number>`sum(case when ${actAdministrationRules.parseStatus} <> 'parsed' then 1 else 0 end)`,
    })
    .from(actAdministrationRules)
    .innerJoin(
      sourceDocuments,
      eq(actAdministrationRules.sourceDocumentId, sourceDocuments.id),
    )
    .groupBy(
      actAdministrationRules.sourceDocumentId,
      sourceDocuments.title,
      sourceDocuments.sourceUrl,
      sourceDocuments.effectiveDate,
      sourceDocuments.retrievedAt,
    )
    .orderBy(desc(sourceDocuments.effectiveDate), desc(sourceDocuments.retrievedAt))
    .limit(1);

  return row ?? null;
}

export async function getLatestGeneralOrderSourceSummary(
  db: GovgraphDb,
): Promise<GeneralOrderSourceSummary | null> {
  const row = await getLatestGeneralOrderSourceRow(db);

  return row ? toSourceSummary(row) : null;
}

async function resolveGeneralOrderSourceSummary(
  db: GovgraphDb,
  sourceDocumentId?: string,
): Promise<GeneralOrderSourceSummary | null> {
  if (sourceDocumentId === undefined) {
    return getLatestGeneralOrderSourceSummary(db);
  }

  const latestRow = await getLatestGeneralOrderSourceRow(db);

  if (latestRow?.sourceDocumentId === sourceDocumentId) {
    return toSourceSummary(latestRow);
  }

  const sourceRow = await getGeneralOrderSourceRowById(db, sourceDocumentId);

  return sourceRow ? toSourceSummary(sourceRow) : null;
}

export async function listGeneralOrderOfficeSummaries(
  db: GovgraphDb,
  sourceDocumentId?: string,
): Promise<GeneralOrderOfficeSummary[]> {
  const latestSource =
    sourceDocumentId === undefined
      ? await getLatestGeneralOrderSourceRow(db)
      : null;
  const resolvedSourceDocumentId =
    sourceDocumentId ?? latestSource?.sourceDocumentId ?? null;

  if (!resolvedSourceDocumentId) {
    return [];
  }

  const rows = await db
    .select({
      officeName: actAdministrationRules.officeName,
      actEntryCount:
        sql<number>`count(distinct ${actAdministrationRules.actName} || '::' || ${actAdministrationRules.headingText} || '::' || ${actAdministrationRules.headingStyle})`,
      ruleCount: sql<number>`count(*)`,
      partialRuleCount:
        sql<number>`sum(case when ${actAdministrationRules.parseStatus} <> 'parsed' then 1 else 0 end)`,
      sharedRuleCount:
        sql<number>`sum(case when ${actAdministrationRules.administrationMode} <> 'sole' then 1 else 0 end)`,
    })
    .from(actAdministrationRules)
    .where(eq(actAdministrationRules.sourceDocumentId, resolvedSourceDocumentId))
    .groupBy(actAdministrationRules.officeName)
    .orderBy(asc(actAdministrationRules.officeName));

  return rows.map(buildGeneralOrderOfficeSummary);
}

export async function getGeneralOrderOfficeDetail(
  db: GovgraphDb,
  officeSlug: string,
  sourceDocumentId?: string,
): Promise<GeneralOrderOfficeDetail | null> {
  const sourceSummary = await resolveGeneralOrderSourceSummary(
    db,
    sourceDocumentId,
  );

  if (!sourceSummary) {
    return null;
  }

  const officeRows = await db
    .select({
      officeName: actAdministrationRules.officeName,
    })
    .from(actAdministrationRules)
    .where(eq(actAdministrationRules.sourceDocumentId, sourceSummary.sourceDocumentId))
    .groupBy(actAdministrationRules.officeName)
    .orderBy(asc(actAdministrationRules.officeName));

  const officeName = officeRows.find(
    (row) => slugify(row.officeName) === officeSlug,
  )?.officeName;

  if (!officeName) {
    return null;
  }

  const rows = await db
    .select({
      officeName: actAdministrationRules.officeName,
      actName: actAdministrationRules.actName,
      headingText: actAdministrationRules.headingText,
      headingStyle: actAdministrationRules.headingStyle,
      ruleKind: actAdministrationRules.ruleKind,
      scope: actAdministrationRules.scope,
      rawText: actAdministrationRules.rawText,
      scopeText: actAdministrationRules.scopeText,
      administrationMode: actAdministrationRules.administrationMode,
      administeringOfficeNames: actAdministrationRules.administeringOfficeNames,
      provisionReferences: actAdministrationRules.provisionReferences,
      nestedRawTexts: actAdministrationRules.nestedRawTexts,
      parseStatus: actAdministrationRules.parseStatus,
      unparsedTail: actAdministrationRules.unparsedTail,
      kanonAssistance: actAdministrationRules.kanonAssistance,
    })
    .from(actAdministrationRules)
    .where(
      and(
        eq(actAdministrationRules.sourceDocumentId, sourceSummary.sourceDocumentId),
        eq(actAdministrationRules.officeName, officeName),
      ),
    )
    .orderBy(asc(actAdministrationRules.actName), asc(actAdministrationRules.rawText));

  const acts = buildGeneralOrderActEntries(rows);
  const partialRuleCount = rows.filter((row) => row.parseStatus !== "parsed").length;

  return {
    source: sourceSummary,
    officeName,
    officeSlug,
    actEntryCount: acts.length,
    partialRuleCount,
    acts,
  };
}

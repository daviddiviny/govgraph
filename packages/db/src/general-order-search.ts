import { asc, eq } from "drizzle-orm";

import {
  normalizeForMatch,
  slugify,
  type GeneralOrderActEntry,
  type GeneralOrderKanonAssistance,
  type GeneralOrderRule,
  type ProvisionReference,
} from "@govgraph/domain";

import type { GovgraphDb } from "./client";
import {
  buildGeneralOrderActEntries,
  getLatestGeneralOrderSourceSummary,
  listGeneralOrderOfficeSummaries,
  type GeneralOrderOfficeSummary,
} from "./general-order-browse";
import { actAdministrationRules } from "./schema";

export type GeneralOrderOfficeSearchResult = {
  kind: "office";
  officeName: string;
  officeSlug: string;
  actEntryCount: number;
  ruleCount: number;
  partialRuleCount: number;
  sharedRuleCount: number;
  score: number;
  matchReason: string;
};

export type GeneralOrderActSearchResult = {
  kind: "act";
  officeName: string;
  officeSlug: string;
  actName: string;
  headingText: string;
  ruleCount: number;
  partialRuleCount: number;
  sharedRuleCount: number;
  score: number;
  matchReason: string;
  previewText: string;
};

export type GeneralOrderSearchResult =
  | GeneralOrderOfficeSearchResult
  | GeneralOrderActSearchResult;

type ScoredMatch = {
  score: number;
  matchReason: string;
  previewText?: string;
};

export type GeneralOrderSearchRuleRow = {
  officeName: string;
  actName: string;
  headingText: string;
  headingStyle: GeneralOrderActEntry["headingStyle"];
  ruleKind: GeneralOrderRule["ruleKind"];
  scope: GeneralOrderRule["scope"];
  rawText: string;
  scopeText: string | null;
  administrationMode: GeneralOrderRule["administrationMode"];
  administeringOfficeNames: string[];
  provisionReferences: ProvisionReference[];
  nestedRawTexts: string[];
  parseStatus: GeneralOrderRule["parseStatus"];
  unparsedTail: string | null;
  kanonAssistance: GeneralOrderKanonAssistance | null;
};

type GeneralOrderActEntrySearchIndex = {
  officeName: string;
  officeSlug: string;
  actEntry: GeneralOrderActEntry;
  partialRuleCount: number;
  sharedRuleCount: number;
};

function scoreTextField(
  rawValue: string,
  normalizedQuery: string,
  labels: {
    exact: string;
    startsWith: string;
    contains: string;
  },
  scores: {
    exact: number;
    startsWith: number;
    contains: number;
  },
): ScoredMatch | null {
  const normalizedValue = normalizeForMatch(rawValue);

  if (!normalizedValue) {
    return null;
  }

  if (normalizedValue === normalizedQuery) {
    return {
      score: scores.exact,
      matchReason: labels.exact,
      previewText: rawValue,
    };
  }

  if (normalizedValue.startsWith(normalizedQuery)) {
    return {
      score: scores.startsWith,
      matchReason: labels.startsWith,
      previewText: rawValue,
    };
  }

  if (normalizedValue.includes(normalizedQuery)) {
    return {
      score: scores.contains,
      matchReason: labels.contains,
      previewText: rawValue,
    };
  }

  return null;
}

function scoreOfficeSummary(
  office: GeneralOrderOfficeSummary,
  normalizedQuery: string,
): GeneralOrderOfficeSearchResult | null {
  const match = scoreTextField(
    office.officeName,
    normalizedQuery,
    {
      exact: "office name match",
      startsWith: "office name starts with query",
      contains: "office name contains query",
    },
    {
      exact: 100,
      startsWith: 90,
      contains: 80,
    },
  );

  if (!match) {
    return null;
  }

  return {
    kind: "office",
    officeName: office.officeName,
    officeSlug: office.officeSlug,
    actEntryCount: office.actEntryCount,
    ruleCount: office.ruleCount,
    partialRuleCount: office.partialRuleCount,
    sharedRuleCount: office.sharedRuleCount,
    score: match.score,
    matchReason: match.matchReason,
  };
}

function scoreActEntry(
  entry: GeneralOrderActEntrySearchIndex,
  normalizedQuery: string,
): GeneralOrderActSearchResult | null {
  const candidates: ScoredMatch[] = [];

  const actNameMatch = scoreTextField(
    entry.actEntry.actName,
    normalizedQuery,
    {
      exact: "Act name match",
      startsWith: "Act name starts with query",
      contains: "Act name contains query",
    },
    {
      exact: 98,
      startsWith: 89,
      contains: 78,
    },
  );

  if (actNameMatch) {
    candidates.push(actNameMatch);
  }

  const officeMatch = scoreTextField(
    entry.officeName,
    normalizedQuery,
    {
      exact: "administering office match",
      startsWith: "administering office starts with query",
      contains: "administering office contains query",
    },
    {
      exact: 74,
      startsWith: 68,
      contains: 62,
    },
  );

  if (officeMatch) {
    candidates.push(officeMatch);
  }

  const headingMatch = scoreTextField(
    entry.actEntry.headingText,
    normalizedQuery,
    {
      exact: "heading match",
      startsWith: "heading starts with query",
      contains: "heading contains query",
    },
    {
      exact: 70,
      startsWith: 64,
      contains: 58,
    },
  );

  if (headingMatch) {
    candidates.push(headingMatch);
  }

  for (const rule of entry.actEntry.rules) {
    const ruleMatch = scoreTextField(
      rule.rawText,
      normalizedQuery,
      {
        exact: "rule text match",
        startsWith: "rule text starts with query",
        contains: "rule text contains query",
      },
      {
        exact: 67,
        startsWith: 60,
        contains: 54,
      },
    );

    if (ruleMatch) {
      candidates.push(ruleMatch);
    }

    for (const reference of rule.provisionReferences) {
      const referenceMatch = scoreTextField(
        reference.rawText,
        normalizedQuery,
        {
          exact: "provision reference match",
          startsWith: "provision reference starts with query",
          contains: "provision reference contains query",
        },
        {
          exact: 72,
          startsWith: 66,
          contains: 59,
        },
      );

      if (referenceMatch) {
        candidates.push(referenceMatch);
      }
    }
  }

  const bestMatch = candidates.sort((left, right) => right.score - left.score)[0];

  if (!bestMatch) {
    return null;
  }

  return {
    kind: "act",
    officeName: entry.officeName,
    officeSlug: entry.officeSlug,
    actName: entry.actEntry.actName,
    headingText: entry.actEntry.headingText,
    ruleCount: entry.actEntry.rules.length,
    partialRuleCount: entry.partialRuleCount,
    sharedRuleCount: entry.sharedRuleCount,
    score: bestMatch.score,
    matchReason: bestMatch.matchReason,
    previewText: bestMatch.previewText ?? entry.actEntry.rules[0]?.rawText ?? "",
  };
}

function compareSearchResults(
  left: GeneralOrderSearchResult,
  right: GeneralOrderSearchResult,
): number {
  if (right.score !== left.score) {
    return right.score - left.score;
  }

  const leftLabel =
    left.kind === "office"
      ? left.officeName
      : `${left.actName} ${left.officeName}`;
  const rightLabel =
    right.kind === "office"
      ? right.officeName
      : `${right.actName} ${right.officeName}`;

  return leftLabel.localeCompare(rightLabel);
}

export function buildGeneralOrderSearchResults(
  officeSummaries: GeneralOrderOfficeSummary[],
  rows: GeneralOrderSearchRuleRow[],
  rawQuery: string,
  limit = 8,
): GeneralOrderSearchResult[] {
  const normalizedQuery = normalizeForMatch(rawQuery);

  if (!normalizedQuery) {
    return [];
  }

  const actEntries = buildGeneralOrderActEntries(rows);

  const actResults = actEntries
    .map((actEntry) => {
      return scoreActEntry(
        {
          officeName: actEntry.officeName,
          officeSlug: slugify(actEntry.officeName),
          actEntry,
          partialRuleCount: actEntry.rules.filter(
            (rule) => rule.parseStatus !== "parsed",
          ).length,
          sharedRuleCount: actEntry.rules.filter(
            (rule) => rule.administrationMode !== "sole",
          ).length,
        },
        normalizedQuery,
      );
    })
    .filter((result): result is GeneralOrderActSearchResult => result !== null);

  const officeResults = officeSummaries
    .map((office) => scoreOfficeSummary(office, normalizedQuery))
    .filter(
      (result): result is GeneralOrderOfficeSearchResult => result !== null,
    );

  return [...officeResults, ...actResults]
    .sort(compareSearchResults)
    .slice(0, limit);
}

export async function searchGeneralOrder(
  db: GovgraphDb,
  rawQuery: string,
  limit = 8,
): Promise<GeneralOrderSearchResult[]> {
  const normalizedQuery = normalizeForMatch(rawQuery);

  if (!normalizedQuery) {
    return [];
  }

  const source = await getLatestGeneralOrderSourceSummary(db);

  if (!source) {
    return [];
  }

  const [officeSummaries, rows] = await Promise.all([
    listGeneralOrderOfficeSummaries(db, source.sourceDocumentId),
    db
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
      .where(eq(actAdministrationRules.sourceDocumentId, source.sourceDocumentId))
      .orderBy(
        asc(actAdministrationRules.officeName),
        asc(actAdministrationRules.actName),
        asc(actAdministrationRules.rawText),
      ),
  ]);

  return buildGeneralOrderSearchResults(officeSummaries, rows, rawQuery, limit);
}

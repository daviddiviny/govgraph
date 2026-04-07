import { eq } from "drizzle-orm";

import {
  deterministicId,
  type GeneralOrderDataset,
  type SourceDocument,
} from "@govgraph/domain";

import type { GovgraphDb } from "./client";
import { actAdministrationRules, sourceDocuments } from "./schema";

type SourceDocumentInsert = typeof sourceDocuments.$inferInsert;
type ActAdministrationRuleInsert = typeof actAdministrationRules.$inferInsert;

function toSourceDocumentInsert(source: SourceDocument): SourceDocumentInsert {
  return {
    id: source.id,
    sourceType: source.sourceType,
    sourceFamily: source.sourceFamily,
    title: source.title,
    sourceUrl: source.sourceUrl,
    publisher: source.publisher,
    publicationDate: source.publicationDate,
    effectiveDate: source.effectiveDate,
    retrievedAt: new Date(source.retrievedAt),
    parserVersion: source.parserVersion,
    rawStoragePath: source.rawStoragePath,
  };
}

export function buildActAdministrationRuleRows(
  dataset: GeneralOrderDataset,
): ActAdministrationRuleInsert[] {
  const timestamp = new Date(dataset.source.retrievedAt);

  return dataset.offices.flatMap((office, officeIndex) =>
    office.acts.flatMap((act, actIndex) =>
      act.rules.map((rule, ruleIndex) => ({
        id: deterministicId(
          "act-administration-rule",
          [
            dataset.source.id,
            officeIndex,
            actIndex,
            ruleIndex,
            office.officeName,
            act.actName,
            rule.ruleKind,
          ].join(":"),
        ),
        sourceDocumentId: dataset.source.id,
        effectiveDate: dataset.effectiveDate ?? dataset.source.effectiveDate,
        officeName: office.officeName,
        actName: act.actName,
        headingText: act.headingText,
        headingStyle: act.headingStyle,
        ruleKind: rule.ruleKind,
        scope: rule.scope,
        rawText: rule.rawText,
        scopeText: rule.scopeText,
        administrationMode: rule.administrationMode,
        administeringOfficeNames: rule.administeringOfficeNames,
        provisionReferences: rule.provisionReferences,
        nestedRawTexts: rule.nestedRawTexts,
        parseStatus: rule.parseStatus,
        unparsedTail: rule.unparsedTail,
        kanonAssistance: rule.kanonAssistance,
        createdAt: timestamp,
        updatedAt: timestamp,
      })),
    ),
  );
}

export async function persistGeneralOrderDataset(
  db: GovgraphDb,
  dataset: GeneralOrderDataset,
): Promise<{
  sourceDocumentId: string;
  officeCount: number;
  actCount: number;
  ruleCount: number;
  partialRuleCount: number;
}> {
  const sourceDocument = toSourceDocumentInsert(dataset.source);
  const ruleRows = buildActAdministrationRuleRows(dataset);
  const actCount = dataset.offices.reduce((count, office) => count + office.acts.length, 0);
  const partialRuleCount = ruleRows.filter(
    (row) => row.parseStatus !== "parsed",
  ).length;

  await db.transaction(async (tx) => {
    await tx
      .insert(sourceDocuments)
      .values(sourceDocument)
      .onConflictDoUpdate({
        target: sourceDocuments.id,
        set: {
          sourceType: sourceDocument.sourceType,
          sourceFamily: sourceDocument.sourceFamily,
          title: sourceDocument.title,
          sourceUrl: sourceDocument.sourceUrl,
          publisher: sourceDocument.publisher,
          publicationDate: sourceDocument.publicationDate,
          effectiveDate: sourceDocument.effectiveDate,
          retrievedAt: sourceDocument.retrievedAt,
          parserVersion: sourceDocument.parserVersion,
          rawStoragePath: sourceDocument.rawStoragePath,
        },
      });

    await tx
      .delete(actAdministrationRules)
      .where(eq(actAdministrationRules.sourceDocumentId, dataset.source.id));

    if (ruleRows.length > 0) {
      await tx.insert(actAdministrationRules).values(ruleRows);
    }
  });

  return {
    sourceDocumentId: dataset.source.id,
    officeCount: dataset.offices.length,
    actCount,
    ruleCount: ruleRows.length,
    partialRuleCount,
  };
}

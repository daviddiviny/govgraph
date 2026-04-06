import {
  date,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import {
  assertionConfidenceEnum,
  sourceFamilyEnum,
  sourceTypeEnum,
} from "./enums";

export const sourceDocuments = pgTable(
  "source_documents",
  {
    id: uuid("id").primaryKey(),
    sourceType: sourceTypeEnum("source_type").notNull(),
    sourceFamily: sourceFamilyEnum("source_family").notNull(),
    title: text("title").notNull(),
    sourceUrl: text("source_url").notNull(),
    publisher: text("publisher").notNull(),
    publicationDate: date("publication_date"),
    effectiveDate: date("effective_date"),
    retrievedAt: timestamp("retrieved_at", { withTimezone: true }).notNull(),
    checksum: text("checksum"),
    parserVersion: text("parser_version").notNull(),
    licence: text("licence"),
    rawStoragePath: text("raw_storage_path").notNull(),
  },
  (table) => ({
    sourceUrlIdx: uniqueIndex("source_documents_source_url_idx").on(
      table.sourceUrl,
    ),
  }),
);

export const sourceAssertions = pgTable("source_assertions", {
  id: uuid("id").primaryKey(),
  sourceDocumentId: uuid("source_document_id")
    .notNull()
    .references(() => sourceDocuments.id),
  subjectText: text("subject_text").notNull(),
  predicate: text("predicate").notNull(),
  objectText: text("object_text"),
  valueJson: jsonb("value_json"),
  pageRef: text("page_ref"),
  rowRef: text("row_ref"),
  extractedAt: timestamp("extracted_at", { withTimezone: true }).notNull(),
  confidence: assertionConfidenceEnum("confidence").notNull(),
});

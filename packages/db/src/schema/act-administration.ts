import {
  date,
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import type {
  GeneralOrderKanonAssistance,
  ProvisionReference,
} from "@govgraph/domain";

import {
  administrationModeEnum,
  administrationScopeEnum,
  generalOrderHeadingStyleEnum,
  generalOrderParseStatusEnum,
  generalOrderRuleKindEnum,
} from "./enums";
import { sourceDocuments } from "./sources";

export const actAdministrationRules = pgTable(
  "act_administration_rules",
  {
    id: uuid("id").primaryKey(),
    sourceDocumentId: uuid("source_document_id")
      .notNull()
      .references(() => sourceDocuments.id, { onDelete: "cascade" }),
    effectiveDate: date("effective_date"),
    officeName: text("office_name").notNull(),
    actName: text("act_name").notNull(),
    headingText: text("heading_text").notNull(),
    headingStyle: generalOrderHeadingStyleEnum("heading_style").notNull(),
    ruleKind: generalOrderRuleKindEnum("rule_kind").notNull(),
    scope: administrationScopeEnum("scope").notNull(),
    rawText: text("raw_text").notNull(),
    scopeText: text("scope_text"),
    administrationMode: administrationModeEnum("administration_mode").notNull(),
    administeringOfficeNames: jsonb("administering_office_names")
      .$type<string[]>()
      .notNull(),
    provisionReferences: jsonb("provision_references")
      .$type<ProvisionReference[]>()
      .notNull(),
    nestedRawTexts: jsonb("nested_raw_texts").$type<string[]>().notNull(),
    parseStatus: generalOrderParseStatusEnum("parse_status").notNull(),
    unparsedTail: text("unparsed_tail"),
    kanonAssistance: jsonb("kanon_assistance").$type<GeneralOrderKanonAssistance>(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
  },
  (table) => ({
    sourceDocumentIdx: index("act_administration_rules_source_document_idx").on(
      table.sourceDocumentId,
    ),
    officeLookupIdx: index("act_administration_rules_office_lookup_idx").on(
      table.officeName,
      table.actName,
    ),
  }),
);

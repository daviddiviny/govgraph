import {
  date,
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import {
  aliasTypeEnum,
  nodeTypeEnum,
  recordStatusEnum,
  sourceConfidenceEnum,
} from "./enums";
import { sourceDocuments } from "./sources";

export const nodes = pgTable(
  "nodes",
  {
    id: uuid("id").primaryKey(),
    nodeType: nodeTypeEnum("node_type").notNull(),
    canonicalName: text("canonical_name").notNull(),
    slug: text("slug").notNull(),
    status: recordStatusEnum("status").notNull().default("active"),
    description: text("description"),
    websiteUrl: text("website_url"),
    sourceConfidence:
      sourceConfidenceEnum("source_confidence").notNull().default("high"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
  },
  (table) => ({
    slugIdx: uniqueIndex("nodes_slug_idx").on(table.slug),
    typeNameIdx: index("nodes_type_name_idx").on(
      table.nodeType,
      table.canonicalName,
    ),
  }),
);

export const nodeAliases = pgTable(
  "node_aliases",
  {
    id: uuid("id").primaryKey(),
    nodeId: uuid("node_id")
      .notNull()
      .references(() => nodes.id),
    alias: text("alias").notNull(),
    aliasType: aliasTypeEnum("alias_type").notNull(),
    sourceDocumentId: uuid("source_document_id").references(
      () => sourceDocuments.id,
    ),
    validFrom: date("valid_from"),
    validTo: date("valid_to"),
  },
  (table) => ({
    nodeAliasIdx: index("node_aliases_node_alias_idx").on(
      table.nodeId,
      table.alias,
    ),
  }),
);

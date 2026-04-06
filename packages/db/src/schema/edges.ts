import { date, index, pgTable, text, uuid } from "drizzle-orm/pg-core";

import { edgeTypeEnum, recordStatusEnum } from "./enums";
import { nodes } from "./nodes";
import { sourceDocuments } from "./sources";

export const edges = pgTable(
  "edges",
  {
    id: uuid("id").primaryKey(),
    edgeType: edgeTypeEnum("edge_type").notNull(),
    fromNodeId: uuid("from_node_id")
      .notNull()
      .references(() => nodes.id),
    toNodeId: uuid("to_node_id")
      .notNull()
      .references(() => nodes.id),
    validFrom: date("valid_from"),
    validTo: date("valid_to"),
    status: recordStatusEnum("status").notNull().default("active"),
    sourceDocumentId: uuid("source_document_id").references(
      () => sourceDocuments.id,
    ),
    notes: text("notes"),
  },
  (table) => ({
    lookupIdx: index("edges_lookup_idx").on(
      table.edgeType,
      table.fromNodeId,
      table.toNodeId,
    ),
  }),
);

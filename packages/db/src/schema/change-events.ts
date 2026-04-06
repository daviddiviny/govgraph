import { date, pgTable, text, uuid } from "drizzle-orm/pg-core";

import { changeEventTypeEnum } from "./enums";
import { nodes } from "./nodes";
import { sourceDocuments } from "./sources";

export const changeEvents = pgTable("change_events", {
  id: uuid("id").primaryKey(),
  eventType: changeEventTypeEnum("event_type").notNull(),
  affectedNodeId: uuid("affected_node_id").references(() => nodes.id),
  fromNodeId: uuid("from_node_id").references(() => nodes.id),
  toNodeId: uuid("to_node_id").references(() => nodes.id),
  effectiveDate: date("effective_date").notNull(),
  sourceDocumentId: uuid("source_document_id")
    .notNull()
    .references(() => sourceDocuments.id),
  summary: text("summary").notNull(),
});

import { date, numeric, pgTable, text, uuid } from "drizzle-orm/pg-core";

import { budgetPhaseEnum } from "./enums";
import { nodes } from "./nodes";
import { sourceDocuments } from "./sources";

export const budgetMetrics = pgTable("budget_metrics", {
  id: uuid("id").primaryKey(),
  nodeId: uuid("node_id")
    .notNull()
    .references(() => nodes.id),
  metricFamily: text("metric_family").notNull(),
  metricName: text("metric_name").notNull(),
  amount: numeric("amount"),
  currency: text("currency").notNull().default("AUD"),
  fiscalYear: text("fiscal_year").notNull(),
  budgetPhase: budgetPhaseEnum("budget_phase").notNull().default("budget"),
  sourceDocumentId: uuid("source_document_id")
    .notNull()
    .references(() => sourceDocuments.id),
  notes: text("notes"),
});

export const performanceMeasures = pgTable("performance_measures", {
  id: uuid("id").primaryKey(),
  nodeId: uuid("node_id")
    .notNull()
    .references(() => nodes.id),
  measureName: text("measure_name").notNull(),
  measureUnit: text("measure_unit"),
  targetValue: text("target_value"),
  actualValue: text("actual_value"),
  periodLabel: text("period_label").notNull(),
  sourceDocumentId: uuid("source_document_id")
    .notNull()
    .references(() => sourceDocuments.id),
});

export const workforceMetrics = pgTable("workforce_metrics", {
  id: uuid("id").primaryKey(),
  nodeId: uuid("node_id")
    .notNull()
    .references(() => nodes.id),
  metricName: text("metric_name").notNull(),
  metricValue: numeric("metric_value").notNull(),
  asAtDate: date("as_at_date").notNull(),
  sourceDocumentId: uuid("source_document_id")
    .notNull()
    .references(() => sourceDocuments.id),
});

export const capitalProjects = pgTable("capital_projects", {
  id: uuid("id").primaryKey(),
  nodeId: uuid("node_id").references(() => nodes.id),
  projectName: text("project_name").notNull(),
  category: text("category"),
  projectType: text("project_type"),
  locationText: text("location_text"),
  investmentAmount: numeric("investment_amount"),
  fiscalYear: text("fiscal_year"),
  sourceDocumentId: uuid("source_document_id")
    .notNull()
    .references(() => sourceDocuments.id),
});

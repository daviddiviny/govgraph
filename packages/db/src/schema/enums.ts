import { pgEnum } from "drizzle-orm/pg-core";

export const nodeTypeEnum = pgEnum("node_type", [
  "person",
  "ministry",
  "ministerial_office",
  "department",
  "administrative_office",
  "public_entity",
  "program_output",
  "capital_project",
  "performance_measure",
  "budget_document",
  "source_document",
  "organisation_group",
]);

export const edgeTypeEnum = pgEnum("edge_type", [
  "HOLDS_OFFICE",
  "MEMBER_OF_MINISTRY",
  "SUPPORTED_BY_DEPARTMENT",
  "IN_PORTFOLIO",
  "REPORTS_TO",
  "RESPONSIBLE_FOR",
  "DELIVERS_OUTPUT",
  "HAS_PERFORMANCE_MEASURE",
  "HAS_CAPITAL_PROJECT",
  "FUNDED_BY",
  "SUCCEEDED_BY",
  "RENAMED_TO",
  "MOVED_TO_PORTFOLIO",
  "HAS_SOURCE",
]);

export const recordStatusEnum = pgEnum("record_status", [
  "active",
  "ceased",
  "superseded",
  "draft",
]);

export const sourceConfidenceEnum = pgEnum("source_confidence", [
  "high",
  "medium",
  "low",
]);

export const aliasTypeEnum = pgEnum("alias_type", [
  "acronym",
  "former_name",
  "source_name",
  "short_name",
]);

export const sourceTypeEnum = pgEnum("source_type", [
  "html",
  "pdf",
  "docx",
  "xlsx",
  "csv",
  "api",
]);

export const sourceFamilyEnum = pgEnum("source_family", [
  "budget",
  "gazette",
  "vpsc",
  "vic_gov",
  "parliament",
]);

export const assertionConfidenceEnum = pgEnum("assertion_confidence", [
  "high",
  "medium",
  "low",
]);

export const budgetPhaseEnum = pgEnum("budget_phase", [
  "budget",
  "revised",
  "actual",
]);

export const changeEventTypeEnum = pgEnum("change_event_type", [
  "created",
  "abolished",
  "renamed",
  "transferred",
  "portfolio_changed",
]);

export const generalOrderHeadingStyleEnum = pgEnum("general_order_heading_style", [
  "plain",
  "except",
  "scoped_list",
]);

export const administrationModeEnum = pgEnum("administration_mode", [
  "sole",
  "joint",
  "joint_and_several",
  "unknown",
]);

export const administrationScopeEnum = pgEnum("administration_scope", [
  "whole_act",
  "provision_list",
  "residual",
]);

export const generalOrderRuleKindEnum = pgEnum("general_order_rule_kind", [
  "default",
  "listed_scope",
  "residual",
]);

export const generalOrderParseStatusEnum = pgEnum("general_order_parse_status", [
  "parsed",
  "partial",
]);

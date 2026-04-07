import { z } from "zod";

import { edgeTypes } from "./edge-types";
import { nodeTypes } from "./node-types";

export const sourceFamilySchema = z.enum([
  "budget",
  "gazette",
  "vpsc",
  "vic_gov",
  "parliament",
]);

export const sourceTypeSchema = z.enum([
  "html",
  "pdf",
  "docx",
  "xlsx",
  "csv",
  "api",
]);

export const sourceDocumentSchema = z.object({
  id: z.string().uuid(),
  sourceType: sourceTypeSchema,
  sourceFamily: sourceFamilySchema,
  title: z.string(),
  sourceUrl: z.string().url(),
  publisher: z.string(),
  publicationDate: z.string().optional(),
  effectiveDate: z.string().optional(),
  retrievedAt: z.string(),
  parserVersion: z.string(),
  rawStoragePath: z.string(),
});

export const governmentNodeSchema = z.object({
  id: z.string().uuid(),
  nodeType: z.enum(nodeTypes),
  canonicalName: z.string(),
  slug: z.string(),
  status: z.enum(["active", "ceased", "superseded", "draft"]).default("active"),
  description: z.string().optional(),
  websiteUrl: z.string().url().optional(),
  sourceConfidence: z.enum(["high", "medium", "low"]).default("high"),
  aliases: z.array(z.string()).default([]),
  sourceDocumentIds: z.array(z.string().uuid()).default([]),
});

export const governmentEdgeSchema = z.object({
  id: z.string().uuid(),
  edgeType: z.enum(edgeTypes),
  fromNodeId: z.string().uuid(),
  toNodeId: z.string().uuid(),
  validFrom: z.string().optional(),
  validTo: z.string().optional(),
  status: z.enum(["active", "ceased", "superseded", "draft"]).default("active"),
  sourceDocumentIds: z.array(z.string().uuid()).default([]),
  notes: z.string().optional(),
});

export const governmentCatalogSchema = z.object({
  generatedAt: z.string(),
  nodes: z.array(governmentNodeSchema),
  edges: z.array(governmentEdgeSchema),
  sourceDocuments: z.array(sourceDocumentSchema),
  summary: z.object({
    totalNodes: z.number().int().nonnegative(),
    totalEdges: z.number().int().nonnegative(),
    countsByType: z.record(z.enum(nodeTypes), z.number().int().nonnegative()),
  }),
});

export type SourceDocument = z.infer<typeof sourceDocumentSchema>;
export type GovernmentNode = z.infer<typeof governmentNodeSchema>;
export type GovernmentEdge = z.infer<typeof governmentEdgeSchema>;
export type GovernmentCatalog = z.infer<typeof governmentCatalogSchema>;

export type PortfolioSectionInput = {
  portfolioGroupName: string;
  departmentName: string;
  departmentDescription: string;
  officeTitles: string[];
};

export type VpscPortfolioDataset = {
  source: SourceDocument;
  asOfDate?: string;
  sections: PortfolioSectionInput[];
};

export type MinistryMemberInput = {
  personName: string;
  officeTitles: string[];
  detailUrl?: string;
};

export type MinistryDataset = {
  source: SourceDocument;
  members: MinistryMemberInput[];
};

export type VpscEmployerInput = {
  employerName: string;
  employerType: string;
  publicSectorBodyType: string;
  industry: string;
  subSector: string;
  portfolioDepartment: string;
  virtDetermination: string;
  executivePolicy: string;
};

export type VpscEmployersDataset = {
  source: SourceDocument;
  asOfDate?: string;
  employers: VpscEmployerInput[];
};

export type BudgetIndexEntryInput = {
  title: string;
  summary?: string;
  landingUrl: string;
  aliases?: string[];
  sourceDocuments: SourceDocument[];
};

export type BudgetIndexDataset = {
  source: SourceDocument;
  budgetYear?: string;
  entries: BudgetIndexEntryInput[];
};

export type BudgetPerformanceMeasureSeriesEntryInput = {
  label: string;
  value: string;
};

export type BudgetPerformanceMeasureInput = {
  category: string;
  measureName: string;
  unitOfMeasure?: string;
  note?: string;
  series: BudgetPerformanceMeasureSeriesEntryInput[];
};

export type BudgetProgramOutputInput = {
  outputName: string;
  measures: BudgetPerformanceMeasureInput[];
};

export type BudgetPerformanceMeasureOwnerInput = {
  ownerName: string;
  ownerNodeType: Extract<
    GovernmentNode["nodeType"],
    "department" | "public_entity" | "administrative_office" | "organisation_group"
  >;
  source: SourceDocument;
  outputs: BudgetProgramOutputInput[];
};

export type BudgetPerformanceMeasuresDataset = {
  source: SourceDocument;
  budgetYear?: string;
  owners: BudgetPerformanceMeasureOwnerInput[];
};

export const administrationModeSchema = z.enum([
  "sole",
  "joint",
  "joint_and_several",
  "unknown",
]);

export const administrationScopeSchema = z.enum([
  "whole_act",
  "provision_list",
  "residual",
]);

export const generalOrderParseStatusSchema = z.enum(["parsed", "partial"]);

export const kanonExternalDocumentTypeSchema = z.enum([
  "statute",
  "regulation",
  "decision",
  "contract",
  "other",
]);

export const provisionReferenceSchema = z.object({
  rawText: z.string(),
  unit: z.enum([
    "section",
    "part",
    "division",
    "subdivision",
    "chapter",
    "schedule",
    "act",
    "other",
  ]),
  label: z.string(),
});

export const generalOrderKanonAssistanceSchema = z.object({
  model: z.literal("kanon-2-enricher"),
  status: z.enum(["enriched", "no_signal", "failed"]),
  externalDocumentNames: z.array(z.string()).default([]),
  externalDocumentTypes: z.array(kanonExternalDocumentTypeSchema).default([]),
  pinpointTexts: z.array(z.string()).default([]),
  pinpointReferences: z.array(provisionReferenceSchema).default([]),
  error: z.string().optional(),
});

export const generalOrderRuleSchema = z.object({
  ruleKind: z.enum(["default", "listed_scope", "residual"]),
  scope: administrationScopeSchema,
  rawText: z.string(),
  scopeText: z.string().optional(),
  administeringOfficeNames: z.array(z.string()).default([]),
  administrationMode: administrationModeSchema,
  provisionReferences: z.array(provisionReferenceSchema).default([]),
  nestedRawTexts: z.array(z.string()).default([]),
  parseStatus: generalOrderParseStatusSchema,
  unparsedTail: z.string().optional(),
  kanonAssistance: generalOrderKanonAssistanceSchema.optional(),
});

export const generalOrderActEntrySchema = z.object({
  officeName: z.string(),
  actName: z.string(),
  headingText: z.string(),
  headingStyle: z.enum(["plain", "except", "scoped_list"]),
  rules: z.array(generalOrderRuleSchema),
});

export const generalOrderOfficeSectionSchema = z.object({
  officeName: z.string(),
  acts: z.array(generalOrderActEntrySchema),
});

export const generalOrderDatasetSchema = z.object({
  source: sourceDocumentSchema,
  effectiveDate: z.string().optional(),
  offices: z.array(generalOrderOfficeSectionSchema),
});

export type ProvisionReference = z.infer<typeof provisionReferenceSchema>;
export type GeneralOrderKanonAssistance = z.infer<
  typeof generalOrderKanonAssistanceSchema
>;
export type GeneralOrderRule = z.infer<typeof generalOrderRuleSchema>;
export type GeneralOrderActEntry = z.infer<typeof generalOrderActEntrySchema>;
export type GeneralOrderOfficeSection = z.infer<
  typeof generalOrderOfficeSectionSchema
>;
export type GeneralOrderDataset = z.infer<typeof generalOrderDatasetSchema>;

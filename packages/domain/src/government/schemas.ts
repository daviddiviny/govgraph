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

export const sourceTypeSchema = z.enum(["html", "pdf", "xlsx", "csv", "api"]);

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
  portfolioTitles: string[];
};

export type VpscPortfolioDataset = {
  source: SourceDocument;
  asOfDate?: string;
  sections: PortfolioSectionInput[];
};

export type MinistryMemberInput = {
  personName: string;
  titles: string[];
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

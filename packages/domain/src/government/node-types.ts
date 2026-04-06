export const nodeTypes = [
  "person",
  "ministry",
  "portfolio",
  "department",
  "administrative_office",
  "public_entity",
  "program_output",
  "capital_project",
  "performance_measure",
  "budget_document",
  "source_document",
  "organisation_group",
] as const;

export type NodeType = (typeof nodeTypes)[number];

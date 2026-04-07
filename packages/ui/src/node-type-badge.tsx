import type { HTMLAttributes } from "react";

import { Badge } from "./badge";
import { cn } from "./utils";

const nodeTypeToneClasses = {
  person:
    "border-[var(--gg-color-node-person-border)] bg-[var(--gg-color-node-person-bg)] text-[var(--gg-color-node-person-text)]",
  ministry:
    "border-[var(--gg-color-node-ministry-border)] bg-[var(--gg-color-node-ministry-bg)] text-[var(--gg-color-node-ministry-text)]",
  portfolio:
    "border-[var(--gg-color-node-portfolio-border)] bg-[var(--gg-color-node-portfolio-bg)] text-[var(--gg-color-node-portfolio-text)]",
  department:
    "border-[var(--gg-color-node-department-border)] bg-[var(--gg-color-node-department-bg)] text-[var(--gg-color-node-department-text)]",
  administrative_office:
    "border-[var(--gg-color-node-administrative-office-border)] bg-[var(--gg-color-node-administrative-office-bg)] text-[var(--gg-color-node-administrative-office-text)]",
  public_entity:
    "border-[var(--gg-color-node-public-entity-border)] bg-[var(--gg-color-node-public-entity-bg)] text-[var(--gg-color-node-public-entity-text)]",
  program_output:
    "border-[var(--gg-color-node-program-output-border)] bg-[var(--gg-color-node-program-output-bg)] text-[var(--gg-color-node-program-output-text)]",
  capital_project:
    "border-[var(--gg-color-node-capital-project-border)] bg-[var(--gg-color-node-capital-project-bg)] text-[var(--gg-color-node-capital-project-text)]",
  performance_measure:
    "border-[var(--gg-color-node-performance-measure-border)] bg-[var(--gg-color-node-performance-measure-bg)] text-[var(--gg-color-node-performance-measure-text)]",
  budget_document:
    "border-[var(--gg-color-node-budget-document-border)] bg-[var(--gg-color-node-budget-document-bg)] text-[var(--gg-color-node-budget-document-text)]",
  source_document:
    "border-[var(--gg-color-node-source-document-border)] bg-[var(--gg-color-node-source-document-bg)] text-[var(--gg-color-node-source-document-text)]",
  organisation_group:
    "border-[var(--gg-color-node-organisation-group-border)] bg-[var(--gg-color-node-organisation-group-bg)] text-[var(--gg-color-node-organisation-group-text)]",
} as const;

export type NodeTypeBadgeType = keyof typeof nodeTypeToneClasses;

function humanizeNodeType(nodeType: NodeTypeBadgeType): string {
  return nodeType.replace(/_/g, " ");
}

export function getNodeTypeBadgeClasses(nodeType: NodeTypeBadgeType): string {
  return nodeTypeToneClasses[nodeType];
}

type NodeTypeBadgeProps = HTMLAttributes<HTMLSpanElement> & {
  label?: string;
  nodeType: NodeTypeBadgeType;
};

export function NodeTypeBadge({
  className,
  label,
  nodeType,
  ...props
}: NodeTypeBadgeProps) {
  return (
    <Badge
      className={cn(getNodeTypeBadgeClasses(nodeType), className)}
      {...props}
    >
      {label ?? humanizeNodeType(nodeType)}
    </Badge>
  );
}

import type { GeneralOrderRule, ProvisionReference } from "@govgraph/domain";

export function humanizeAdministrationMode(
  administrationMode: GeneralOrderRule["administrationMode"],
): string {
  switch (administrationMode) {
    case "joint_and_several":
      return "Joint and several";
    case "joint":
      return "Joint";
    case "sole":
      return "Sole";
    case "unknown":
      return "Unknown";
    default:
      return administrationMode;
  }
}

export function humanizeAdministrationScope(
  scope: GeneralOrderRule["scope"],
): string {
  switch (scope) {
    case "whole_act":
      return "Whole Act";
    case "provision_list":
      return "Specific provisions";
    case "residual":
      return "Residual";
    default:
      return scope;
  }
}

export function humanizeRuleKind(ruleKind: GeneralOrderRule["ruleKind"]): string {
  switch (ruleKind) {
    case "default":
      return "Default rule";
    case "listed_scope":
      return "Listed carve-out";
    case "residual":
      return "Residual rule";
    default:
      return ruleKind;
  }
}

export function humanizeParseStatus(
  parseStatus: GeneralOrderRule["parseStatus"],
): string {
  switch (parseStatus) {
    case "parsed":
      return "Parsed";
    case "partial":
      return "Partially parsed";
    default:
      return parseStatus;
  }
}

export function summarizeProvisionReferences(
  provisionReferences: ProvisionReference[],
): string {
  return provisionReferences.map((reference) => reference.rawText).join(", ");
}

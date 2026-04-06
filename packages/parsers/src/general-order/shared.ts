import type { ProvisionReference } from "@govgraph/domain";

export function normalizeGeneralOrderText(value: string): string {
  return value
    .replace(/\u00a0/g, " ")
    .replace(/[\u2010\u2011\u2012\u2013\u2014]/g, "-")
    .replace(/Attorney-\s+General/g, "Attorney-General")
    .replace(/\s+/g, " ")
    .trim();
}

export function extractProvisionReferencesFromText(
  scopeText: string,
): ProvisionReference[] {
  const normalized = normalizeGeneralOrderText(scopeText);
  const references: ProvisionReference[] = [];
  const referencePattern =
    /\b(Sections?|Parts?|Divisions?|Subdivisions?|Chapters?|Schedules?)\s+([^;]+?)(?=(?:,\s*(?:Sections?|Parts?|Divisions?|Subdivisions?|Chapters?|Schedules?)\b)|(?:\s+(?:and|or)\s+(?:Sections?|Parts?|Divisions?|Subdivisions?|Chapters?|Schedules?)\b)|$)/gi;

  for (const match of normalized.matchAll(referencePattern)) {
    const unitText = match[1]?.toLowerCase() ?? "";
    const label = normalizeGeneralOrderText(match[2] ?? "");

    if (!label) {
      continue;
    }

    let unit: ProvisionReference["unit"] = "other";
    if (unitText.startsWith("section")) {
      unit = "section";
    } else if (unitText.startsWith("part")) {
      unit = "part";
    } else if (unitText.startsWith("division")) {
      unit = "division";
    } else if (unitText.startsWith("subdivision")) {
      unit = "subdivision";
    } else if (unitText.startsWith("chapter")) {
      unit = "chapter";
    } else if (unitText.startsWith("schedule")) {
      unit = "schedule";
    }

    references.push({
      rawText: normalizeGeneralOrderText(`${match[1]} ${label}`),
      unit,
      label,
    });
  }

  return references;
}

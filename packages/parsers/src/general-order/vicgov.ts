import { type CheerioAPI, load } from "cheerio";

import {
  generalOrderDatasetSchema,
  type GeneralOrderActEntry,
  type GeneralOrderDataset,
  type GeneralOrderRule,
} from "@govgraph/domain";

import { generalOrderFixture } from "../fixtures/general-order.fixture";
import { parseHumanDate } from "../shared/date";
import { createSourceDocument } from "../shared/source-document";
import {
  assistPartialGeneralOrderRulesWithKanon,
  type AssistGeneralOrderWithKanonOptions,
} from "./kanon";
import {
  extractProvisionReferencesFromText,
  normalizeGeneralOrderText as normalizeText,
} from "./shared";

export const VIC_GOV_GENERAL_ORDER_URL =
  "https://www.vic.gov.au/general-order-effective-30-october-2025";

type HeadingStyle = GeneralOrderActEntry["headingStyle"];
type AdministrationMode = GeneralOrderRule["administrationMode"];
type ParseStatus = GeneralOrderRule["parseStatus"];
type CheerioElement = Parameters<CheerioAPI>[0];

type ParentheticalChunk = {
  start: number;
  end: number;
  content: string;
};

type AdministrationDetails = {
  administeringOfficeNames: string[];
  administrationMode: AdministrationMode;
  parseStatus: ParseStatus;
  unparsedTail?: string;
};

function stripOuterParentheses(value: string): string {
  const trimmed = value.trim();
  if (!trimmed.startsWith("(") || !trimmed.endsWith(")")) {
    return trimmed;
  }

  let depth = 0;
  for (let index = 0; index < trimmed.length; index += 1) {
    const character = trimmed[index];
    if (character === "(") {
      depth += 1;
    } else if (character === ")") {
      depth -= 1;
      if (depth === 0 && index !== trimmed.length - 1) {
        return trimmed;
      }
    }
  }

  return trimmed.slice(1, -1).trim();
}

function getTopLevelParentheticalChunks(value: string): ParentheticalChunk[] {
  const chunks: ParentheticalChunk[] = [];
  let depth = 0;
  let start = -1;

  for (let index = 0; index < value.length; index += 1) {
    const character = value[index];
    if (character === "(") {
      if (depth === 0) {
        start = index;
      }
      depth += 1;
    } else if (character === ")") {
      depth -= 1;
      if (depth === 0 && start >= 0) {
        chunks.push({
          start,
          end: index,
          content: value.slice(start + 1, index).trim(),
        });
        start = -1;
      }
    }
  }

  return chunks;
}

function extractEffectiveDate(html: string): string | undefined {
  const match = normalizeText(load(html).text()).match(
    /Effective date:\s*(\d{1,2}\s+[A-Za-z]+\s+\d{4})/i,
  );

  return parseHumanDate(match?.[1] ?? "");
}

function parseHeadingText(headingText: string): {
  actName: string;
  headingStyle: HeadingStyle;
} {
  const normalized = normalizeText(headingText);

  if (/\s-\s*Except:$/i.test(normalized)) {
    return {
      actName: normalized.replace(/\s-\s*Except:$/i, "").trim(),
      headingStyle: "except",
    };
  }

  if (/\s-\s*$/i.test(normalized)) {
    return {
      actName: normalized.replace(/\s-\s*$/i, "").trim(),
      headingStyle: "scoped_list",
    };
  }

  return {
    actName: normalized,
    headingStyle: "plain",
  };
}

function normalizeOfficeName(value: string): string {
  return normalizeText(value)
    .replace(/^the\s+/i, "")
    .replace(/,\s*$/g, "")
    .replace(/\s+and$/i, "")
    .trim();
}

function extractOfficeNames(value: string): string[] {
  const normalized = normalizeText(value);
  // TODO: extend this pattern if future sources introduce office titles such as
  // Deputy Premier or Minister without Portfolio in these administration notes.
  const officeStartPattern =
    /\b(?:the\s+)?(?:Attorney-General|Premier|Treasurer|Minister for\b)/gi;
  const starts = Array.from(normalized.matchAll(officeStartPattern))
    .map((match) => match.index)
    .filter((index): index is number => index !== undefined);

  if (starts.length === 0) {
    const fallback = normalizeOfficeName(normalized);
    return fallback ? [fallback] : [];
  }

  const offices = starts
    .map((start, index) => {
      const end = starts[index + 1] ?? normalized.length;
      return normalizeOfficeName(normalized.slice(start, end));
    })
    .filter(Boolean);

  return Array.from(new Set(offices));
}

function splitOfficeTail(rawTail: string): {
  officeText: string;
  unparsedTail?: string;
} {
  const normalized = normalizeText(rawTail);
  const lower = normalized.toLowerCase();
  const markers = [
    ", except to the extent",
    ", in so far as",
    ", this ",
    ", these ",
  ];

  const index = markers
    .map((marker) => lower.indexOf(marker))
    .filter((candidate) => candidate >= 0)
    .sort((left, right) => left - right)[0];

  if (index === undefined) {
    return { officeText: normalized };
  }

  return {
    officeText: normalized.slice(0, index).trim(),
    unparsedTail: normalized.slice(index + 2).trim(),
  };
}

function parseAdministrationDetails(
  adminText: string,
  currentOfficeName: string,
): AdministrationDetails {
  const normalized = normalizeText(adminText);
  const administrationMatch = normalized.match(
    /\b(jointly and severally administered|jointly administered|administered)\s+(with|by)\s+(.+)$/i,
  );

  if (!administrationMatch) {
    return {
      administeringOfficeNames: [currentOfficeName],
      administrationMode: "sole",
      parseStatus: "parsed",
    };
  }

  const descriptor = administrationMatch[1]?.toLowerCase() ?? "administered";
  const connector = administrationMatch[2]?.toLowerCase() ?? "by";
  const rawTail = administrationMatch[3] ?? "";
  const { officeText, unparsedTail } = splitOfficeTail(rawTail);
  const parsedOfficeNames = extractOfficeNames(officeText);
  const administeringOfficeNames =
    connector === "with"
      ? Array.from(new Set([currentOfficeName, ...parsedOfficeNames]))
      : parsedOfficeNames;

  let administrationMode: AdministrationMode = "unknown";
  if (descriptor === "jointly and severally administered") {
    administrationMode = "joint_and_several";
  } else if (descriptor === "jointly administered") {
    administrationMode = "joint";
  } else if (descriptor === "administered" && administeringOfficeNames.length <= 1) {
    administrationMode = "sole";
  }

  return {
    administeringOfficeNames,
    administrationMode,
    parseStatus:
      administeringOfficeNames.length === 0 || unparsedTail ? "partial" : "parsed",
    ...(unparsedTail ? { unparsedTail } : {}),
  };
}

function createDefaultWholeActRule(officeName: string): GeneralOrderRule {
  return {
    ruleKind: "default",
    scope: "whole_act",
    rawText: `The Act is administered by ${officeName}`,
    administeringOfficeNames: [officeName],
    administrationMode: "sole",
    provisionReferences: [],
    nestedRawTexts: [],
    parseStatus: "parsed",
  };
}

function buildRuleFromText(input: {
  rawText: string;
  currentOfficeName: string;
  ruleKind: GeneralOrderRule["ruleKind"];
}): GeneralOrderRule {
  const normalized = normalizeText(stripOuterParentheses(input.rawText));

  if (/^The Act is /i.test(normalized)) {
    const administration = parseAdministrationDetails(
      normalized,
      input.currentOfficeName,
    );

    return {
      ruleKind: input.ruleKind,
      scope: input.ruleKind === "residual" ? "residual" : "whole_act",
      rawText: normalized,
      administeringOfficeNames: administration.administeringOfficeNames,
      administrationMode: administration.administrationMode,
      provisionReferences: [],
      nestedRawTexts: [],
      parseStatus: administration.parseStatus,
      ...(administration.unparsedTail
        ? { unparsedTail: administration.unparsedTail }
        : {}),
    };
  }

  const parentheticalChunks = getTopLevelParentheticalChunks(normalized);
  const administrationChunk = [...parentheticalChunks]
    .reverse()
    .find((chunk) => /administered/i.test(chunk.content));
  const scopeText = administrationChunk
    ? normalizeText(normalized.slice(0, administrationChunk.start))
    : normalized;
  const administration = administrationChunk
    ? parseAdministrationDetails(
        administrationChunk.content,
        input.currentOfficeName,
      )
    : {
        administeringOfficeNames: [input.currentOfficeName],
        administrationMode: "sole" as const,
        parseStatus: "parsed" as const,
      };
  const trailingText = administrationChunk
    ? normalizeText(normalized.slice(administrationChunk.end + 1))
    : "";
  const nestedStatus: ParseStatus =
    administration.parseStatus === "partial" || trailingText ? "partial" : "parsed";

  return {
    ruleKind: input.ruleKind,
    scope: "provision_list",
    rawText: normalized,
    scopeText,
    administeringOfficeNames: administration.administeringOfficeNames,
    administrationMode: administration.administrationMode,
    provisionReferences: extractProvisionReferencesFromText(scopeText),
    nestedRawTexts: [],
    parseStatus: nestedStatus,
    ...((administration.unparsedTail || trailingText) && {
      unparsedTail: normalizeText(
        [administration.unparsedTail, trailingText].filter(Boolean).join(" "),
      ),
    }),
  };
}

function extractListItemContent($: CheerioAPI, element: CheerioElement): {
  rawText: string;
  nestedRawTexts: string[];
} {
  const listItem = $(element).clone();
  const nestedRawTexts = listItem
    .children("ul")
    .children("li")
    .map((_, nestedElement) => normalizeText($(nestedElement).text()))
    .get()
    .filter(Boolean);

  listItem.children("ul").remove();

  return {
    rawText: normalizeText(listItem.text()),
    nestedRawTexts,
  };
}

function finalizeActEntry(
  currentAct: GeneralOrderActEntry | null,
): GeneralOrderActEntry | null {
  if (!currentAct) {
    return null;
  }

  if (currentAct.headingStyle === "plain" && currentAct.rules.length === 0) {
    currentAct.rules.push(createDefaultWholeActRule(currentAct.officeName));
  }

  if (currentAct.headingStyle === "except") {
    currentAct.rules.unshift(createDefaultWholeActRule(currentAct.officeName));
  }

  return currentAct;
}

function parseOfficeSection($: CheerioAPI, element: CheerioElement) {
  const item = $(element);
  const officeName = normalizeText(
    item.find(".rpl-accordion__item-heading").first().text(),
  );
  const content = item.find(".rpl-accordion__item-content-inner").first();
  const acts: GeneralOrderActEntry[] = [];
  let currentAct: GeneralOrderActEntry | null = null;

  for (const child of content.children().toArray()) {
    const node = $(child);
    const text = normalizeText(node.text());

    if (!text) {
      continue;
    }

    if (node.is("p")) {
      if (/^\(The Act is otherwise /i.test(text)) {
        if (!currentAct) {
          continue;
        }

        currentAct.rules.push(
          buildRuleFromText({
            rawText: text,
            currentOfficeName: officeName,
            ruleKind: "residual",
          }),
        );
        continue;
      }

      const completeAct = finalizeActEntry(currentAct);
      if (completeAct) {
        acts.push(completeAct);
      }

      const heading = parseHeadingText(text);
      currentAct = {
        officeName,
        actName: heading.actName,
        headingText: text,
        headingStyle: heading.headingStyle,
        rules: [],
      };
      continue;
    }

    if (node.is("ul") && currentAct) {
      for (const listItem of node.children("li").toArray()) {
        const { rawText, nestedRawTexts } = extractListItemContent($, listItem);
        if (!rawText) {
          continue;
        }

        const rule = buildRuleFromText({
          rawText,
          currentOfficeName: officeName,
          ruleKind: "listed_scope",
        });

        currentAct.rules.push({
          ...rule,
          nestedRawTexts,
          parseStatus:
            nestedRawTexts.length > 0 && rule.parseStatus === "parsed"
              ? "partial"
              : rule.parseStatus,
        });
      }
    }
  }

  const completeAct = finalizeActEntry(currentAct);
  if (completeAct) {
    acts.push(completeAct);
  }

  return {
    officeName,
    acts,
  };
}

export function parseVicGovGeneralOrder(html: string): GeneralOrderDataset {
  const $ = load(html);
  const effectiveDate = extractEffectiveDate(html);
  const offices = $(".rpl-accordion__item")
    .map((_, element) => parseOfficeSection($, element))
    .get()
    .filter((section) => section.acts.length > 0);

  return generalOrderDatasetSchema.parse({
    source: createSourceDocument({
      sourceType: "html",
      sourceFamily: "vic_gov",
      title: "General Order effective 30 October 2025",
      sourceUrl: VIC_GOV_GENERAL_ORDER_URL,
      publisher: "Victorian Government",
      effectiveDate,
      // Bump this when the parser's structured output changes materially so imports stay traceable.
      parserVersion: "sprint-1-general-order",
      rawStoragePath: "live/vic-gov-general-order-2025-10-30.html",
    }),
    ...(effectiveDate ? { effectiveDate } : {}),
    offices,
  });
}

export type FetchVicGovGeneralOrderOptions = {
  kanonAssistance?: boolean | AssistGeneralOrderWithKanonOptions;
};

export async function fetchVicGovGeneralOrder(
  options: FetchVicGovGeneralOrderOptions = {},
): Promise<GeneralOrderDataset> {
  const response = await fetch(VIC_GOV_GENERAL_ORDER_URL);
  if (!response.ok) {
    throw new Error(`Vic Gov general order request failed with ${response.status}`);
  }

  const dataset = parseVicGovGeneralOrder(await response.text());
  if (!options.kanonAssistance) {
    return dataset;
  }

  return assistPartialGeneralOrderRulesWithKanon(
    dataset,
    options.kanonAssistance === true ? {} : options.kanonAssistance,
  );
}

export function loadFixtureVicGovGeneralOrder(): GeneralOrderDataset {
  return parseVicGovGeneralOrder(generalOrderFixture);
}

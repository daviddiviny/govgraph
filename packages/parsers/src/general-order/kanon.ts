import { Isaacus } from "isaacus";

import {
  generalOrderDatasetSchema,
  type GeneralOrderDataset,
  type GeneralOrderKanonAssistance,
  type GeneralOrderRule,
  type ProvisionReference,
} from "@govgraph/domain";

import {
  extractProvisionReferencesFromText,
  normalizeGeneralOrderText,
} from "./shared";

const KANON_MODEL = "kanon-2-enricher" as const;
const DEFAULT_BATCH_SIZE = 8;
type EnrichmentCreateParams = Isaacus.EnrichmentCreateParams;
type EnrichmentResponse = Isaacus.EnrichmentResponse;

export type GeneralOrderKanonClient = {
  enrichments: {
    create(params: EnrichmentCreateParams): Promise<EnrichmentResponse>;
  };
};

export type AssistGeneralOrderWithKanonOptions = {
  client?: GeneralOrderKanonClient;
  apiKey?: string;
  batchSize?: number;
  overflowStrategy?: NonNullable<EnrichmentCreateParams["overflow_strategy"]>;
};

type PartialRuleTarget = {
  officeIndex: number;
  actIndex: number;
  ruleIndex: number;
  officeName: string;
  actName: string;
  rule: GeneralOrderRule;
};

type EnrichedDocument = EnrichmentResponse["results"][number]["document"];
type ExternalDocumentType =
  GeneralOrderKanonAssistance["externalDocumentTypes"][number];

function buildBatches<T>(items: readonly T[], batchSize: number): T[][] {
  const batches: T[][] = [];

  for (let index = 0; index < items.length; index += batchSize) {
    batches.push(items.slice(index, index + batchSize));
  }

  return batches;
}

function codePointSlice(text: string, start: number, end: number): string {
  return Array.from(text).slice(start, end).join("");
}

export function sanitizeKanonSpanText(value: string): string {
  let normalized = normalizeGeneralOrderText(value).replace(/[,:;.-]+$/g, "");

  const openParentheses = (normalized.match(/\(/g) ?? []).length;
  let closeParentheses = (normalized.match(/\)/g) ?? []).length;

  while (closeParentheses > openParentheses && normalized.endsWith(")")) {
    normalized = normalized.slice(0, -1).trimEnd();
    closeParentheses -= 1;
  }

  return normalized.trim();
}

function uniqueStrings(values: readonly string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)));
}

function uniqueExternalDocumentTypes(
  values: readonly ExternalDocumentType[],
): ExternalDocumentType[] {
  return Array.from(new Set(values));
}

function uniqueProvisionReferences(
  values: readonly ProvisionReference[],
): ProvisionReference[] {
  const referencesByKey = new Map<string, ProvisionReference>();

  for (const value of values) {
    referencesByKey.set(`${value.unit}:${value.rawText}`, value);
  }

  return [...referencesByKey.values()];
}

function getPartialRuleTargets(dataset: GeneralOrderDataset): PartialRuleTarget[] {
  return dataset.offices.flatMap((office, officeIndex) =>
    office.acts.flatMap((act, actIndex) =>
      act.rules.flatMap((rule, ruleIndex) =>
        rule.parseStatus === "parsed"
          ? []
          : [
              {
                officeIndex,
                actIndex,
                ruleIndex,
                officeName: office.officeName,
                actName: act.actName,
                rule,
              },
            ],
      ),
    ),
  );
}

function createIsaacusClient(
  options: AssistGeneralOrderWithKanonOptions,
): GeneralOrderKanonClient | null {
  if (options.client) {
    return options.client;
  }

  const apiKey = options.apiKey ?? process.env.ISAACUS_API_KEY;
  if (!apiKey) {
    return null;
  }

  return new Isaacus({ apiKey });
}

export function buildGeneralOrderKanonInput(target: {
  officeName: string;
  actName: string;
  rule: Pick<GeneralOrderRule, "rawText" | "nestedRawTexts">;
}): string {
  const nestedText =
    target.rule.nestedRawTexts.length === 0
      ? ""
      : ` Nested exceptions: ${target.rule.nestedRawTexts.join(" ")}`;

  return normalizeGeneralOrderText(
    `Under the ministerial office ${target.officeName}, the ${target.actName} includes this administration rule: ${target.rule.rawText}.${nestedText}`,
  );
}

function createFailedKanonAssistance(error: unknown): GeneralOrderKanonAssistance {
  const message = error instanceof Error ? error.message : "Unknown Kanon error";

  return {
    model: KANON_MODEL,
    status: "failed",
    externalDocumentNames: [],
    externalDocumentTypes: [],
    pinpointTexts: [],
    pinpointReferences: [],
    error: normalizeGeneralOrderText(message),
  };
}

function createKanonAssistanceFromDocument(
  inputText: string,
  document: EnrichedDocument,
): GeneralOrderKanonAssistance {
  const externalDocumentNames = uniqueStrings(
    document.external_documents.map((externalDocument) =>
      normalizeGeneralOrderText(
        codePointSlice(
          inputText,
          externalDocument.name.start,
          externalDocument.name.end,
        ),
      ),
    ),
  );
  const externalDocumentTypes = uniqueExternalDocumentTypes(
    document.external_documents.map((externalDocument) => externalDocument.type),
  );
  const pinpointTexts = uniqueStrings(
    document.external_documents.flatMap((externalDocument) =>
      externalDocument.pinpoints.map((pinpoint) =>
        sanitizeKanonSpanText(
          codePointSlice(inputText, pinpoint.start, pinpoint.end),
        ),
      ),
    ),
  );
  const pinpointReferences = uniqueProvisionReferences(
    pinpointTexts.flatMap((pinpointText) =>
      extractProvisionReferencesFromText(pinpointText),
    ),
  );

  return {
    model: KANON_MODEL,
    status:
      externalDocumentNames.length > 0 || pinpointTexts.length > 0
        ? "enriched"
        : "no_signal",
    externalDocumentNames,
    externalDocumentTypes,
    pinpointTexts,
    pinpointReferences,
  };
}

export async function assistPartialGeneralOrderRulesWithKanon(
  dataset: GeneralOrderDataset,
  options: AssistGeneralOrderWithKanonOptions = {},
): Promise<GeneralOrderDataset> {
  const partialRuleTargets = getPartialRuleTargets(dataset);
  if (partialRuleTargets.length === 0) {
    return dataset;
  }

  const client = createIsaacusClient(options);
  if (!client) {
    return dataset;
  }

  const batchSize = Math.max(1, Math.min(options.batchSize ?? DEFAULT_BATCH_SIZE, 8));
  const nextDataset = structuredClone(dataset);

  for (const batch of buildBatches(partialRuleTargets, batchSize)) {
    const texts = batch.map((target) => buildGeneralOrderKanonInput(target));

    try {
      const response = await client.enrichments.create({
        model: KANON_MODEL,
        texts,
        ...(options.overflowStrategy
          ? { overflow_strategy: options.overflowStrategy }
          : {}),
      });
      const resultsByIndex = new Map(
        response.results.map((result) => [result.index, result]),
      );

      for (const [batchIndex, target] of batch.entries()) {
        const rule =
          nextDataset.offices[target.officeIndex]?.acts[target.actIndex]?.rules[
            target.ruleIndex
          ];

        if (!rule) {
          continue;
        }

        const result = resultsByIndex.get(batchIndex);
        rule.kanonAssistance = result
          ? createKanonAssistanceFromDocument(texts[batchIndex] ?? "", result.document)
          : createFailedKanonAssistance(
              new Error("No enrichment result returned for rule"),
            );
      }
    } catch (error) {
      for (const target of batch) {
        const rule =
          nextDataset.offices[target.officeIndex]?.acts[target.actIndex]?.rules[
            target.ruleIndex
          ];

        if (!rule) {
          continue;
        }

        rule.kanonAssistance = createFailedKanonAssistance(error);
      }
    }
  }

  return generalOrderDatasetSchema.parse(nextDataset);
}

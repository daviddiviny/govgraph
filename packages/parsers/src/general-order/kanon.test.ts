import { Isaacus } from "isaacus";

import {
  assistPartialGeneralOrderRulesWithKanon,
  sanitizeKanonSpanText,
} from "./kanon";
import { loadFixtureVicGovGeneralOrder } from "./vicgov";

type EnrichmentCreateParams = Isaacus.EnrichmentCreateParams;
type EnrichmentResponse = Isaacus.EnrichmentResponse;

describe("assistPartialGeneralOrderRulesWithKanon", () => {
  it("cleans trailing punctuation from Kanon pinpoint spans", () => {
    expect(sanitizeKanonSpanText("section 51B(5)),")).toBe("section 51B(5)");
    expect(sanitizeKanonSpanText("Part 7;")).toBe("Part 7");
  });

  it("returns the original dataset when no client or API key is available", async () => {
    const snapshot = loadFixtureVicGovGeneralOrder();

    const result = await assistPartialGeneralOrderRulesWithKanon(snapshot);

    expect(result).toBe(snapshot);
  });

  it("adds Kanon assistance only to rules that still need review", async () => {
    const snapshot = loadFixtureVicGovGeneralOrder();
    const create = vi.fn(async ({ texts }: EnrichmentCreateParams) => {
      const inputTexts = Array.isArray(texts) ? texts : [texts];

      const response: EnrichmentResponse = {
        results: inputTexts.map((text, index) => {
          const actName = "Project Development and Construction Management Act 1994";
          const actStart = text.indexOf(actName);
          const pinpointText = "Part 5A";
          const pinpointStart = text.indexOf(pinpointText);

          return {
            index,
            document: {
              crossreferences: [],
              dates: [],
              emails: [],
              external_documents: [
                {
                  id: `exd:${index}`,
                  jurisdiction: "AU-VIC",
                  mentions: [],
                  name: {
                    start: actStart,
                    end: actStart + actName.length,
                  },
                  pinpoints: [
                    {
                      start: pinpointStart,
                      end: pinpointStart + pinpointText.length,
                    },
                  ],
                  reception: "neutral",
                  type: "statute",
                },
              ],
              headings: [],
              id_numbers: [],
              junk: [],
              jurisdiction: "AU-VIC",
              locations: [],
              persons: [],
              phone_numbers: [],
              quotes: [],
              segments: [],
              subtitle: null,
              terms: [],
              title: null,
              type: "other",
              version: "ilgs@1",
              websites: [],
            },
          };
        }),
        usage: {
          input_tokens: 1,
        },
      };

      return response;
    });
    const result = await assistPartialGeneralOrderRulesWithKanon(snapshot, {
      client: { enrichments: { create } },
    });

    const attorneyGeneral = result.offices.find(
      (section) => section.officeName === "Attorney-General",
    );
    const bailAct = attorneyGeneral?.acts.find(
      (entry) => entry.actName === "Bail Act 1977",
    );
    expect(bailAct?.rules.every((rule) => rule.kanonAssistance === undefined)).toBe(
      true,
    );

    const premier = result.offices.find((section) => section.officeName === "Premier");
    const projectAct = premier?.acts.find(
      (entry) =>
        entry.actName === "Project Development and Construction Management Act 1994",
    );
    expect(projectAct?.rules[1]?.kanonAssistance).toEqual({
      model: "kanon-2-enricher",
      status: "enriched",
      externalDocumentNames: [
        "Project Development and Construction Management Act 1994",
      ],
      externalDocumentTypes: ["statute"],
      pinpointTexts: ["Part 5A"],
      pinpointReferences: [
        {
          rawText: "Part 5A",
          unit: "part",
          label: "5A",
        },
      ],
    });
    expect(create).toHaveBeenCalledTimes(1);
  });

  it("records a failed Kanon attempt without changing the underlying rule parse", async () => {
    const snapshot = loadFixtureVicGovGeneralOrder();

    const result = await assistPartialGeneralOrderRulesWithKanon(snapshot, {
      client: {
        enrichments: {
          create: vi.fn(async () => {
            throw new Error("network unavailable");
          }),
        },
      },
    });

    const premier = result.offices.find((section) => section.officeName === "Premier");
    const projectAct = premier?.acts.find(
      (entry) =>
        entry.actName === "Project Development and Construction Management Act 1994",
    );

    expect(projectAct?.rules[1]?.parseStatus).toBe("partial");
    expect(projectAct?.rules[1]?.kanonAssistance).toEqual({
      model: "kanon-2-enricher",
      status: "failed",
      externalDocumentNames: [],
      externalDocumentTypes: [],
      pinpointTexts: [],
      pinpointReferences: [],
      error: "network unavailable",
    });
  });
});

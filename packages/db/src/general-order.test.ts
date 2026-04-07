import { generalOrderDatasetSchema } from "@govgraph/domain";

import { buildActAdministrationRuleRows } from "./general-order";

describe("buildActAdministrationRuleRows", () => {
  it("flattens General Order rules into database rows", () => {
    const dataset = generalOrderDatasetSchema.parse({
      source: {
        id: "11111111-1111-5111-8111-111111111111",
        sourceType: "html",
        sourceFamily: "vic_gov",
        title: "General Order effective 30 October 2025",
        sourceUrl: "https://www.vic.gov.au/general-order-effective-30-october-2025",
        publisher: "Victorian Government",
        effectiveDate: "2025-10-30",
        retrievedAt: "2026-04-07T00:00:00.000Z",
        parserVersion: "test",
        rawStoragePath: "fixtures/general-order.html",
      },
      effectiveDate: "2025-10-30",
      offices: [
        {
          officeName: "Attorney-General",
          acts: [
            {
              officeName: "Attorney-General",
              actName: "Bail Act 1977",
              headingText: "Bail Act 1977 - Except:",
              headingStyle: "except",
              rules: [
                {
                  ruleKind: "default",
                  scope: "whole_act",
                  rawText: "The Act is administered by Attorney-General",
                  administeringOfficeNames: ["Attorney-General"],
                  administrationMode: "sole",
                  provisionReferences: [],
                  nestedRawTexts: [],
                  parseStatus: "parsed",
                },
                {
                  ruleKind: "listed_scope",
                  scope: "provision_list",
                  rawText:
                    "Section 3B and Part 2A (these provisions are jointly and severally administered with the Minister for Youth Justice)",
                  scopeText: "Section 3B and Part 2A",
                  administeringOfficeNames: [
                    "Attorney-General",
                    "Minister for Youth Justice",
                  ],
                  administrationMode: "joint_and_several",
                  provisionReferences: [
                    {
                      rawText: "Section 3B",
                      unit: "section",
                      label: "3B",
                    },
                    {
                      rawText: "Part 2A",
                      unit: "part",
                      label: "2A",
                    },
                  ],
                  nestedRawTexts: [],
                  parseStatus: "partial",
                  unparsedTail: "except to the extent that ...",
                  kanonAssistance: {
                    model: "kanon-2-enricher",
                    status: "enriched",
                    externalDocumentNames: ["Bail Act 1977"],
                    externalDocumentTypes: ["statute"],
                    pinpointTexts: ["Section 3B", "Part 2A"],
                    pinpointReferences: [
                      {
                        rawText: "Section 3B",
                        unit: "section",
                        label: "3B",
                      },
                    ],
                  },
                },
              ],
            },
          ],
        },
      ],
    });

    const rows = buildActAdministrationRuleRows(dataset);

    expect(rows).toHaveLength(2);
    expect(rows[0]?.officeName).toBe("Attorney-General");
    expect(rows[0]?.actName).toBe("Bail Act 1977");
    expect(rows[0]?.effectiveDate).toBe("2025-10-30");
    expect(rows[1]?.parseStatus).toBe("partial");
    expect(rows[1]?.administeringOfficeNames).toEqual([
      "Attorney-General",
      "Minister for Youth Justice",
    ]);
    expect(rows[1]?.kanonAssistance?.pinpointTexts).toEqual([
      "Section 3B",
      "Part 2A",
    ]);
    expect(rows[1]?.createdAt).toEqual(new Date("2026-04-07T00:00:00.000Z"));
  });
});

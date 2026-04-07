import { describe, expect, it } from "vitest";

import {
  buildGeneralOrderActEntries,
  buildGeneralOrderOfficeSummary,
} from "./general-order-browse";

describe("buildGeneralOrderActEntries", () => {
  it("groups rules under each act entry and sorts default rules first", () => {
    const entries = buildGeneralOrderActEntries([
      {
        officeName: "Attorney-General",
        actName: "Bail Act 1977",
        headingText: "Bail Act 1977 - Except:",
        headingStyle: "except",
        ruleKind: "listed_scope",
        scope: "provision_list",
        rawText:
          "Section 3B and Part 2A (these provisions are jointly and severally administered with the Minister for Youth Justice)",
        scopeText: "Section 3B and Part 2A",
        administrationMode: "joint_and_several",
        administeringOfficeNames: [
          "Attorney-General",
          "Minister for Youth Justice",
        ],
        provisionReferences: [
          {
            rawText: "Section 3B",
            unit: "section",
            label: "3B",
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
          pinpointTexts: ["Section 3B"],
          pinpointReferences: [
            {
              rawText: "Section 3B",
              unit: "section",
              label: "3B",
            },
          ],
        },
      },
      {
        officeName: "Attorney-General",
        actName: "Bail Act 1977",
        headingText: "Bail Act 1977 - Except:",
        headingStyle: "except",
        ruleKind: "default",
        scope: "whole_act",
        rawText: "The Act is administered by Attorney-General",
        scopeText: null,
        administrationMode: "sole",
        administeringOfficeNames: ["Attorney-General"],
        provisionReferences: [],
        nestedRawTexts: [],
        parseStatus: "parsed",
        unparsedTail: null,
        kanonAssistance: null,
      },
    ]);

    expect(entries).toHaveLength(1);
    expect(entries[0]?.actName).toBe("Bail Act 1977");
    expect(entries[0]?.rules).toHaveLength(2);
    expect(entries[0]?.rules[0]?.ruleKind).toBe("default");
    expect(entries[0]?.rules[1]?.kanonAssistance?.status).toBe("enriched");
  });
});

describe("buildGeneralOrderOfficeSummary", () => {
  it("normalizes the office summary fields for browse links", () => {
    const summary = buildGeneralOrderOfficeSummary({
      officeName: "Minister for Youth Justice",
      actEntryCount: 27,
      ruleCount: 41,
      partialRuleCount: 3,
      sharedRuleCount: 9,
    });

    expect(summary).toEqual({
      officeName: "Minister for Youth Justice",
      officeSlug: "minister-for-youth-justice",
      actEntryCount: 27,
      ruleCount: 41,
      partialRuleCount: 3,
      sharedRuleCount: 9,
    });
  });
});

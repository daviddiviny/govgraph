import { describe, expect, it } from "vitest";

import type { GeneralOrderOfficeSummary } from "./general-order-browse";
import {
  buildGeneralOrderSearchResults,
  type GeneralOrderSearchRuleRow,
} from "./general-order-search";

const officeSummaries: GeneralOrderOfficeSummary[] = [
  {
    officeName: "Attorney-General",
    officeSlug: "attorney-general",
    actEntryCount: 1,
    ruleCount: 2,
    partialRuleCount: 1,
    sharedRuleCount: 1,
  },
  {
    officeName: "Minister for Youth Justice",
    officeSlug: "minister-for-youth-justice",
    actEntryCount: 1,
    ruleCount: 1,
    partialRuleCount: 0,
    sharedRuleCount: 1,
  },
];

const rows: GeneralOrderSearchRuleRow[] = [
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
  {
    officeName: "Minister for Youth Justice",
    actName: "Bail Act 1977",
    headingText: "Bail Act 1977 - Except:",
    headingStyle: "except",
    ruleKind: "listed_scope",
    scope: "provision_list",
    rawText:
      "Section 3B and Part 2A (these provisions are jointly and severally administered with the Attorney-General)",
    scopeText: "Section 3B and Part 2A",
    administrationMode: "joint_and_several",
    administeringOfficeNames: [
      "Minister for Youth Justice",
      "Attorney-General",
    ],
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
    parseStatus: "parsed",
    unparsedTail: null,
    kanonAssistance: null,
  },
];

describe("buildGeneralOrderSearchResults", () => {
  it("returns office matches first for an office-name query", () => {
    const results = buildGeneralOrderSearchResults(
      officeSummaries,
      rows,
      "Attorney-General",
      5,
    );

    expect(results[0]).toMatchObject({
      kind: "office",
      officeName: "Attorney-General",
      matchReason: "office name match",
    });
  });

  it("returns the matching Act for an Act-name query", () => {
    const results = buildGeneralOrderSearchResults(
      officeSummaries,
      rows,
      "Bail Act 1977",
      5,
    );

    expect(results[0]).toMatchObject({
      kind: "act",
      actName: "Bail Act 1977",
      officeName: "Attorney-General",
      matchReason: "Act name match",
    });
  });

  it("matches provision references for scoped carve-outs", () => {
    const results = buildGeneralOrderSearchResults(
      officeSummaries,
      rows,
      "Section 3B",
      5,
    );

    const actResult = results.find((result) => result.kind === "act");

    expect(actResult).toMatchObject({
      kind: "act",
      actName: "Bail Act 1977",
      matchReason: "provision reference match",
      previewText: "Section 3B",
    });
  });
});

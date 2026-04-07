import { load } from "cheerio";

import type { MinistryDataset } from "@govgraph/domain";

import { parliamentMinistryFixture } from "../fixtures/parliament-ministry.fixture";
import { createSourceDocument } from "../shared/source-document";

export const PARLIAMENT_MINISTRY_URL =
  "https://www.parliament.vic.gov.au/portfolios/";

const LIVE_FETCH_TIMEOUT_MS = 10_000;

function absolutize(path: string): string {
  return new URL(path, PARLIAMENT_MINISTRY_URL).toString();
}

export function parseParliamentGovernmentMinistry(html: string): MinistryDataset {
  const $ = load(html);
  const cards = $("tab#panel-ministry-block a.block");

  const members = cards
    .map((_, element) => {
      const personName = $(element)
        .find("h3")
        .first()
        .text()
        .replace(/\s+/g, " ")
        .trim();
      const officeTitles = $(element)
        .find("table p")
        .map((__, title) => $(title).text().replace(/\s+/g, " ").trim())
        .get()
        .filter(Boolean);

      const href = $(element).attr("href");

      if (!personName) {
        return null;
      }

      return {
        personName,
        officeTitles,
        ...(href ? { detailUrl: absolutize(href) } : {}),
      };
    })
    .get()
    .filter((entry): entry is NonNullable<typeof entry> => entry !== null);

  return {
    source: createSourceDocument({
      sourceType: "html",
      sourceFamily: "parliament",
      title: "Parliament of Victoria government ministry",
      sourceUrl: PARLIAMENT_MINISTRY_URL,
      publisher: "Parliament of Victoria",
      parserVersion: "sprint-1",
      rawStoragePath: "live/parliament-portfolios.html",
    }),
    members,
  };
}

export async function fetchParliamentGovernmentMinistry(): Promise<MinistryDataset> {
  const response = await fetch(PARLIAMENT_MINISTRY_URL, {
    signal: AbortSignal.timeout(LIVE_FETCH_TIMEOUT_MS),
  });
  if (!response.ok) {
    throw new Error(`Parliament ministry request failed with ${response.status}`);
  }

  return parseParliamentGovernmentMinistry(await response.text());
}

export function loadFixtureParliamentGovernmentMinistry(): MinistryDataset {
  return parseParliamentGovernmentMinistry(parliamentMinistryFixture);
}

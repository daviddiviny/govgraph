import { load } from "cheerio";

import type { VpscPortfolioDataset } from "@govgraph/domain";

import { vpscPortfoliosFixture } from "../fixtures/vpsc-portfolios.fixture";
import { parseHumanDate } from "../shared/date";
import { createSourceDocument } from "../shared/source-document";

export const VPSC_PORTFOLIOS_URL =
  "https://www.vpsc.vic.gov.au/working-public-sector/conduct-integrity-and-values/working-ministers/working-ministerial-officer/portfolios";

function deriveDepartmentName(groupName: string, description: string): string {
  const match = description.match(
    /The (Department of [^.]+?)\s(?:supports|provides|leads|is|focuses)/i,
  );
  return match?.[1]?.trim() ?? `Department of ${groupName}`;
}

export function parseVpscPortfolios(html: string): VpscPortfolioDataset {
  const $ = load(html);
  const content = $("rpl-content").first();

  const introText = content.find("p").first().text().replace(/\s+/g, " ").trim();
  const effectiveDate = parseHumanDate(
    introText.match(/accurate as of ([^.]+)\./i)?.[1] ?? "",
  );

  const sections: VpscPortfolioDataset["sections"] = [];

  content.find("h2").each((_, element) => {
    const portfolioGroupName = $(element).text().trim();
    let cursor = $(element).next();
    let portfolioTitles: string[] = [];
    let departmentDescription = "";

    while (cursor.length > 0 && cursor[0]?.tagName !== "h2") {
      if (cursor.is("h3") && /Ministers/i.test(cursor.text())) {
        const list = cursor.next("ul");
        portfolioTitles = list
          .find("li")
          .map((__, item) => $(item).text().trim())
          .get()
          .filter(Boolean);
        cursor = list;
      } else if (cursor.is("h3") && /Department/i.test(cursor.text())) {
        const paragraph = cursor.next("p");
        departmentDescription = paragraph.text().replace(/\s+/g, " ").trim();
        cursor = paragraph;
      }

      cursor = cursor.next();
    }

    sections.push({
      portfolioGroupName,
      departmentName: deriveDepartmentName(
        portfolioGroupName,
        departmentDescription,
      ),
      departmentDescription,
      portfolioTitles,
    });
  });

  return {
    source: createSourceDocument({
      sourceType: "html",
      sourceFamily: "vpsc",
      title: "VPSC portfolios",
      sourceUrl: VPSC_PORTFOLIOS_URL,
      publisher: "Victorian Public Sector Commission",
      effectiveDate,
      parserVersion: "sprint-1",
      rawStoragePath: "live/vpsc-portfolios.html",
    }),
    ...(effectiveDate ? { asOfDate: effectiveDate } : {}),
    sections,
  };
}

export async function fetchVpscPortfolios(): Promise<VpscPortfolioDataset> {
  const response = await fetch(VPSC_PORTFOLIOS_URL);
  if (!response.ok) {
    throw new Error(`VPSC portfolios request failed with ${response.status}`);
  }

  return parseVpscPortfolios(await response.text());
}

export function loadFixtureVpscPortfolios(): VpscPortfolioDataset {
  return parseVpscPortfolios(vpscPortfoliosFixture);
}

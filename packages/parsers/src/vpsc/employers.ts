import { load } from "cheerio";

import type { VpscEmployerInput, VpscEmployersDataset } from "@govgraph/domain";

import { vpscEmployersFixture } from "../fixtures/vpsc-employers.fixture";
import { parseHumanDate } from "../shared/date";
import { createSourceDocument } from "../shared/source-document";

export const VPSC_EMPLOYERS_URL =
  "https://www.vpsc.vic.gov.au/about-public-sector/list-public-sector-employers";

type VpscEmployersPage = {
  asOfDate?: string;
  totalPages: number;
  employers: VpscEmployerInput[];
};

function normalizeText(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function buildEmployersPageUrl(pageIndex: number): string {
  if (pageIndex === 0) {
    return VPSC_EMPLOYERS_URL;
  }

  const url = new URL(VPSC_EMPLOYERS_URL);
  url.searchParams.set("page", String(pageIndex));
  return url.toString();
}

function parsePageCount(html: string): number {
  const pageMatches = Array.from(html.matchAll(/\?page=(\d+)/g));
  const pageNumbers = pageMatches
    .map((match) => Number(match[1]))
    .filter((value) => Number.isInteger(value) && value >= 0);

  if (pageNumbers.length === 0) {
    return 1;
  }

  return Math.max(...pageNumbers) + 1;
}

export function parseVpscEmployersPage(html: string): VpscEmployersPage {
  const $ = load(html);
  const bodyText = normalizeText($("body").text());
  const asOfDate = parseHumanDate(
    bodyText.match(/Updated as at (\d{1,2} [A-Za-z]+ \d{4})/i)?.[1] ?? "",
  );

  const employers = $("table tbody tr")
    .map((_, row) => {
      const cells = $(row)
        .find("td")
        .map((__, cell) => normalizeText($(cell).text()))
        .get();

      if (cells.length < 8 || !cells[0]) {
        return null;
      }

      return {
        employerName: cells[0],
        employerType: cells[1] ?? "",
        publicSectorBodyType: cells[2] ?? "",
        industry: cells[3] ?? "",
        subSector: cells[4] ?? "",
        portfolioDepartment: cells[5] ?? "",
        virtDetermination: cells[6] ?? "",
        executivePolicy: cells[7] ?? "",
      };
    })
    .get()
    .filter((employer): employer is VpscEmployerInput => employer !== null);

  return {
    ...(asOfDate ? { asOfDate } : {}),
    totalPages: parsePageCount(html),
    employers,
  };
}

async function fetchVpscEmployersPage(pageIndex: number): Promise<VpscEmployersPage> {
  const response = await fetch(buildEmployersPageUrl(pageIndex));
  if (!response.ok) {
    throw new Error(
      `VPSC employers request failed with ${response.status} on page ${pageIndex + 1}`,
    );
  }

  return parseVpscEmployersPage(await response.text());
}

export async function fetchVpscEmployers(): Promise<VpscEmployersDataset> {
  const firstPage = await fetchVpscEmployersPage(0);
  const remainingPages = await Promise.all(
    Array.from({ length: firstPage.totalPages - 1 }, (_, index) =>
      fetchVpscEmployersPage(index + 1),
    ),
  );

  const employerMap = new Map<string, VpscEmployerInput>();

  for (const employer of [firstPage, ...remainingPages].flatMap(
    (page) => page.employers,
  )) {
    employerMap.set(employer.employerName.toLowerCase(), employer);
  }

  const employers = Array.from(employerMap.values()).sort((left, right) =>
    left.employerName.localeCompare(right.employerName),
  );
  const asOfDate =
    firstPage.asOfDate ?? remainingPages.find((page) => page.asOfDate)?.asOfDate;

  return {
    source: createSourceDocument({
      sourceType: "html",
      sourceFamily: "vpsc",
      title: "VPSC public sector employers",
      sourceUrl: VPSC_EMPLOYERS_URL,
      publisher: "Victorian Public Sector Commission",
      ...(asOfDate ? { effectiveDate: asOfDate } : {}),
      parserVersion: "sprint-2",
      rawStoragePath: "live/vpsc-employers.html",
    }),
    ...(asOfDate ? { asOfDate } : {}),
    employers,
  };
}

export function loadFixtureVpscEmployers(): VpscEmployersDataset {
  const fixturePage = parseVpscEmployersPage(vpscEmployersFixture);

  return {
    source: createSourceDocument({
      sourceType: "html",
      sourceFamily: "vpsc",
      title: "VPSC public sector employers",
      sourceUrl: VPSC_EMPLOYERS_URL,
      publisher: "Victorian Public Sector Commission",
      ...(fixturePage.asOfDate ? { effectiveDate: fixturePage.asOfDate } : {}),
      parserVersion: "sprint-2",
      rawStoragePath: "fixtures/vpsc-employers.html",
    }),
    ...(fixturePage.asOfDate ? { asOfDate: fixturePage.asOfDate } : {}),
    employers: fixturePage.employers,
  };
}

import { load } from "cheerio";

import { slugify, type BudgetIndexDataset, type SourceDocument } from "@govgraph/domain";

import { budgetIndexFixture } from "../fixtures/budget-index.fixture";
import { parseHumanDate } from "../shared/date";
import { createSourceDocument } from "../shared/source-document";

export const BUDGET_PAPERS_URL = "https://www.budget.vic.gov.au/budget-papers";

const INCLUDED_SECTIONS = new Set([
  "Budget Paper 1: Treasurer's Speech",
  "Budget Paper 2: Strategy and Outlook",
  "Budget Paper 3: Service Delivery",
  "Budget Paper 4: State Capital Program",
  "Budget Paper 5: Statement of Finances",
  "Department Performance Statement",
  "Budget Overview",
]);

function normalizeText(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function absolutize(path: string): string {
  return new URL(path, BUDGET_PAPERS_URL).toString();
}

function parseBudgetYear(value: string): string | undefined {
  return value.match(/\b(20\d{2}\/\d{2})\b/)?.[1];
}

function detectSourceType(url: string): SourceDocument["sourceType"] | undefined {
  const pathname = new URL(url).pathname.toLowerCase();

  if (pathname.endsWith(".pdf")) {
    return "pdf";
  }

  if (pathname.endsWith(".xlsx")) {
    return "xlsx";
  }

  if (pathname.endsWith(".csv")) {
    return "csv";
  }

  if (!/\.[a-z0-9]+$/i.test(pathname) || pathname.endsWith(".html")) {
    return "html";
  }

  return undefined;
}

function createBudgetArtifact(
  title: string,
  sourceUrl: string,
  publicationDate?: string,
): SourceDocument | null {
  const sourceType = detectSourceType(sourceUrl);

  if (sourceType !== "pdf" && sourceType !== "html") {
    return null;
  }

  return createSourceDocument({
    sourceType,
    sourceFamily: "budget",
    title,
    sourceUrl,
    publisher: "Victorian Government",
    ...(publicationDate ? { publicationDate } : {}),
    parserVersion: "sprint-2",
    rawStoragePath: `live/budget/${slugify(title)}.${sourceType === "html" ? "html" : sourceType}`,
  });
}

export function parseBudgetIndex(html: string): BudgetIndexDataset {
  const $ = load(html);
  const bodyText = normalizeText($("body").text());
  const publicationDate = parseHumanDate(
    bodyText.match(/Updated (\d{1,2} [A-Za-z]+ \d{4})/i)?.[1] ?? "",
  );
  const budgetYear = parseBudgetYear(bodyText);
  const entries: BudgetIndexDataset["entries"] = [];

  $("h2").each((_, element) => {
    const title = normalizeText($(element).text());
    if (!INCLUDED_SECTIONS.has(title)) {
      return;
    }

    const summaryParts: string[] = [];
    const sourceDocumentStore = new Map<string, SourceDocument>();
    let cursor = $(element).next();

    while (cursor.length > 0 && cursor[0]?.tagName !== "h2") {
      if (cursor.is("p")) {
        if (cursor.find("a[href]").length === 0) {
          const text = normalizeText(cursor.text());
          if (text) {
            summaryParts.push(text);
          }
        }

        cursor.find("a[href]").each((__, link) => {
          const href = $(link).attr("href");
          if (!href) {
            return;
          }

          const sourceDocument = createBudgetArtifact(
            title,
            absolutize(href),
            publicationDate,
          );

          if (sourceDocument) {
            sourceDocumentStore.set(sourceDocument.id, sourceDocument);
          }
        });
      }

      cursor = cursor.next();
    }

    entries.push({
      title,
      ...(summaryParts.length > 0 ? { summary: summaryParts.join(" ") } : {}),
      landingUrl: `${BUDGET_PAPERS_URL}#${$(element).attr("id") ?? slugify(title)}`,
      sourceDocuments: Array.from(sourceDocumentStore.values()),
    });
  });

  const projectsLink = $("a[href*='/projects-your-area']").first();
  const projectsHref = projectsLink.attr("href");

  if (projectsHref) {
    const sourceUrl = absolutize(projectsHref);
    const sourceDocument = createBudgetArtifact(
      "Projects in your area",
      sourceUrl,
      publicationDate,
    );

    if (sourceDocument) {
      entries.push({
        title: "Projects in your area",
        landingUrl: sourceUrl,
        sourceDocuments: [sourceDocument],
      });
    }
  }

  return {
    source: createSourceDocument({
      sourceType: "html",
      sourceFamily: "budget",
      title: budgetYear
        ? `Victorian Budget ${budgetYear} papers`
        : "Victorian Budget papers",
      sourceUrl: BUDGET_PAPERS_URL,
      publisher: "Victorian Government",
      ...(publicationDate ? { publicationDate } : {}),
      parserVersion: "sprint-2",
      rawStoragePath: "live/budget-papers.html",
    }),
    ...(budgetYear ? { budgetYear } : {}),
    entries,
  };
}

export async function fetchBudgetIndex(): Promise<BudgetIndexDataset> {
  const response = await fetch(BUDGET_PAPERS_URL);
  if (!response.ok) {
    throw new Error(`Budget index request failed with ${response.status}`);
  }

  return parseBudgetIndex(await response.text());
}

export function loadFixtureBudgetIndex(): BudgetIndexDataset {
  return parseBudgetIndex(budgetIndexFixture);
}

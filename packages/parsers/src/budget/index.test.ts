import { loadFixtureBudgetIndex } from "./index";

describe("parseBudgetIndex", () => {
  it("extracts the budget year, core documents, and projects index", () => {
    const snapshot = loadFixtureBudgetIndex();

    expect(snapshot.budgetYear).toBe("2025/26");
    expect(snapshot.entries).toHaveLength(8);
    expect(snapshot.entries[2]?.title).toBe("Budget Paper 3: Service Delivery");
    expect(snapshot.entries[2]?.sourceDocuments[0]?.sourceType).toBe("pdf");
    expect(snapshot.entries.at(-1)?.title).toBe("Projects in your area");
    expect(snapshot.entries.at(-1)?.sourceDocuments[0]?.sourceUrl).toBe(
      "https://www.budget.vic.gov.au/projects-your-area",
    );
  });
});

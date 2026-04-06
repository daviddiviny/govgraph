import { loadFixtureVpscPortfolios } from "./portfolios";

describe("parseVpscPortfolios", () => {
  it("extracts the effective date and department-backed portfolio titles", () => {
    const snapshot = loadFixtureVpscPortfolios();

    expect(snapshot.asOfDate).toBe("2025-06-05");
    expect(snapshot.sections[0]?.portfolioTitles).toContain("Premier");
    expect(snapshot.sections[1]?.departmentName).toBe("Department of Education");
  });
});

import { vpscEmployersFixture } from "../fixtures/vpsc-employers.fixture";

import { loadFixtureVpscEmployers, parseVpscEmployersPage } from "./employers";

describe("parseVpscEmployersPage", () => {
  it("extracts the snapshot date, page count, and employer rows", () => {
    const page = parseVpscEmployersPage(vpscEmployersFixture);

    expect(page.asOfDate).toBe("2026-02-05");
    expect(page.totalPages).toBe(1);
    expect(page.employers).toHaveLength(2);
    expect(page.employers[0]?.portfolioDepartment).toBe(
      "Department of Treasury and Finance",
    );
  });

  it("builds a fixture dataset for catalog loading", () => {
    const dataset = loadFixtureVpscEmployers();

    expect(dataset.source.title).toBe("VPSC public sector employers");
    expect(dataset.employers[1]?.employerName).toBe("Ambulance Victoria");
  });
});

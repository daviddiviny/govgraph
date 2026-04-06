import { afterEach, describe, expect, it, vi } from "vitest";

import { vpscPortfoliosFixture } from "../fixtures/vpsc-portfolios.fixture";
import {
  fetchVpscPortfolios,
  loadFixtureVpscPortfolios,
  parseVpscPortfolios,
  VPSC_PORTFOLIOS_URL,
} from "./portfolios";

describe("parseVpscPortfolios", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("extracts the effective date and department-backed portfolio titles", () => {
    const snapshot = loadFixtureVpscPortfolios();

    expect(snapshot.asOfDate).toBe("2025-06-05");
    expect(snapshot.sections[0]?.portfolioTitles).toContain("Premier");
    expect(snapshot.sections[1]?.departmentName).toBe("Department of Education");
  });

  it("warns before falling back to a derived department name", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const html = vpscPortfoliosFixture.replace(
      "The Department of Education leads the delivery of quality education for all Victorians from early childhood to higher education.",
      "Education supports lifelong learning for Victorians.",
    );

    const snapshot = parseVpscPortfolios(html);

    expect(snapshot.sections[1]?.departmentName).toBe("Department of Education");
    expect(warnSpy).toHaveBeenCalledWith(
      "VPSC department name fallback used.",
      expect.objectContaining({
        groupName: "Education",
        description: "Education supports lifelong learning for Victorians.",
      }),
    );
  });

  it("uses a 10 second timeout for live VPSC fetches", async () => {
    const signal = new AbortController().signal;
    const timeoutSpy = vi.spyOn(AbortSignal, "timeout").mockReturnValue(signal);
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(vpscPortfoliosFixture, { status: 200 }));

    await fetchVpscPortfolios();

    expect(timeoutSpy).toHaveBeenCalledWith(10_000);
    expect(fetchSpy).toHaveBeenCalledWith(VPSC_PORTFOLIOS_URL, { signal });
  });
});

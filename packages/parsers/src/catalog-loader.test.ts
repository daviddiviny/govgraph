import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./budget/index", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./budget/index")>();

  return {
    ...actual,
    fetchBudgetIndex: vi.fn(async () => actual.loadFixtureBudgetIndex()),
  };
});

vi.mock("./budget/performance-measures", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("./budget/performance-measures")>();

  return {
    ...actual,
    fetchBudgetPerformanceMeasures: vi.fn(
      async () => actual.loadFixtureBudgetPerformanceMeasures(),
    ),
  };
});

vi.mock("./ministry/parliament", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./ministry/parliament")>();

  return {
    ...actual,
    fetchParliamentGovernmentMinistry: vi.fn(
      async () => actual.loadFixtureParliamentGovernmentMinistry(),
    ),
  };
});

vi.mock("./vpsc/employers", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./vpsc/employers")>();

  return {
    ...actual,
    fetchVpscEmployers: vi.fn(async () => actual.loadFixtureVpscEmployers()),
  };
});

vi.mock("./vpsc/portfolios", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./vpsc/portfolios")>();

  return {
    ...actual,
    fetchVpscPortfolios: vi.fn(async () => actual.loadFixtureVpscPortfolios()),
  };
});

import { fetchBudgetIndex } from "./budget/index";
import { fetchBudgetPerformanceMeasures } from "./budget/performance-measures";
import { loadGovernmentCatalog, resetCatalogCache } from "./catalog-loader";
import { fetchParliamentGovernmentMinistry } from "./ministry/parliament";
import { fetchVpscEmployers } from "./vpsc/employers";
import { fetchVpscPortfolios } from "./vpsc/portfolios";

const originalNodeEnv = process.env.NODE_ENV;
const originalCatalogCacheTtl = process.env.GOVGRAPH_CATALOG_CACHE_TTL_MS;

describe("loadGovernmentCatalog", () => {
  beforeEach(() => {
    resetCatalogCache();
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-07T12:00:00.000Z"));
    process.env.NODE_ENV = "development";
    delete process.env.GOVGRAPH_CATALOG_CACHE_TTL_MS;
  });

  afterEach(() => {
    resetCatalogCache();
    vi.useRealTimers();
    process.env.NODE_ENV = originalNodeEnv;

    if (originalCatalogCacheTtl === undefined) {
      delete process.env.GOVGRAPH_CATALOG_CACHE_TTL_MS;
    } else {
      process.env.GOVGRAPH_CATALOG_CACHE_TTL_MS = originalCatalogCacheTtl;
    }
  });

  it("reuses the live-first catalog until the cache TTL expires", async () => {
    process.env.GOVGRAPH_CATALOG_CACHE_TTL_MS = "1000";

    const firstCatalog = await loadGovernmentCatalog();
    const secondCatalog = await loadGovernmentCatalog();

    expect(secondCatalog).toBe(firstCatalog);
    expect(fetchVpscPortfolios).toHaveBeenCalledTimes(1);
    expect(fetchParliamentGovernmentMinistry).toHaveBeenCalledTimes(1);
    expect(fetchVpscEmployers).toHaveBeenCalledTimes(1);
    expect(fetchBudgetIndex).toHaveBeenCalledTimes(1);
    expect(fetchBudgetPerformanceMeasures).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(1001);

    const refreshedCatalog = await loadGovernmentCatalog();

    expect(refreshedCatalog).not.toBe(firstCatalog);
    expect(fetchVpscPortfolios).toHaveBeenCalledTimes(2);
    expect(fetchParliamentGovernmentMinistry).toHaveBeenCalledTimes(2);
    expect(fetchVpscEmployers).toHaveBeenCalledTimes(2);
    expect(fetchBudgetIndex).toHaveBeenCalledTimes(2);
    expect(fetchBudgetPerformanceMeasures).toHaveBeenCalledTimes(2);
  });

  it("can invalidate the live-first catalog manually", async () => {
    process.env.GOVGRAPH_CATALOG_CACHE_TTL_MS = "60000";

    const firstCatalog = await loadGovernmentCatalog();

    resetCatalogCache();

    const refreshedCatalog = await loadGovernmentCatalog();

    expect(refreshedCatalog).not.toBe(firstCatalog);
    expect(fetchVpscPortfolios).toHaveBeenCalledTimes(2);
    expect(fetchParliamentGovernmentMinistry).toHaveBeenCalledTimes(2);
    expect(fetchVpscEmployers).toHaveBeenCalledTimes(2);
    expect(fetchBudgetIndex).toHaveBeenCalledTimes(2);
    expect(fetchBudgetPerformanceMeasures).toHaveBeenCalledTimes(2);
  });
});

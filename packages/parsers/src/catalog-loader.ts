import type {
  BudgetIndexDataset,
  BudgetPerformanceMeasuresDataset,
  MinistryDataset,
  VpscEmployersDataset,
  VpscPortfolioDataset,
} from "@govgraph/domain";
import { buildGovernmentCatalog, type GovernmentCatalog } from "@govgraph/domain";

import { fetchBudgetIndex, loadFixtureBudgetIndex } from "./budget/index";
import {
  fetchBudgetPerformanceMeasures,
  loadFixtureBudgetPerformanceMeasures,
} from "./budget/performance-measures";
import {
  fetchParliamentGovernmentMinistry,
  loadFixtureParliamentGovernmentMinistry,
} from "./ministry/parliament";
import {
  fetchVpscEmployers,
  loadFixtureVpscEmployers,
} from "./vpsc/employers";
import {
  fetchVpscPortfolios,
  loadFixtureVpscPortfolios,
} from "./vpsc/portfolios";

const DEFAULT_CATALOG_CACHE_TTL_MS = 5 * 60 * 1000;

type LiveCatalogCacheEntry = {
  createdAtMs: number;
  promise: Promise<GovernmentCatalog>;
};

let liveCatalogCache: LiveCatalogCacheEntry | undefined;

type CatalogInputs = {
  portfolios: VpscPortfolioDataset;
  ministry: MinistryDataset;
  employers: VpscEmployersDataset;
  budgetIndex: BudgetIndexDataset;
  performanceMeasures: BudgetPerformanceMeasuresDataset;
};

function loadFixtureCatalogInputs(): CatalogInputs {
  return {
    portfolios: loadFixtureVpscPortfolios(),
    ministry: loadFixtureParliamentGovernmentMinistry(),
    employers: loadFixtureVpscEmployers(),
    budgetIndex: loadFixtureBudgetIndex(),
    performanceMeasures: loadFixtureBudgetPerformanceMeasures(),
  };
}

async function safeLoad<T>(
  label: string,
  loadLive: () => Promise<T>,
  loadFixture: () => T,
): Promise<T> {
  try {
    return await loadLive();
  } catch (error) {
    console.warn(`Falling back to fixture for ${label}:`, error);
    return loadFixture();
  }
}

function getCatalogCacheTtlMs(): number {
  const configuredTtlMs = Number(process.env.GOVGRAPH_CATALOG_CACHE_TTL_MS);

  if (!Number.isFinite(configuredTtlMs)) {
    return DEFAULT_CATALOG_CACHE_TTL_MS;
  }

  return Math.max(0, Math.floor(configuredTtlMs));
}

function createLiveFirstCatalogPromise(): Promise<GovernmentCatalog> {
  return Promise.all([
    safeLoad("VPSC portfolios", fetchVpscPortfolios, loadFixtureVpscPortfolios),
    safeLoad(
      "Parliament ministry",
      fetchParliamentGovernmentMinistry,
      loadFixtureParliamentGovernmentMinistry,
    ),
    safeLoad("VPSC employers", fetchVpscEmployers, loadFixtureVpscEmployers),
    safeLoad("Budget index", fetchBudgetIndex, loadFixtureBudgetIndex),
    safeLoad(
      "Budget performance measures",
      fetchBudgetPerformanceMeasures,
      loadFixtureBudgetPerformanceMeasures,
    ),
  ]).then(([portfolios, ministry, employers, budgetIndex, performanceMeasures]) =>
    buildGovernmentCatalog({
      portfolios,
      ministry,
      employers,
      budgetIndex,
      performanceMeasures,
    }),
  );
}

export function resetCatalogCache(): void {
  liveCatalogCache = undefined;
}

export async function loadGovernmentCatalog(
  mode: "live-first" | "live" | "fixture" = "live-first",
): Promise<GovernmentCatalog> {
  const resolvedMode =
    mode === "live-first" && process.env.NODE_ENV === "test" ? "fixture" : mode;

  if (resolvedMode === "fixture") {
    return buildGovernmentCatalog(loadFixtureCatalogInputs());
  }

  const loadLiveCatalog = async () =>
    buildGovernmentCatalog({
      portfolios: await fetchVpscPortfolios(),
      ministry: await fetchParliamentGovernmentMinistry(),
      employers: await fetchVpscEmployers(),
      budgetIndex: await fetchBudgetIndex(),
      performanceMeasures: await fetchBudgetPerformanceMeasures(),
    });

  if (resolvedMode === "live") {
    return loadLiveCatalog();
  }

  const nowMs = Date.now();
  const cacheTtlMs = getCatalogCacheTtlMs();
  const cacheIsFresh =
    liveCatalogCache !== undefined &&
    nowMs - liveCatalogCache.createdAtMs < cacheTtlMs;

  if (!cacheIsFresh) {
    const promise = createLiveFirstCatalogPromise().catch((error) => {
      if (liveCatalogCache?.promise === promise) {
        liveCatalogCache = undefined;
      }
      throw error;
    });

    liveCatalogCache = {
      createdAtMs: nowMs,
      promise,
    };
  }

  const cachedCatalog = liveCatalogCache;

  if (!cachedCatalog) {
    throw new Error("Live catalog cache was not initialized.");
  }

  return cachedCatalog.promise;
}

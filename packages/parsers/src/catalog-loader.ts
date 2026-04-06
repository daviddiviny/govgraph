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

let liveCatalogPromise: Promise<GovernmentCatalog> | undefined;

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

  if (!liveCatalogPromise) {
    liveCatalogPromise = Promise.all([
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
    ]).then(
      ([portfolios, ministry, employers, budgetIndex, performanceMeasures]) =>
        buildGovernmentCatalog({
          portfolios,
          ministry,
          employers,
          budgetIndex,
          performanceMeasures,
        }),
    );
  }

  return liveCatalogPromise;
}

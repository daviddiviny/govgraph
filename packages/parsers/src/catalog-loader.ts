import { buildGovernmentCatalog, type GovernmentCatalog } from "@govgraph/domain";

import {
  fetchParliamentGovernmentMinistry,
  loadFixtureParliamentGovernmentMinistry,
} from "./ministry/parliament";
import {
  fetchVpscPortfolios,
  loadFixtureVpscPortfolios,
} from "./vpsc/portfolios";

let liveCatalogPromise: Promise<GovernmentCatalog> | undefined;

export async function loadGovernmentCatalog(
  mode: "live-first" | "live" | "fixture" = "live-first",
): Promise<GovernmentCatalog> {
  if (mode === "fixture") {
    return buildGovernmentCatalog({
      portfolios: loadFixtureVpscPortfolios(),
      ministry: loadFixtureParliamentGovernmentMinistry(),
    });
  }

  const loadLiveCatalog = async () =>
    buildGovernmentCatalog({
      portfolios: await fetchVpscPortfolios(),
      ministry: await fetchParliamentGovernmentMinistry(),
    });

  if (mode === "live") {
    return loadLiveCatalog();
  }

  if (!liveCatalogPromise) {
    liveCatalogPromise = loadLiveCatalog().catch((error) => {
      console.warn("Falling back to fixture catalog:", error);
      return buildGovernmentCatalog({
        portfolios: loadFixtureVpscPortfolios(),
        ministry: loadFixtureParliamentGovernmentMinistry(),
      });
    });
  }

  return liveCatalogPromise;
}

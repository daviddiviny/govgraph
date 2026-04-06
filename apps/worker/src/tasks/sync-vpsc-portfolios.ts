import { task } from "@trigger.dev/sdk";

import { fetchVpscPortfolios } from "@govgraph/parsers";

export const syncVpscPortfolios = task({
  id: "sync-vpsc-portfolios",
  run: async () => {
    const snapshot = await fetchVpscPortfolios();

    return {
      effectiveDate: snapshot.asOfDate,
      departments: snapshot.sections.length,
      portfolios: snapshot.sections.reduce(
        (total, section) => total + section.portfolioTitles.length,
        0,
      ),
    };
  },
});

import { task } from "@trigger.dev/sdk";

import { fetchBudgetIndex } from "@govgraph/parsers";

export const crawlBudgetIndex = task({
  id: "crawl-budget-index",
  run: async () => {
    const snapshot = await fetchBudgetIndex();

    return {
      budgetYear: snapshot.budgetYear,
      entries: snapshot.entries.length,
      sourceDocuments: snapshot.entries.reduce(
        (total, entry) => total + entry.sourceDocuments.length,
        0,
      ),
    };
  },
});

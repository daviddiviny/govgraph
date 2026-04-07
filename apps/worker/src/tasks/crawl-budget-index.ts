import { task } from "@trigger.dev/sdk";

import { fetchBudgetIndex } from "@govgraph/parsers";

export const crawlBudgetIndex = task({
  id: "crawl-budget-index",
  run: async () => {
    // Sprint 2 keeps these jobs fetch-only so scheduled runs prove the source is
    // still healthy and record the snapshot shape before persistence lands.
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

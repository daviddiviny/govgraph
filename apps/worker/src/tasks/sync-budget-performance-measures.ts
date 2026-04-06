import { task } from "@trigger.dev/sdk";

import { fetchBudgetPerformanceMeasures } from "@govgraph/parsers";

export const syncBudgetPerformanceMeasures = task({
  id: "sync-budget-performance-measures",
  run: async () => {
    const snapshot = await fetchBudgetPerformanceMeasures();

    return {
      budgetYear: snapshot.budgetYear,
      owners: snapshot.owners.length,
      outputs: snapshot.owners.reduce(
        (total, owner) => total + owner.outputs.length,
        0,
      ),
      performanceMeasures: snapshot.owners.reduce(
        (total, owner) =>
          total +
          owner.outputs.reduce(
            (ownerTotal, output) => ownerTotal + output.measures.length,
            0,
          ),
        0,
      ),
    };
  },
});

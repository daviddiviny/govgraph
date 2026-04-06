import { task } from "@trigger.dev/sdk";

import { fetchVpscEmployers } from "@govgraph/parsers";

export const syncVpscEmployers = task({
  id: "sync-vpsc-employers",
  run: async () => {
    const snapshot = await fetchVpscEmployers();

    return {
      effectiveDate: snapshot.asOfDate,
      employers: snapshot.employers.length,
      departments: new Set(
        snapshot.employers.map((employer) => employer.portfolioDepartment),
      ).size,
    };
  },
});

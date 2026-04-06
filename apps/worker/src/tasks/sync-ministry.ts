import { task } from "@trigger.dev/sdk";

import { fetchParliamentGovernmentMinistry } from "@govgraph/parsers";

export const syncMinistry = task({
  id: "sync-ministry",
  run: async () => {
    const snapshot = await fetchParliamentGovernmentMinistry();

    return {
      members: snapshot.members.length,
      portfolioAssignments: snapshot.members.reduce(
        (total, member) => total + member.titles.length,
        0,
      ),
    };
  },
});

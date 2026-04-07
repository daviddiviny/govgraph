import { task } from "@trigger.dev/sdk";

import {
  closeDbClient,
  createDbClient,
  persistGeneralOrderDataset,
} from "@govgraph/db";
import { fetchVicGovGeneralOrder } from "@govgraph/parsers";

export const syncGeneralOrder = task({
  id: "sync-general-order",
  run: async () => {
    const snapshot = await fetchVicGovGeneralOrder({ kanonAssistance: true });
    const client = createDbClient();

    try {
      return await persistGeneralOrderDataset(client.db, snapshot);
    } finally {
      await closeDbClient(client);
    }
  },
});

import { cache } from "react";

import {
  closeDbClient,
  createDbClient,
  getGeneralOrderOfficeDetail,
  getLatestGeneralOrderSourceSummary,
  listGeneralOrderOfficeSummaries,
  searchGeneralOrder,
  type GeneralOrderSearchResult,
  type GeneralOrderOfficeDetail,
  type GeneralOrderOfficeSummary,
  type GeneralOrderSourceSummary,
} from "@govgraph/db";

type GeneralOrderOverviewState =
  | {
      status: "ready";
      source: GeneralOrderSourceSummary;
      offices: GeneralOrderOfficeSummary[];
    }
  | { status: "empty" }
  | { status: "error"; message: string };

type GeneralOrderOfficeState =
  | {
      status: "ready";
      detail: GeneralOrderOfficeDetail;
    }
  | { status: "empty" }
  | { status: "missing" }
  | { status: "error"; message: string };

type GeneralOrderSearchState =
  | {
      status: "ready";
      source: GeneralOrderSourceSummary;
      results: GeneralOrderSearchResult[];
    }
  | { status: "empty" }
  | { status: "error"; message: string };

function describeLoadFailure(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Unknown database error";
}

export const loadGeneralOrderOverview = cache(
  async (): Promise<GeneralOrderOverviewState> => {
    const client = createDbClient();

    try {
      const source = await getLatestGeneralOrderSourceSummary(client.db);

      if (!source) {
        return { status: "empty" };
      }

      const offices = await listGeneralOrderOfficeSummaries(
        client.db,
        source.sourceDocumentId,
      );

      return {
        status: "ready",
        source,
        offices,
      };
    } catch (error) {
      console.error("Unable to load General Order overview.", error);

      return {
        status: "error",
        message: describeLoadFailure(error),
      };
    } finally {
      await closeDbClient(client);
    }
  },
);

export const loadGeneralOrderOffice = cache(
  async (officeSlug: string): Promise<GeneralOrderOfficeState> => {
    const client = createDbClient();

    try {
      const source = await getLatestGeneralOrderSourceSummary(client.db);

      if (!source) {
        return { status: "empty" };
      }

      const detail = await getGeneralOrderOfficeDetail(
        client.db,
        officeSlug,
        source.sourceDocumentId,
      );

      if (!detail) {
        return { status: "missing" };
      }

      return {
        status: "ready",
        detail,
      };
    } catch (error) {
      console.error(`Unable to load General Order office ${officeSlug}.`, error);

      return {
        status: "error",
        message: describeLoadFailure(error),
      };
    } finally {
      await closeDbClient(client);
    }
  },
);

export const loadGeneralOrderSearch = cache(
  async (query: string): Promise<GeneralOrderSearchState> => {
    const trimmedQuery = query.trim();

    if (!trimmedQuery) {
      return { status: "empty" };
    }

    const client = createDbClient();

    try {
      const source = await getLatestGeneralOrderSourceSummary(client.db);

      if (!source) {
        return { status: "empty" };
      }

      const results = await searchGeneralOrder(client.db, trimmedQuery, 8);

      return {
        status: "ready",
        source,
        results,
      };
    } catch (error) {
      console.error(`Unable to search General Order records for ${trimmedQuery}.`, error);

      return {
        status: "error",
        message: describeLoadFailure(error),
      };
    } finally {
      await closeDbClient(client);
    }
  },
);

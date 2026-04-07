import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import * as schema from "./schema";

const DEFAULT_DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/govgraph";

export type GovgraphDb = NodePgDatabase<typeof schema>;

export type GovgraphDbClient = {
  db: GovgraphDb;
  pool: Pool;
};

export function createDbClient(
  connectionString = process.env.DATABASE_URL ?? DEFAULT_DATABASE_URL,
): GovgraphDbClient {
  const pool = new Pool({ connectionString });

  return {
    db: drizzle(pool, { schema }),
    pool,
  };
}

export async function closeDbClient(client: GovgraphDbClient): Promise<void> {
  await client.pool.end();
}

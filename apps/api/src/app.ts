import { getNodeProfile, searchGovernmentCatalog } from "@govgraph/domain";
import { loadGovernmentCatalog } from "@govgraph/parsers";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";

const searchSchema = z.object({
  q: z.string().trim().min(1),
  limit: z.coerce.number().int().min(1).max(20).optional(),
});

const slugSchema = z.object({
  slug: z.string().trim().min(1),
});

export const app = new Hono();

app.get("/health", (context) => {
  return context.json({ ok: true });
});

app.get("/search", zValidator("query", searchSchema), async (context) => {
  const query = context.req.valid("query");
  const catalog = await loadGovernmentCatalog();
  const results = searchGovernmentCatalog(catalog, query.q, query.limit ?? 12);

  return context.json({
    query: query.q,
    total: results.length,
    results,
  });
});

app.get("/nodes/:slug", zValidator("param", slugSchema), async (context) => {
  const { slug } = context.req.valid("param");
  const catalog = await loadGovernmentCatalog();
  const profile = getNodeProfile(catalog, slug);

  if (!profile) {
    return context.json({ error: "Node not found" }, 404);
  }

  return context.json(profile);
});

import { app } from "./app";
import { z } from "zod";

describe("api", () => {
  it("returns health", async () => {
    const response = await app.request("/health");
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
  });

  it("searches the current catalog", async () => {
    const response = await app.request("/search?q=education");
    expect(response.status).toBe(200);

    const payload = z
      .object({ total: z.number() })
      .parse(await response.json());
    expect(payload.total).toBeGreaterThan(0);
  });
});

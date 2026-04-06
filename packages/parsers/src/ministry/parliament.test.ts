import { afterEach, describe, expect, it, vi } from "vitest";

import { parliamentMinistryFixture } from "../fixtures/parliament-ministry.fixture";
import {
  fetchParliamentGovernmentMinistry,
  loadFixtureParliamentGovernmentMinistry,
  PARLIAMENT_MINISTRY_URL,
} from "./parliament";

describe("parseParliamentGovernmentMinistry", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("extracts people, their portfolios, and detail links", () => {
    const snapshot = loadFixtureParliamentGovernmentMinistry();

    expect(snapshot.members).toHaveLength(2);
    expect(snapshot.members[1]?.personName).toBe("Ben Carroll");
    expect(snapshot.members[1]?.titles).toContain("Deputy Premier");
    expect(snapshot.members[1]?.detailUrl).toBe(
      "https://www.parliament.vic.gov.au/members/ben-carroll/",
    );
  });

  it("uses a 10 second timeout for live Parliament fetches", async () => {
    const signal = new AbortController().signal;
    const timeoutSpy = vi.spyOn(AbortSignal, "timeout").mockReturnValue(signal);
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(parliamentMinistryFixture, { status: 200 }),
    );

    await fetchParliamentGovernmentMinistry();

    expect(timeoutSpy).toHaveBeenCalledWith(10_000);
    expect(fetchSpy).toHaveBeenCalledWith(PARLIAMENT_MINISTRY_URL, { signal });
  });
});

import { loadFixtureParliamentGovernmentMinistry } from "./parliament";

describe("parseParliamentGovernmentMinistry", () => {
  it("extracts people, their portfolios, and detail links", () => {
    const snapshot = loadFixtureParliamentGovernmentMinistry();

    expect(snapshot.members).toHaveLength(2);
    expect(snapshot.members[1]?.personName).toBe("Ben Carroll");
    expect(snapshot.members[1]?.titles).toContain("Deputy Premier");
    expect(snapshot.members[1]?.detailUrl).toBe(
      "https://www.parliament.vic.gov.au/members/ben-carroll/",
    );
  });
});

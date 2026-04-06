import { loadFixtureVicGovGeneralOrder } from "./vicgov";

describe("parseVicGovGeneralOrder", () => {
  it("extracts offices, Acts, and shared responsibility rules", () => {
    const snapshot = loadFixtureVicGovGeneralOrder();

    expect(snapshot.effectiveDate).toBe("2025-10-30");
    expect(snapshot.offices).toHaveLength(3);

    const attorneyGeneral = snapshot.offices[0];
    expect(attorneyGeneral?.officeName).toBe("Attorney-General");

    const bailAct = attorneyGeneral?.acts.find(
      (entry) => entry.actName === "Bail Act 1977",
    );
    expect(bailAct?.headingStyle).toBe("except");
    expect(bailAct?.rules[0]?.ruleKind).toBe("default");
    expect(bailAct?.rules[0]?.administeringOfficeNames).toEqual([
      "Attorney-General",
    ]);
    expect(bailAct?.rules[1]?.administeringOfficeNames).toEqual([
      "Attorney-General",
      "Minister for Youth Justice",
    ]);
    expect(bailAct?.rules[1]?.administrationMode).toBe("joint_and_several");
    expect(bailAct?.rules[1]?.provisionReferences.map((entry) => entry.rawText)).toEqual([
      "Section 3B",
      "Part 2A",
    ]);
  });

  it("keeps scoped lists and residual rules distinct", () => {
    const snapshot = loadFixtureVicGovGeneralOrder();
    const attorneyGeneral = snapshot.offices.find(
      (section) => section.officeName === "Attorney-General",
    );
    const constitutionAct = attorneyGeneral?.acts.find(
      (entry) => entry.actName === "Constitution Act 1975",
    );

    expect(constitutionAct?.headingStyle).toBe("scoped_list");
    expect(constitutionAct?.rules[0]?.scopeText).toBe("Part III");
    expect(constitutionAct?.rules[0]?.administeringOfficeNames).toEqual([
      "Attorney-General",
    ]);
    expect(constitutionAct?.rules[1]?.administeringOfficeNames).toEqual([
      "Attorney-General",
      "Premier",
    ]);
    expect(constitutionAct?.rules[2]?.ruleKind).toBe("residual");
    expect(constitutionAct?.rules[2]?.administeringOfficeNames).toEqual([
      "Minister for Finance",
      "Premier",
    ]);
    expect(constitutionAct?.rules[2]?.administrationMode).toBe("unknown");
  });

  it("marks complex carve-outs as partial instead of overstating confidence", () => {
    const snapshot = loadFixtureVicGovGeneralOrder();
    const premier = snapshot.offices.find((section) => section.officeName === "Premier");
    const projectAct = premier?.acts.find(
      (entry) =>
        entry.actName === "Project Development and Construction Management Act 1994",
    );

    expect(projectAct?.rules[1]?.parseStatus).toBe("partial");
    expect(projectAct?.rules[1]?.unparsedTail).toContain(
      "except to the extent",
    );
  });
});

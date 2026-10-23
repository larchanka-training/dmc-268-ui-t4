import { describe, expect, it } from "vitest";

import {
  type ReviewRules,
  groupBySection,
  toRulesStatus,
  usesDefaultRules,
} from "./run-rules";

const APPLIED: ReviewRules = {
  path: ".review/rules.md",
  ref: "a1b2c3d4e5f6a7b8",
  status: "applied",
  fileUrl: "https://github.com/acme/api/blob/a1b2c3d4e5f6a7b8/.review/rules.md",
  rules: [
    { id: "R1", section: "Security", text: "Bind SQL parameters." },
    { id: "R2", section: "Style", text: "Docstrings on public functions." },
    { id: "R3", section: "Security", text: "Check the tenant id." },
  ],
  droppedSuspicious: 0,
  droppedOverLimit: 0,
};

describe("toRulesStatus", () => {
  it("keeps a known status", () => {
    expect(toRulesStatus("rejected:encoding")).toBe("rejected:encoding");
  });

  it("turns a status this client does not know into unknown", () => {
    expect(toRulesStatus("rejected:something_new")).toBe("unknown");
  });
});

describe("groupBySection", () => {
  it("groups rules by section in order of first appearance", () => {
    expect(groupBySection(APPLIED.rules)).toEqual([
      {
        title: "Security",
        rules: [APPLIED.rules[0], APPLIED.rules[2]],
      },
      { title: "Style", rules: [APPLIED.rules[1]] },
    ]);
  });

  it("is empty for no rules", () => {
    expect(groupBySection([])).toEqual([]);
  });
});

describe("usesDefaultRules", () => {
  it("is false when the file contributes rules", () => {
    expect(usesDefaultRules(APPLIED)).toBe(false);
  });

  it("is true when the file is absent, rejected or has no rules", () => {
    expect(usesDefaultRules({ ...APPLIED, status: "absent", rules: [] })).toBe(
      true,
    );
    expect(usesDefaultRules({ ...APPLIED, status: "rejected:too_large" })).toBe(
      true,
    );
    expect(usesDefaultRules({ ...APPLIED, rules: [] })).toBe(true);
  });
});

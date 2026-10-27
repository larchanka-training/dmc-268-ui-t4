import { describe, expect, it } from "vitest";

import { type Finding } from "./finding";
import {
  DEFAULT_FINDING_FILTERS,
  filterFindings,
  findingPaths,
  hasActiveFindingFilters,
  toggleSeverity,
} from "./finding-filters";

function finding(overrides: Partial<Finding> & { id: string }): Finding {
  return {
    position: { path: "src/api.ts", line: 10, side: "new" },
    severity: "medium",
    category: "correctness",
    message: "Handle the empty response.",
    suggestion: null,
    publishedAt: "2026-10-27T10:00:00.000Z",
    externalUrl: "https://github.com/acme/payments/pull/1#discussion_r1",
    ...overrides,
  };
}

const sqlInjection = finding({
  id: "f1",
  position: { path: "src/db.ts", line: 4, side: "new" },
  severity: "critical",
  category: "security",
  message: "User input reaches the SQL query unescaped.",
  suggestion: { before: ["query(sql + id)"], after: ["query(sql, [id])"] },
});
const emptyResponse = finding({ id: "f2" });
const slowLoop = finding({
  id: "f3",
  severity: "low",
  category: "performance",
  message: "The loop re-reads the config on every pass.",
});
const findings = [sqlInjection, emptyResponse, slowLoop];

describe("filterFindings", () => {
  it("keeps everything with the default filters", () => {
    expect(filterFindings(findings, DEFAULT_FINDING_FILTERS)).toEqual(findings);
  });

  it("keeps one file", () => {
    expect(
      filterFindings(findings, { severities: [], path: "src/api.ts" }),
    ).toEqual([emptyResponse, slowLoop]);
  });

  it("keeps the chosen severities", () => {
    expect(
      filterFindings(findings, { severities: ["critical", "low"] }),
    ).toEqual([sqlInjection, slowLoop]);
  });

  it("searches the comment case-insensitively and ignores surrounding spaces", () => {
    expect(
      filterFindings(findings, { severities: [], query: "  SQL query " }),
    ).toEqual([sqlInjection]);
  });

  it("searches the suggested code and the category", () => {
    expect(filterFindings(findings, { severities: [], query: "[id]" })).toEqual(
      [sqlInjection],
    );
    expect(
      filterFindings(findings, { severities: [], query: "performance" }),
    ).toEqual([slowLoop]);
  });

  it("combines the filters", () => {
    expect(
      filterFindings(findings, {
        path: "src/api.ts",
        severities: ["medium"],
        query: "loop",
      }),
    ).toEqual([]);
  });
});

describe("hasActiveFindingFilters", () => {
  it("ignores a blank query", () => {
    expect(hasActiveFindingFilters({ severities: [], query: "  " })).toBe(
      false,
    );
  });

  it("reports a file, a severity or a query", () => {
    expect(hasActiveFindingFilters({ severities: [], path: "a.ts" })).toBe(
      true,
    );
    expect(hasActiveFindingFilters({ severities: ["high"] })).toBe(true);
    expect(hasActiveFindingFilters({ severities: [], query: "x" })).toBe(true);
  });
});

describe("toggleSeverity", () => {
  it("adds and removes a severity", () => {
    const withHigh = toggleSeverity(DEFAULT_FINDING_FILTERS, "high");

    expect(withHigh.severities).toEqual(["high"]);
    expect(toggleSeverity(withHigh, "high").severities).toEqual([]);
  });
});

describe("findingPaths", () => {
  it("lists each file once, in page order", () => {
    expect(findingPaths(findings)).toEqual(["src/db.ts", "src/api.ts"]);
  });
});

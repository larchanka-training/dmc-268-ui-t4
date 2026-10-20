import { describe, expect, it, vi } from "vitest";

import { type DiffFile } from "@/shared/diff/domain/types";

import { type Finding } from "../domain/finding";

import { type RunsRepository } from "./ports";
import { getFindingContext } from "./use-cases";

const SNIPPET: DiffFile = {
  path: "src/payment_service.rb",
  oldPath: null,
  status: "modified",
  hunks: [
    {
      id: "hunk_1",
      oldStart: 140,
      oldLines: 1,
      newStart: 140,
      newLines: 2,
      header: null,
      lines: [
        { type: "context", oldLine: 140, newLine: 140, content: "  a" },
        { type: "added", oldLine: null, newLine: 141, content: "  b" },
      ],
    },
  ],
};

const finding: Finding = {
  id: "finding_1",
  position: { path: "src/payment_service.rb", line: 141, side: "new" },
  severity: "high",
  category: "correctness",
  message: "…",
  suggestion: null,
  publishedAt: "2026-10-11T12:01:00+00:00",
  externalUrl: "https://github.com/acme/payments/pull/412#discussion_r1",
};

function dependencies(): { runs: RunsRepository } {
  const notUsed = () => Promise.reject(new Error("not used"));

  return {
    runs: {
      listActiveRuns: notUsed,
      listRunHistory: notUsed,
      getRunDetails: notUsed,
      getFileLines: notUsed,
      getFindingContext: vi.fn(() =>
        Promise.resolve({ snippet: SNIPPET, fileLineCount: 180 }),
      ),
      watchRun: () => () => undefined,
    },
  };
}

describe("getFindingContext", () => {
  it("returns the snippet when the commented line is in it", async () => {
    await expect(
      getFindingContext(dependencies(), "job_1", finding),
    ).resolves.toEqual({ snippet: SNIPPET, fileLineCount: 180 });
  });

  it("returns null when the line is not in the snippet, so nothing is anchored wrongly", async () => {
    const outside = {
      ...finding,
      position: { ...finding.position, line: 900 },
    };

    await expect(
      getFindingContext(dependencies(), "job_1", outside),
    ).resolves.toBeNull();
  });
});

import { describe, expect, it } from "vitest";

import { toSplitRows } from "./split";
import { type DiffHunk, type DiffLine } from "./types";

function context(oldLine: number, newLine: number, content = "code"): DiffLine {
  return { type: "context", oldLine, newLine, content };
}

function removed(oldLine: number, content = "old code"): DiffLine {
  return { type: "removed", oldLine, newLine: null, content };
}

function added(newLine: number, content = "new code"): DiffLine {
  return { type: "added", oldLine: null, newLine, content };
}

function hunkOf(lines: readonly DiffLine[]): DiffHunk {
  return {
    id: "h1",
    oldStart: 1,
    oldLines: lines.filter((line) => line.oldLine !== null).length,
    newStart: 1,
    newLines: lines.filter((line) => line.newLine !== null).length,
    header: null,
    lines,
  };
}

describe("toSplitRows", () => {
  it("puts a context line in both columns", () => {
    const line = context(10, 10);

    expect(toSplitRows(hunkOf([line]))).toEqual([{ left: line, right: line }]);
  });

  it("pairs a removed line with the added line that replaces it", () => {
    const before = removed(10, "charge(account, amount)");
    const after = added(10, "charge_with_retries(account, amount)");

    expect(toSplitRows(hunkOf([before, after]))).toEqual([
      { left: before, right: after },
    ]);
  });

  it("pairs replacements in order and leaves the extra addition on its own row", () => {
    const first = removed(10, "a");
    const second = removed(11, "b");
    const replacementA = added(10, "A");
    const replacementB = added(11, "B");
    const extra = added(12, "C");

    expect(
      toSplitRows(hunkOf([first, second, replacementA, replacementB, extra])),
    ).toEqual([
      { left: first, right: replacementA },
      { left: second, right: replacementB },
      { left: null, right: extra },
    ]);
  });

  it("leaves the right column empty for a deletion", () => {
    const line = removed(10);

    expect(toSplitRows(hunkOf([line, context(11, 10)]))).toEqual([
      { left: line, right: null },
      { left: context(11, 10), right: context(11, 10) },
    ]);
  });

  it("leaves the left column empty for a pure addition", () => {
    const line = added(10);

    expect(toSplitRows(hunkOf([context(9, 9), line]))).toEqual([
      { left: context(9, 9), right: context(9, 9) },
      { left: null, right: line },
    ]);
  });

  it("starts a new block after a context line, so unrelated edits never pair up", () => {
    const deletion = removed(10);
    const divider = context(11, 10);
    const insertion = added(11);

    expect(toSplitRows(hunkOf([deletion, divider, insertion]))).toEqual([
      { left: deletion, right: null },
      { left: divider, right: divider },
      { left: null, right: insertion },
    ]);
  });

  it("returns no rows for an empty hunk", () => {
    expect(toSplitRows(hunkOf([]))).toEqual([]);
  });
});

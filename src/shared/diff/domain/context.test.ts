import { describe, expect, it } from "vitest";

import {
  EXPAND_STEP,
  expandRange,
  getContextGaps,
  mergeExpandedLines,
} from "./context";
import { type DiffHunk, type DiffLine } from "./types";

function context(oldLine: number, newLine: number, content = "code"): DiffLine {
  return { type: "context", oldLine, newLine, content };
}

function added(newLine: number, content = "new code"): DiffLine {
  return { type: "added", oldLine: null, newLine, content };
}

const hunk: DiffHunk = {
  id: "h1",
  oldStart: 120,
  oldLines: 2,
  newStart: 120,
  newLines: 4,
  header: "def process_payment(user, amount):",
  lines: [
    context(120, 120, "    account = get_account(user)"),
    added(121, "    if amount <= 0:"),
    added(122, "        raise InvalidAmount()"),
    context(121, 123, "    charge(account, amount)"),
  ],
};

describe("getContextGaps", () => {
  it("reports the stretch above the first hunk", () => {
    const [gap] = getContextGaps([hunk]);

    expect(gap).toMatchObject({
      previousHunkId: null,
      nextHunkId: "h1",
      newStart: 1,
      oldStart: 1,
      size: 119,
    });
  });

  it("reports the stretch between two hunks", () => {
    const second: DiffHunk = {
      ...hunk,
      id: "h2",
      oldStart: 200,
      newStart: 202,
      oldLines: 2,
      newLines: 2,
    };

    const between = getContextGaps([hunk, second]).find(
      (gap) => gap.nextHunkId === "h2",
    );

    expect(between).toMatchObject({
      previousHunkId: "h1",
      newStart: 124,
      size: 78,
    });
  });

  it("leaves the trailing gap open when the file length is unknown", () => {
    const trailing = getContextGaps([hunk]).at(-1);

    expect(trailing).toMatchObject({
      nextHunkId: null,
      newStart: 124,
      size: null,
    });
  });

  it("sizes the trailing gap when the file length is known", () => {
    const trailing = getContextGaps([hunk], 140).at(-1);

    expect(trailing?.size).toBe(17);
  });

  it("skips gaps between adjacent hunks", () => {
    const adjacent: DiffHunk = {
      ...hunk,
      id: "h2",
      newStart: 124,
      oldStart: 122,
    };

    const gaps = getContextGaps([hunk, adjacent]);

    expect(gaps.some((gap) => gap.nextHunkId === "h2")).toBe(false);
  });
});

describe("expandRange", () => {
  const gap = getContextGaps([hunk], 140)[0]!;

  it("unfolds one step upwards, ending right above the hunk", () => {
    expect(expandRange(gap, "up")).toEqual({
      from: 119 - EXPAND_STEP + 1,
      to: 119,
    });
  });

  it("unfolds one step downwards, starting at the top of the gap", () => {
    expect(expandRange(gap, "down")).toEqual({ from: 1, to: EXPAND_STEP });
  });

  it("unfolds the whole gap", () => {
    expect(expandRange(gap, "all")).toEqual({ from: 1, to: 119 });
  });

  it("cannot unfold upwards or fully when the end of the file is unknown", () => {
    const openEnded = getContextGaps([hunk]).at(-1)!;

    expect(expandRange(openEnded, "up")).toBeNull();
    expect(expandRange(openEnded, "all")).toBeNull();
    expect(expandRange(openEnded, "down")).toEqual({
      from: 124,
      to: 124 + EXPAND_STEP - 1,
    });
  });
});

describe("mergeExpandedLines", () => {
  it("prepends lines fetched above the hunk and keeps both numberings aligned", () => {
    const merged = mergeExpandedLines(hunk, {
      from: 118,
      contents: ["# above 1", "# above 2"],
    });

    expect(merged.lines.slice(0, 2)).toEqual([
      context(118, 118, "# above 1"),
      context(119, 119, "# above 2"),
    ]);
    expect(merged.newStart).toBe(118);
    expect(merged.oldStart).toBe(118);
  });

  it("appends lines fetched below the hunk using the post-hunk offset", () => {
    const merged = mergeExpandedLines(hunk, {
      from: 124,
      contents: ["# below"],
    });

    // Two lines were added by the diff, so the old file runs two lines behind the new one.
    expect(merged.lines.at(-1)).toEqual(context(122, 124, "# below"));
  });

  it("ignores lines the hunk already shows", () => {
    const merged = mergeExpandedLines(hunk, {
      from: 120,
      contents: ["    account = get_account(user)"],
    });

    expect(merged).toBe(hunk);
  });
});

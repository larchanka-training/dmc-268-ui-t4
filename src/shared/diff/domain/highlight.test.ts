import { describe, expect, it } from "vitest";

import { applyTokens, hunkSides } from "./highlight";
import { type DiffHunk } from "./types";

const hunk: DiffHunk = {
  id: "h1",
  oldStart: 10,
  oldLines: 2,
  newStart: 10,
  newLines: 2,
  header: null,
  lines: [
    { type: "context", oldLine: 10, newLine: 10, content: "def charge" },
    { type: "removed", oldLine: 11, newLine: null, content: "  pay(amount)" },
    { type: "added", oldLine: null, newLine: 11, content: "  pay!(amount)" },
  ],
};

describe("hunkSides", () => {
  it("rebuilds each side of the hunk as whole text", () => {
    const sides = hunkSides(hunk);

    expect(sides.old.text).toBe("def charge\n  pay(amount)");
    expect(sides.new.text).toBe("def charge\n  pay!(amount)");
  });

  it("remembers which hunk line each side line came from", () => {
    const sides = hunkSides(hunk);

    expect(sides.old.lineIndexes).toEqual([0, 1]);
    expect(sides.new.lineIndexes).toEqual([0, 2]);
  });
});

describe("applyTokens", () => {
  const sides = hunkSides(hunk);
  const oldTokens = [
    [{ content: "def charge", style: { color: "#1" } }],
    [{ content: "  pay(amount)", style: { color: "#2" } }],
  ];
  const newTokens = [
    [{ content: "def charge", style: { color: "#3" } }],
    [{ content: "  pay!(amount)", style: { color: "#4" } }],
  ];

  it("puts each side's tokens back on the lines they came from", () => {
    const result = applyTokens(sides, { old: oldTokens, new: newTokens }, 3);

    expect(result[1]).toEqual(oldTokens[1]);
    expect(result[2]).toEqual(newTokens[1]);
  });

  it("colours a context line from the new side, which is the file as it stands", () => {
    const result = applyTokens(sides, { old: oldTokens, new: newTokens }, 3);

    expect(result[0]).toEqual(newTokens[0]);
  });

  it("keeps the line plain when only one side was highlighted", () => {
    const result = applyTokens(sides, { new: newTokens }, 3);

    expect(result[1]).toBeNull();
    expect(result[2]).toEqual(newTokens[1]);
  });

  it("drops a side whose line count does not match, rather than shifting colours", () => {
    const tooShort = [[{ content: "def charge" }]];

    expect(
      applyTokens(sides, { old: tooShort, new: newTokens }, 3)[1],
    ).toBeNull();
  });

  it("returns one entry per hunk line", () => {
    expect(applyTokens(sides, {}, 3)).toEqual([null, null, null]);
  });
});

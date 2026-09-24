import { describe, expect, it } from "vitest";

import {
  findLinePosition,
  isPositionInDiff,
  positionAnchorId,
} from "./position";
import { type DiffHunk } from "./types";

const hunk: DiffHunk = {
  id: "h1",
  oldStart: 120,
  oldLines: 2,
  newStart: 120,
  newLines: 4,
  header: null,
  lines: [
    {
      type: "context",
      oldLine: 120,
      newLine: 120,
      content: "account = get_account(user)",
    },
    {
      type: "removed",
      oldLine: 121,
      newLine: null,
      content: "charge(account, amount)",
    },
    { type: "added", oldLine: null, newLine: 121, content: "if amount <= 0:" },
    {
      type: "added",
      oldLine: null,
      newLine: 122,
      content: "    raise InvalidAmount()",
    },
  ],
};

describe("findLinePosition", () => {
  it("finds an added line on the new side", () => {
    expect(findLinePosition([hunk], { line: 122, side: "new" })).toMatchObject({
      hunkId: "h1",
      lineIndex: 3,
    });
  });

  it("finds a removed line on the old side", () => {
    expect(findLinePosition([hunk], { line: 121, side: "old" })).toMatchObject({
      lineIndex: 1,
    });
  });

  it("does not match an added line against the old side", () => {
    expect(findLinePosition([hunk], { line: 122, side: "old" })).toBeNull();
  });
});

describe("isPositionInDiff", () => {
  it("rejects a line that is not part of the diff", () => {
    // A finding pointing outside the diff cannot be published as an inline comment.
    expect(isPositionInDiff([hunk], { line: 400, side: "new" })).toBe(false);
  });

  it("accepts a line that is part of the diff", () => {
    expect(isPositionInDiff([hunk], { line: 120, side: "new" })).toBe(true);
  });
});

describe("positionAnchorId", () => {
  it("builds a deep link id from the path and the side", () => {
    expect(
      positionAnchorId({
        path: "src/payment_service.rb",
        line: 142,
        side: "new",
      }),
    ).toBe("src-payment_service-rb-R142");
  });
});

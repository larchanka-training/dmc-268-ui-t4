import {
  type DiffHunk,
  type DiffLine,
  type DiffPosition,
  type DiffSide,
} from "./types";

/** The line number a diff line carries on the given side of the diff. */
export function lineNumberOnSide(
  line: DiffLine,
  side: DiffSide,
): number | null {
  return side === "old" ? line.oldLine : line.newLine;
}

export interface FoundLine {
  readonly hunkId: string;
  readonly lineIndex: number;
  readonly line: DiffLine;
}

/**
 * Locates the diff line a review comment points at. Returns null when the position is
 * outside the diff, which is how hallucinated line numbers are filtered out (see the
 * "Diff Position Mapping" stage of the review pipeline).
 */
export function findLinePosition(
  hunks: readonly DiffHunk[],
  position: Pick<DiffPosition, "line" | "side">,
): FoundLine | null {
  for (const hunk of hunks) {
    for (const [lineIndex, line] of hunk.lines.entries()) {
      if (lineNumberOnSide(line, position.side) === position.line) {
        return { hunkId: hunk.id, lineIndex, line };
      }
    }
  }

  return null;
}

export function isPositionInDiff(
  hunks: readonly DiffHunk[],
  position: Pick<DiffPosition, "line" | "side">,
): boolean {
  return findLinePosition(hunks, position) !== null;
}

/** Stable DOM id, used for deep links such as #src-payment-ts-R142. */
export function positionAnchorId(position: DiffPosition): string {
  const path = position.path
    .replace(/[^a-zA-Z0-9_]+/g, "-")
    .replace(/^-|-$/g, "");
  const side = position.side === "old" ? "L" : "R";

  return `${path}-${side}${String(position.line)}`;
}

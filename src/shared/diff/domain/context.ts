import {
  type ContextGap,
  type DiffHunk,
  type DiffLine,
  type ExpandDirection,
  type ExpandedLines,
} from "./types";

/** How many lines a single "unfold" step reveals. */
export const EXPAND_STEP = 20;

function hunkOldEnd(hunk: DiffHunk): number {
  return hunk.oldStart + hunk.oldLines;
}

function hunkNewEnd(hunk: DiffHunk): number {
  return hunk.newStart + hunk.newLines;
}

/**
 * Finds the unchanged stretches around and between hunks. The UI renders one
 * "unfold" row per gap; requesting the hidden lines is the caller's job.
 *
 * @param fileLineCount total number of lines in the new file, when known. Without it the
 * trailing gap is still reported, but its size stays unknown.
 */
export function getContextGaps(
  hunks: readonly DiffHunk[],
  fileLineCount?: number,
): ContextGap[] {
  const gaps: ContextGap[] = [];

  hunks.forEach((hunk, index) => {
    const previous = index === 0 ? null : (hunks[index - 1] ?? null);

    const oldStart = previous ? hunkOldEnd(previous) : 1;
    const newStart = previous ? hunkNewEnd(previous) : 1;
    const size = hunk.newStart - newStart;

    if (size > 0) {
      gaps.push({
        id: `gap-before-${hunk.id}`,
        previousHunkId: previous?.id ?? null,
        nextHunkId: hunk.id,
        oldStart,
        newStart,
        size,
      });
    }
  });

  const last = hunks.at(-1);

  if (last) {
    const newStart = hunkNewEnd(last);
    const size =
      fileLineCount === undefined ? null : fileLineCount - newStart + 1;

    if (size === null || size > 0) {
      gaps.push({
        id: `gap-after-${last.id}`,
        previousHunkId: last.id,
        nextHunkId: null,
        oldStart: hunkOldEnd(last),
        newStart,
        size,
      });
    }
  }

  return gaps;
}

export interface LineRange {
  readonly from: number;
  readonly to: number;
}

/**
 * Turns an unfold request into the range of new-file lines to fetch.
 * "up" reveals the lines just above the following hunk, "down" the ones just below the
 * previous hunk, and "all" the whole gap.
 */
export function expandRange(
  gap: ContextGap,
  direction: ExpandDirection,
): LineRange | null {
  const lastKnownLine = gap.size === null ? null : gap.newStart + gap.size - 1;

  if (direction === "down") {
    const to =
      lastKnownLine === null
        ? gap.newStart + EXPAND_STEP - 1
        : Math.min(gap.newStart + EXPAND_STEP - 1, lastKnownLine);

    return to < gap.newStart ? null : { from: gap.newStart, to };
  }

  if (lastKnownLine === null) {
    return null;
  }

  if (direction === "all") {
    return lastKnownLine < gap.newStart
      ? null
      : { from: gap.newStart, to: lastKnownLine };
  }

  const from = Math.max(gap.newStart, lastKnownLine - EXPAND_STEP + 1);

  return { from, to: lastKnownLine };
}

/**
 * Merges fetched context lines into a hunk. Unfolded lines always sit entirely above or
 * entirely below the hunk, so they are prepended or appended rather than interleaved.
 * Old-file numbers are derived from the offset between the two sides, which stays constant
 * inside an unchanged stretch.
 */
export function mergeExpandedLines(
  hunk: DiffHunk,
  expanded: ExpandedLines,
): DiffHunk {
  const offsetAbove = hunk.oldStart - hunk.newStart;
  const offsetBelow = hunkOldEnd(hunk) - hunkNewEnd(hunk);
  const prepend = expanded.from < hunk.newStart;
  const offset = prepend ? offsetAbove : offsetBelow;

  const known = new Set(
    hunk.lines.flatMap((line) => (line.newLine === null ? [] : [line.newLine])),
  );

  const added: DiffLine[] = expanded.contents.flatMap((content, index) => {
    const newLine = expanded.from + index;

    if (known.has(newLine)) {
      return [];
    }

    return [
      {
        type: "context",
        newLine,
        oldLine: newLine + offset,
        content,
      } satisfies DiffLine,
    ];
  });

  if (added.length === 0) {
    return hunk;
  }

  const lines = prepend ? [...added, ...hunk.lines] : [...hunk.lines, ...added];
  const first = lines[0];

  return {
    ...hunk,
    lines,
    newStart: first?.newLine ?? hunk.newStart,
    oldStart: first?.oldLine ?? hunk.oldStart,
    newLines: lines.filter((line) => line.newLine !== null).length,
    oldLines: lines.filter((line) => line.oldLine !== null).length,
  };
}

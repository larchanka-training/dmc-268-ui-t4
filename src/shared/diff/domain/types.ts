/**
 * Diff model. It mirrors the way GitHub addresses review comments: a position is a
 * line number plus the side of the diff it belongs to (LEFT = the old file, RIGHT = the new one).
 */

export type DiffSide = "old" | "new";

export type DiffLineType = "context" | "added" | "removed";

export interface DiffLine {
  readonly type: DiffLineType;
  /** Line number in the old file, null for added lines. */
  readonly oldLine: number | null;
  /** Line number in the new file, null for removed lines. */
  readonly newLine: number | null;
  readonly content: string;
}

export interface DiffHunk {
  readonly id: string;
  readonly oldStart: number;
  readonly oldLines: number;
  readonly newStart: number;
  readonly newLines: number;
  /** The text after "@@", usually the enclosing function signature. */
  readonly header: string | null;
  readonly lines: readonly DiffLine[];
}

export type DiffFileStatus = "added" | "modified" | "removed" | "renamed";

export interface DiffFile {
  readonly path: string;
  readonly oldPath: string | null;
  readonly status: DiffFileStatus;
  readonly hunks: readonly DiffHunk[];
}

/** Where a review comment is anchored, in GitHub terms. */
export interface DiffPosition {
  readonly path: string;
  readonly line: number;
  readonly side: DiffSide;
}

/** A stretch of unchanged code between two hunks that the reader can unfold. */
export interface ContextGap {
  readonly id: string;
  /** Hunk above the gap, null when the gap starts at the top of the file. */
  readonly previousHunkId: string | null;
  /** Hunk below the gap, null when the gap runs to the end of the file. */
  readonly nextHunkId: string | null;
  readonly oldStart: number;
  readonly newStart: number;
  /** Number of hidden lines, null when the end of the file is unknown. */
  readonly size: number | null;
}

export type ExpandDirection = "up" | "down" | "all";

/** Unchanged lines fetched to unfold context, numbered in the new file. */
export interface ExpandedLines {
  readonly from: number;
  readonly contents: readonly string[];
}

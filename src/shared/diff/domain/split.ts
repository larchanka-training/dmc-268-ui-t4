import { type DiffHunk, type DiffLine } from "./types";

/** One row of the side-by-side view: the old file on the left, the new one on the right. */
export interface SplitRow {
  readonly left: DiffLine | null;
  readonly right: DiffLine | null;
}

/**
 * Lays the lines of a hunk out in two columns.
 *
 * Removed and added lines are paired inside the block they appear in, so the first removed
 * line sits next to the first added line that replaces it. A context line ends the block
 * and fills both columns, which keeps a deletion at the top of a hunk from pairing with an
 * unrelated insertion at the bottom.
 */
export function toSplitRows(hunk: DiffHunk): SplitRow[] {
  const rows: SplitRow[] = [];
  let removed: DiffLine[] = [];
  let added: DiffLine[] = [];

  const flush = () => {
    const height = Math.max(removed.length, added.length);

    for (let index = 0; index < height; index += 1) {
      rows.push({
        left: removed[index] ?? null,
        right: added[index] ?? null,
      });
    }

    removed = [];
    added = [];
  };

  for (const line of hunk.lines) {
    if (line.type === "removed") {
      removed.push(line);
      continue;
    }

    if (line.type === "added") {
      added.push(line);
      continue;
    }

    flush();
    rows.push({ left: line, right: line });
  }

  flush();

  return rows;
}

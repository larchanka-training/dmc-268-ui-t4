import { type DiffHunk } from "./types";

/**
 * One coloured piece of a line. The style is a CSS declaration block rather than a single
 * colour, because the highlighter resolves both themes at once and hands back custom
 * properties the stylesheet picks from.
 */
export interface HighlightToken {
  readonly content: string;
  readonly style?: Readonly<Record<string, string>>;
}

export type HighlightedLine = readonly HighlightToken[];

export interface HunkSideText {
  /** Indexes into `hunk.lines`, in the order this side shows them. */
  readonly lineIndexes: readonly number[];
  /** The side as whole text, which is what a highlighter needs to see. */
  readonly text: string;
}

export interface HunkSides {
  readonly old: HunkSideText;
  readonly new: HunkSideText;
}

/**
 * Rebuilds the two versions of the code a hunk describes.
 *
 * Highlighting a diff line on its own colours it wrongly: one line of a multi-line string
 * or comment looks like ordinary code. So each side is reassembled into continuous text,
 * highlighted as a whole, and the result is put back on the lines it came from.
 */
export function hunkSides(hunk: DiffHunk): HunkSides {
  const oldIndexes: number[] = [];
  const newIndexes: number[] = [];

  hunk.lines.forEach((line, index) => {
    if (line.type !== "added") {
      oldIndexes.push(index);
    }

    if (line.type !== "removed") {
      newIndexes.push(index);
    }
  });

  const textOf = (indexes: readonly number[]): string =>
    indexes.map((index) => hunk.lines[index]?.content ?? "").join("\n");

  return {
    old: { lineIndexes: oldIndexes, text: textOf(oldIndexes) },
    new: { lineIndexes: newIndexes, text: textOf(newIndexes) },
  };
}

export interface SideTokens {
  readonly old?: readonly HighlightedLine[];
  readonly new?: readonly HighlightedLine[];
}

/**
 * Spreads highlighted lines back over the hunk, one entry per hunk line.
 *
 * A side whose line count does not match what it was given is ignored: colours shifted by
 * one line are worse than no colours at all. Lines with no tokens stay plain.
 */
export function applyTokens(
  sides: HunkSides,
  tokens: SideTokens,
  lineCount: number,
): (HighlightedLine | null)[] {
  const result: (HighlightedLine | null)[] = Array.from(
    { length: lineCount },
    () => null,
  );

  const place = (
    side: HunkSideText,
    lines: readonly HighlightedLine[] | undefined,
  ) => {
    if (lines?.length !== side.lineIndexes.length) {
      return;
    }

    side.lineIndexes.forEach((lineIndex, position) => {
      result[lineIndex] = lines[position] ?? null;
    });
  };

  // The new side is placed second on purpose: a context line exists on both, and the file
  // as it stands after the change is the version the reader is looking at.
  place(sides.old, tokens.old);
  place(sides.new, tokens.new);

  return result;
}

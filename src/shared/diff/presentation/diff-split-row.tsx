import { cn } from "cn";
import { type ReactNode } from "react";

import { type HighlightedLine } from "../domain/highlight";
import { type SplitRow } from "../domain/split";
import { type DiffLine } from "../domain/types";

import { LineContent } from "./line-content";

const CELL_STYLES: Record<DiffLine["type"], string> = {
  context: "bg-diff-context-bg",
  added: "bg-diff-added-bg",
  removed: "bg-diff-removed-bg",
};

/** A missing counterpart is not "unchanged"; it is nothing, and it should read that way. */
const MISSING_CELL_STYLE = "bg-surface-muted";

const MARKERS: Record<DiffLine["type"], string> = {
  context: " ",
  added: "+",
  removed: "-",
};

export interface DiffSplitRowProps {
  readonly row: SplitRow;
  readonly leftTokens?: HighlightedLine | null;
  readonly rightTokens?: HighlightedLine | null;
  /** Side the reviewer's comment is anchored to, when it belongs to this row. */
  readonly commentedSide?: "old" | "new";
  readonly anchorId?: string;
  readonly children?: ReactNode;
}

/** One row of the side-by-side view: the old file on the left, the new one on the right. */
export function DiffSplitRow({
  row,
  leftTokens,
  rightTokens,
  commentedSide,
  anchorId,
  children,
}: DiffSplitRowProps) {
  const side = (
    line: DiffLine | null,
    tokens: HighlightedLine | null | undefined,
    isCommented: boolean,
  ) => {
    const styles = line === null ? MISSING_CELL_STYLE : CELL_STYLES[line.type];

    return (
      <>
        <td
          className={cn(
            styles,
            "w-12 min-w-12 border-r border-border px-2 text-right text-content-muted tabular-nums select-none",
          )}
        >
          {(line === null
            ? ""
            : ((line.type === "removed" ? line.oldLine : line.newLine) ??
              "")) || ""}
        </td>
        <td
          className={cn(
            styles,
            "w-4 min-w-4 pl-2 text-content-muted select-none",
            isCommented && "ring-2 ring-severity-high ring-inset",
          )}
        >
          {line === null ? "" : MARKERS[line.type]}
        </td>
        <td
          className={cn(
            styles,
            "w-1/2 py-0.5 pr-3",
            isCommented && "ring-2 ring-severity-high ring-inset",
          )}
        >
          {line === null ? null : (
            <LineContent content={line.content} tokens={tokens} />
          )}
        </td>
      </>
    );
  };

  return (
    <>
      <tr id={anchorId} className="scroll-mt-24 font-mono text-xs leading-5">
        {side(row.left, leftTokens, commentedSide === "old")}
        {side(row.right, rightTokens, commentedSide === "new")}
      </tr>
      {children ? (
        <tr>
          <td colSpan={6} className="bg-surface-muted p-0">
            {children}
          </td>
        </tr>
      ) : null}
    </>
  );
}

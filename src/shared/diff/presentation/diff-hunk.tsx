import { type ReactNode } from "react";

import { lineNumberOnSide, positionAnchorId } from "../domain/position";
import { toSplitRows } from "../domain/split";
import {
  type ContextGap,
  type DiffHunk as DiffHunkModel,
  type DiffLine as DiffLineModel,
  type DiffPosition,
  type ExpandDirection,
} from "../domain/types";

import { DiffLine } from "./diff-line";
import { DiffSplitRow } from "./diff-split-row";
import { type DiffViewMode } from "./diff-view-mode";
import { ExpandContextRow } from "./expand-context-row";

export interface DiffHunkProps {
  readonly hunk: DiffHunkModel;
  readonly filePath: string;
  readonly mode?: DiffViewMode;
  /** Gaps rendered above and below this hunk. */
  readonly gapAbove?: ContextGap;
  readonly gapBelow?: ContextGap;
  readonly loadingGapId?: string | null;
  readonly onExpand?: (gap: ContextGap, direction: ExpandDirection) => void;
  /** Position of the reviewer's comment, when it lands inside this hunk. */
  readonly commentPosition?: DiffPosition;
  readonly comment?: ReactNode;
}

export function DiffHunk({
  hunk,
  filePath,
  mode = "unified",
  gapAbove,
  gapBelow,
  loadingGapId = null,
  onExpand,
  commentPosition,
  comment,
}: DiffHunkProps) {
  const noop = () => undefined;
  const columnCount = mode === "split" ? 6 : 4;

  const isCommented = (line: DiffLineModel) =>
    lineNumberOnSide(line, commentPosition?.side ?? "new") ===
    commentPosition?.line;

  const anchorFor = (path: string) =>
    commentPosition === undefined
      ? undefined
      : positionAnchorId({ ...commentPosition, path });

  return (
    <tbody>
      {gapAbove ? (
        <ExpandContextRow
          gap={gapAbove}
          columnCount={columnCount}
          isLoading={loadingGapId === gapAbove.id}
          onExpand={onExpand ?? noop}
        />
      ) : null}

      {hunk.header === null ? null : (
        <tr className="bg-surface-muted text-content-muted">
          <td colSpan={columnCount} className="px-3 py-1 font-mono text-xs">
            {`@@ -${String(hunk.oldStart)},${String(hunk.oldLines)} +${String(hunk.newStart)},${String(hunk.newLines)} @@ ${hunk.header}`}
          </td>
        </tr>
      )}

      {mode === "split"
        ? toSplitRows(hunk).map((row, index) => {
            const commentedLine = [row.left, row.right].find(
              (line) => line !== null && isCommented(line),
            );

            return (
              <DiffSplitRow
                key={`${hunk.id}-split-${String(index)}`}
                row={row}
                {...(commentedLine === undefined || commentedLine === null
                  ? {}
                  : {
                      commentedSide: commentPosition?.side,
                      anchorId: anchorFor(filePath),
                    })}
              >
                {commentedLine === undefined || commentedLine === null
                  ? null
                  : comment}
              </DiffSplitRow>
            );
          })
        : hunk.lines.map((line, index) => {
            const commented = isCommented(line);

            return (
              <DiffLine
                key={`${hunk.id}-${String(index)}`}
                line={line}
                isHighlighted={commented}
                {...(commented ? { anchorId: anchorFor(filePath) } : {})}
              >
                {commented ? comment : null}
              </DiffLine>
            );
          })}

      {gapBelow ? (
        <ExpandContextRow
          gap={gapBelow}
          columnCount={columnCount}
          isLoading={loadingGapId === gapBelow.id}
          onExpand={onExpand ?? noop}
        />
      ) : null}
    </tbody>
  );
}

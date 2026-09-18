import { type ReactNode } from "react";

import { lineNumberOnSide, positionAnchorId } from "../domain/position";
import {
  type ContextGap,
  type DiffHunk as DiffHunkModel,
  type DiffPosition,
  type ExpandDirection,
} from "../domain/types";

import { DiffLine } from "./diff-line";
import { ExpandContextRow } from "./expand-context-row";

export interface DiffHunkProps {
  readonly hunk: DiffHunkModel;
  readonly filePath: string;
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
  gapAbove,
  gapBelow,
  loadingGapId = null,
  onExpand,
  commentPosition,
  comment,
}: DiffHunkProps) {
  const noop = () => undefined;

  return (
    <tbody>
      {gapAbove ? (
        <ExpandContextRow
          gap={gapAbove}
          isLoading={loadingGapId === gapAbove.id}
          onExpand={onExpand ?? noop}
        />
      ) : null}

      {hunk.header === null ? null : (
        <tr className="bg-surface-muted text-content-muted">
          <td colSpan={4} className="px-3 py-1 font-mono text-xs">
            {`@@ -${String(hunk.oldStart)},${String(hunk.oldLines)} +${String(hunk.newStart)},${String(hunk.newLines)} @@ ${hunk.header}`}
          </td>
        </tr>
      )}

      {hunk.lines.map((line, index) => {
        const isCommented =
          lineNumberOnSide(line, commentPosition?.side ?? "new") ===
          commentPosition?.line;

        return (
          <DiffLine
            key={`${hunk.id}-${String(index)}`}
            line={line}
            isHighlighted={isCommented}
            anchorId={
              isCommented
                ? positionAnchorId({ ...commentPosition, path: filePath })
                : undefined
            }
          >
            {isCommented ? comment : null}
          </DiffLine>
        );
      })}

      {gapBelow ? (
        <ExpandContextRow
          gap={gapBelow}
          isLoading={loadingGapId === gapBelow.id}
          onExpand={onExpand ?? noop}
        />
      ) : null}
    </tbody>
  );
}

import { type ReactNode } from "react";

import { getContextGaps } from "../domain/context";
import {
  type ContextGap,
  type DiffFile,
  type DiffPosition,
  type ExpandDirection,
} from "../domain/types";

import { DiffFileHeader } from "./diff-file-header";
import { DiffHunk } from "./diff-hunk";

export interface DiffSnippetProps {
  readonly file: DiffFile;
  /** Length of the new file, when known; it bounds how far the context can unfold. */
  readonly fileLineCount?: number;
  /** Position of the reviewer's comment inside this snippet. */
  readonly commentPosition?: DiffPosition;
  readonly comment?: ReactNode;
  readonly externalUrl?: string;
  readonly loadingGapId?: string | null;
  readonly onExpand?: (gap: ContextGap, direction: ExpandDirection) => void;
}

/**
 * A file fragment with its hunks, unfoldable context and, optionally, the reviewer's
 * comment anchored to one of the lines.
 */
export function DiffSnippet({
  file,
  fileLineCount,
  commentPosition,
  comment,
  externalUrl,
  loadingGapId = null,
  onExpand,
}: DiffSnippetProps) {
  const gaps = getContextGaps(file.hunks, fileLineCount);
  const gapBefore = (hunkId: string): ContextGap | undefined =>
    gaps.find((gap) => gap.nextHunkId === hunkId);
  const trailingGap = gaps.find((gap) => gap.nextHunkId === null);
  const lastHunkId = file.hunks.at(-1)?.id;

  return (
    <div className="overflow-hidden rounded-md border border-border bg-surface">
      <DiffFileHeader
        path={file.path}
        oldPath={file.oldPath}
        status={file.status}
        externalUrl={externalUrl}
      />
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          {file.hunks.map((hunk) => (
            <DiffHunk
              key={hunk.id}
              hunk={hunk}
              filePath={file.path}
              gapAbove={gapBefore(hunk.id)}
              gapBelow={hunk.id === lastHunkId ? trailingGap : undefined}
              loadingGapId={loadingGapId}
              onExpand={onExpand}
              commentPosition={commentPosition}
              comment={comment}
            />
          ))}
        </table>
      </div>
    </div>
  );
}

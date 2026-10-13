import { type ReactNode } from "react";

import { getContextGaps } from "../domain/context";
import { languageForPath } from "../domain/language";
import {
  type ContextGap,
  type DiffFile,
  type DiffPosition,
  type ExpandDirection,
} from "../domain/types";

import { DiffFileHeader } from "./diff-file-header";
import { DiffHunk } from "./diff-hunk";
import { type DiffViewMode } from "./diff-view-mode";

export interface DiffSnippetProps {
  readonly file: DiffFile;
  /** Length of the new file, when known; it bounds how far the context can unfold. */
  readonly fileLineCount?: number;
  /** Position of the reviewer's comment inside this snippet. */
  readonly commentPosition?: DiffPosition;
  readonly comment?: ReactNode;
  readonly externalUrl?: string;
  readonly mode?: DiffViewMode;
  /** Set to false to keep the file header out, when the caller shows its own. */
  readonly showFileHeader?: boolean;
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
  mode = "unified",
  showFileHeader = true,
  loadingGapId = null,
  onExpand,
}: DiffSnippetProps) {
  const gaps = getContextGaps(file.hunks, fileLineCount);
  const gapBefore = (hunkId: string): ContextGap | undefined =>
    gaps.find((gap) => gap.nextHunkId === hunkId);
  const trailingGap = gaps.find((gap) => gap.nextHunkId === null);
  const lastHunkId = file.hunks.at(-1)?.id;
  const language = languageForPath(file.path);

  return (
    <div className="overflow-hidden rounded-md border border-border bg-surface">
      {showFileHeader ? (
        <DiffFileHeader
          path={file.path}
          oldPath={file.oldPath}
          status={file.status}
          externalUrl={externalUrl}
        />
      ) : null}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          {file.hunks.map((hunk) => (
            <DiffHunk
              key={hunk.id}
              hunk={hunk}
              filePath={file.path}
              mode={mode}
              language={language}
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

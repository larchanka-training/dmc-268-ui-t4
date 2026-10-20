import { type ReactNode } from "react";

import { positionAnchorId } from "@/shared/diff/domain/position";
import {
  type ContextGap,
  type ExpandDirection,
} from "@/shared/diff/domain/types";
import { DiffSnippet } from "@/shared/diff/presentation/diff-snippet";
import { useDiffViewMode } from "@/shared/diff/presentation/diff-view-mode";
import { Skeleton } from "@/shared/ui/skeleton";

import { type Finding } from "../../domain/finding";
import { useFindingContext } from "../queries";
import {
  type HunkExpansion,
  useRunDetailsStore,
  withExpandedContext,
} from "../run-details-store";

export interface FindingCodeProps {
  readonly runId: string;
  readonly finding: Finding;
  /** The comment itself, drawn under its line or, without the code, on its own. */
  readonly comment: ReactNode;
  readonly onExpand: (
    finding: Finding,
    gap: ContextGap,
    direction: ExpandDirection,
  ) => void;
}

/** Stable empty value: returning a fresh [] from the selector would re-render forever. */
const NO_EXPANSIONS: readonly HunkExpansion[] = [];

/**
 * The diff a finding points at, fetched on its own because the API rebuilds it from the
 * forge. When that is no longer possible (an old commit, a removed installation) or the
 * line is not in the diff, the comment is shown with its `path:line` and the link to
 * GitHub instead of being anchored to the wrong code.
 */
export function FindingCode({
  runId,
  finding,
  comment,
  onExpand,
}: FindingCodeProps) {
  const context = useFindingContext(runId, finding);
  const expansions =
    useRunDetailsStore((state) => state.expansions[finding.id]) ??
    NO_EXPANSIONS;
  const loadingGapId = useRunDetailsStore((state) => state.loadingGapId);
  const mode = useDiffViewMode((state) => state.mode);

  if (context.isPending) {
    return <Skeleton className="h-32 w-full" />;
  }

  if (context.isError || context.data === null) {
    return (
      <div
        id={positionAnchorId(finding.position)}
        className="overflow-hidden rounded-md border border-border"
      >
        <p className="bg-surface-muted px-4 py-2 text-xs text-content-muted">
          The code for this comment is no longer available.
        </p>
        {comment}
      </div>
    );
  }

  return (
    <DiffSnippet
      file={withExpandedContext(context.data.snippet, expansions)}
      mode={mode}
      showFileHeader={false}
      fileLineCount={context.data.fileLineCount}
      commentPosition={finding.position}
      loadingGapId={loadingGapId}
      onExpand={(gap, direction) => {
        onExpand(finding, gap, direction);
      }}
      comment={comment}
    />
  );
}

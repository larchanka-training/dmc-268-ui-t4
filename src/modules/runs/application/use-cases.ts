import { expandRange } from "@/shared/diff/domain/context";
import { isPositionInDiff } from "@/shared/diff/domain/position";
import {
  type ContextGap,
  type ExpandDirection,
  type ExpandedLines,
} from "@/shared/diff/domain/types";

import { type RunFilters } from "../domain/filters";
import {
  type Finding,
  type FindingContext,
  compareBySeverity,
} from "../domain/finding";

import {
  type FileLinesQuery,
  type RunDetailsResult,
  type RunHistoryPage,
  type RunsRepository,
} from "./ports";

export interface RunsDependencies {
  readonly runs: RunsRepository;
}

export function listActiveRuns(
  { runs }: RunsDependencies,
  signal?: AbortSignal,
) {
  return runs.listActiveRuns(signal);
}

export function listRunHistory(
  { runs }: RunsDependencies,
  params: { filters: RunFilters; cursor?: string },
  signal?: AbortSignal,
): Promise<RunHistoryPage> {
  return runs.listRunHistory(params, signal);
}

/** Findings arrive grouped by file; the most severe ones come first inside a file. */
export async function getRunDetails(
  { runs }: RunsDependencies,
  runId: string,
  signal?: AbortSignal,
): Promise<RunDetailsResult> {
  const result = await runs.getRunDetails(runId, signal);

  return {
    run: result.run,
    findings: [...result.findings].sort(compareBySeverity),
  };
}

/** Live progress of one run; the returned function stops it. */
export function watchRun(
  { runs }: RunsDependencies,
  runId: string,
  onChange: () => void,
): () => void {
  return runs.watchRun(runId, onChange);
}

/**
 * The code a finding points at, or null when it cannot be drawn: the snippet does not
 * contain the commented line, so anchoring the comment to it would mislead (see "Diff
 * Position Mapping" in the review pipeline). The caller falls back to `path:line`.
 */
export async function getFindingContext(
  { runs }: RunsDependencies,
  runId: string,
  finding: Finding,
  signal?: AbortSignal,
): Promise<FindingContext | null> {
  const context = await runs.getFindingContext(runId, finding.id, signal);

  return isPositionInDiff(context.snippet.hunks, finding.position)
    ? context
    : null;
}

export interface ExpandContextParams {
  readonly runId: string;
  readonly path: string;
  readonly gap: ContextGap;
  readonly direction: ExpandDirection;
}

/**
 * Turns an unfold request into a line range and fetches it. Returns null when there is
 * nothing left to reveal, so the caller can leave the UI untouched.
 */
export async function expandContext(
  { runs }: RunsDependencies,
  { runId, path, gap, direction }: ExpandContextParams,
  signal?: AbortSignal,
): Promise<ExpandedLines | null> {
  const range = expandRange(gap, direction);

  if (range === null) {
    return null;
  }

  const query: FileLinesQuery = { runId, path, from: range.from, to: range.to };
  const contents = await runs.getFileLines(query, signal);

  return contents.length === 0 ? null : { from: range.from, contents };
}

import { type RunFilters } from "../domain/filters";
import { type Finding, type FindingContext } from "../domain/finding";
import { type Run, type RunDetails } from "../domain/run";

export interface RunHistoryPage {
  readonly items: readonly Run[];
  /** Cursor for the next page, null when the history ends. */
  readonly nextCursor: string | null;
}

export interface RunDetailsResult {
  readonly run: RunDetails;
  readonly findings: readonly Finding[];
}

export interface FileLinesQuery {
  readonly runId: string;
  readonly path: string;
  /** Inclusive range in new-file numbering. */
  readonly from: number;
  readonly to: number;
}

/**
 * The port the application layer depends on. The HTTP adapter lives in infrastructure,
 * and tests can hand in an in-memory implementation.
 */
export interface RunsRepository {
  listActiveRuns: (signal?: AbortSignal) => Promise<readonly Run[]>;
  listRunHistory: (
    params: { filters: RunFilters; cursor?: string },
    signal?: AbortSignal,
  ) => Promise<RunHistoryPage>;
  getRunDetails: (
    runId: string,
    signal?: AbortSignal,
  ) => Promise<RunDetailsResult>;
  /**
   * The diff around one finding. Rejects when the forge can no longer rebuild it (an old
   * commit, a removed installation); the page then shows the finding without its code.
   */
  getFindingContext: (
    runId: string,
    findingId: string,
    signal?: AbortSignal,
  ) => Promise<FindingContext>;
  /** Unchanged lines around a hunk, used to unfold context. */
  getFileLines: (
    query: FileLinesQuery,
    signal?: AbortSignal,
  ) => Promise<readonly string[]>;
  /**
   * Calls `onChange` whenever the run moves on (a stage starts or ends, the status
   * changes) until it finishes. Returns the function that stops watching.
   */
  watchRun: (runId: string, onChange: () => void) => () => void;
}

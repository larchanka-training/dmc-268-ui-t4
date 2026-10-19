/** A review run: one execution of the review agent against one pull request. */

/**
 * What the console shows for a run. The API keeps the job status and the pipeline stage
 * apart (`status` + `stage`); while a job is PROCESSING the console shows its stage, and
 * `processing` when the stage is not known (the list carries none).
 */
export type RunStatus =
  | "queued"
  | "processing"
  | "collecting_context"
  | "reviewing"
  | "validating"
  | "publishing"
  | "retrying"
  | "completed"
  | "failed"
  | "superseded"
  | "skipped";

/** Statuses in which the agent is still working, so the list keeps polling. */
export const ACTIVE_RUN_STATUSES = [
  "queued",
  "processing",
  "collecting_context",
  "reviewing",
  "validating",
  "publishing",
  "retrying",
] as const satisfies readonly RunStatus[];

export type ActiveRunStatus = (typeof ACTIVE_RUN_STATUSES)[number];

/** The pipeline stages, in the order the agent goes through them. */
export const RUN_STAGES = [
  "collecting_context",
  "reviewing",
  "validating",
  "publishing",
] as const satisfies readonly ActiveRunStatus[];

export type RunStageName = (typeof RUN_STAGES)[number];

export interface RunStage {
  readonly name: RunStageName;
  readonly startedAt: string;
  /** Null while any step of the stage is still running. */
  readonly finishedAt: string | null;
  /** A step of this stage failed in the latest attempt. */
  readonly failed: boolean;
}

export interface PullRequestRef {
  /** Full name on the forge, for example "acme/payments". */
  readonly repository: string;
  readonly number: number;
  readonly title: string;
  readonly url: string;
  readonly author: string;
  readonly headRef: string;
  readonly baseRef: string;
  readonly headSha: string;
}

export interface Run {
  readonly id: string;
  readonly pullRequest: PullRequestRef;
  readonly status: RunStatus;
  readonly createdAt: string;
  readonly finishedAt: string | null;
  readonly findingCount: number;
}

export interface RunDetails extends Run {
  readonly stages: readonly RunStage[];
  /** The summary comment the agent posted on the pull request. */
  readonly summary: string | null;
  /** Why the run failed or was skipped; null otherwise. */
  readonly failureReason: string | null;
}

export function isActiveStatus(status: RunStatus): status is ActiveRunStatus {
  return (ACTIVE_RUN_STATUSES as readonly RunStatus[]).includes(status);
}

export function hasActiveRun(runs: readonly Run[]): boolean {
  return runs.some((run) => isActiveStatus(run.status));
}

export function repositoryName(pullRequest: PullRequestRef): string {
  return pullRequest.repository;
}

/** How long the run took, or how long it has been running so far. */
export function runDuration(run: Run, now: Date = new Date()): number {
  const end =
    run.finishedAt === null
      ? now.getTime()
      : new Date(run.finishedAt).getTime();

  return Math.max(0, end - new Date(run.createdAt).getTime());
}

export function stageDuration(stage: RunStage, now: Date = new Date()): number {
  const end =
    stage.finishedAt === null
      ? now.getTime()
      : new Date(stage.finishedAt).getTime();

  return Math.max(0, end - new Date(stage.startedAt).getTime());
}

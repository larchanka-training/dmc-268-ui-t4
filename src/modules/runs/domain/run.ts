/** A review run: one execution of the review agent against one pull request. */

export type RunStatus =
  | "queued"
  | "collecting_context"
  | "reviewing"
  | "validating"
  | "publishing"
  | "completed"
  | "failed";

/** Statuses in which the agent is still working, so the list keeps polling. */
export const ACTIVE_RUN_STATUSES = [
  "queued",
  "collecting_context",
  "reviewing",
  "validating",
  "publishing",
] as const satisfies readonly RunStatus[];

export type ActiveRunStatus = (typeof ACTIVE_RUN_STATUSES)[number];

export type RunStageName = Exclude<ActiveRunStatus, "queued">;

/** The pipeline stages, in the order the agent goes through them. */
export const RUN_STAGES = [
  "collecting_context",
  "reviewing",
  "validating",
  "publishing",
] as const satisfies readonly RunStageName[];

export interface RunStage {
  readonly name: RunStageName;
  readonly startedAt: string;
  readonly finishedAt: string | null;
}

export interface PullRequestRef {
  readonly owner: string;
  readonly repo: string;
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
  /** Present when the run failed. */
  readonly failureReason: string | null;
}

export function isActiveStatus(status: RunStatus): status is ActiveRunStatus {
  return (ACTIVE_RUN_STATUSES as readonly RunStatus[]).includes(status);
}

export function hasActiveRun(runs: readonly Run[]): boolean {
  return runs.some((run) => isActiveStatus(run.status));
}

export function repositoryName(pullRequest: PullRequestRef): string {
  return `${pullRequest.owner}/${pullRequest.repo}`;
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

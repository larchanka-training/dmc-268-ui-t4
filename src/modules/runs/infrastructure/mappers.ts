import { isPositionInDiff } from "@/shared/diff/domain/position";
import {
  type DiffFile,
  type DiffHunk,
  type DiffLine,
} from "@/shared/diff/domain/types";

import { type Finding } from "../domain/finding";
import {
  RUN_STAGES,
  type Run,
  type RunDetails,
  type RunStage,
  type RunStageName,
  type RunStatus,
} from "../domain/run";

import {
  type DiffFileDto,
  type FindingDto,
  type JobDetailDto,
  type JobDto,
  type JobStepDto,
} from "./dto";

function toDiffLine(
  dto: DiffFileDto["hunks"][number]["lines"][number],
): DiffLine {
  return {
    type: dto.type,
    oldLine: dto.old_line,
    newLine: dto.new_line,
    content: dto.content,
  };
}

function toDiffHunk(dto: DiffFileDto["hunks"][number]): DiffHunk {
  return {
    id: dto.id,
    oldStart: dto.old_start,
    oldLines: dto.old_lines,
    newStart: dto.new_start,
    newLines: dto.new_lines,
    header: dto.header,
    lines: dto.lines.map(toDiffLine),
  };
}

export function toDiffFile(dto: DiffFileDto): DiffFile {
  return {
    path: dto.path,
    oldPath: dto.old_path,
    status: dto.status,
    hunks: dto.hunks.map(toDiffHunk),
  };
}

/** The backend's pipeline steps, grouped into the stages of the progress bar. */
const STAGE_OF_STEP: Record<JobStepDto["step"], RunStageName> = {
  CLAIMED: "collecting_context",
  AUTH: "collecting_context",
  FETCH_DIFF: "collecting_context",
  BUILD_CONTEXT: "collecting_context",
  REDACT: "collecting_context",
  GATE: "reviewing",
  LLM_CALL: "reviewing",
  POSTPROCESS: "validating",
  POST_FEEDBACK: "publishing",
  // Metering runs after the comments are up; to the user it is still publishing.
  METER: "publishing",
};

/** Steps of the latest attempt only: a retry starts the pipeline over. */
function latestAttempt(steps: readonly JobStepDto[]): JobStepDto[] {
  const attempt = Math.max(0, ...steps.map((step) => step.attempt));

  return steps.filter((step) => step.attempt === attempt);
}

/**
 * One stage per group of steps, in pipeline order. A stage is finished once all of its
 * steps are; it starts with the earliest of them.
 */
export function toRunStages(steps: readonly JobStepDto[]): RunStage[] {
  const latest = latestAttempt(steps);

  return RUN_STAGES.flatMap((name) => {
    const inStage = latest.filter((step) => STAGE_OF_STEP[step.step] === name);
    const [first, ...rest] = inStage;

    if (first === undefined) {
      return [];
    }

    const startedAt = rest.reduce(
      (min, step) => (step.started_at < min ? step.started_at : min),
      first.started_at,
    );
    const finishedAt = inStage.every((step) => step.finished_at !== null)
      ? inStage.reduce(
          (max, step) =>
            step.finished_at !== null && step.finished_at > max
              ? step.finished_at
              : max,
          first.finished_at ?? startedAt,
        )
      : null;

    return [{ name, startedAt, finishedAt }];
  });
}

/** A processing job is in the stage of the step it started last. */
function toRunStatus(
  status: JobDto["status"],
  steps: readonly JobStepDto[],
): RunStatus {
  switch (status) {
    case "QUEUED":
    case "RETRYING":
      return "queued";
    case "PROCESSING": {
      const current = latestAttempt(steps).at(-1);

      return current === undefined
        ? "collecting_context"
        : STAGE_OF_STEP[current.step];
    }
    case "COMPLETED":
      return "completed";
    case "FAILED":
    case "SUPERSEDED":
    case "SKIPPED":
      return "failed";
  }
}

function toFailureReason(dto: JobDto): string | null {
  switch (dto.status) {
    case "FAILED":
      return dto.error_kind ?? "The review failed";
    case "SUPERSEDED":
      return "Superseded by a newer push";
    case "SKIPPED":
      return dto.error_kind === null ? "Skipped" : `Skipped: ${dto.error_kind}`;
    case "QUEUED":
    case "PROCESSING":
    case "RETRYING":
    case "COMPLETED":
      return null;
  }
}

/**
 * The list answer carries no steps, so a processing job shows the first stage there;
 * the details page knows the exact one.
 */
export function toRun(dto: JobDto, steps: readonly JobStepDto[] = []): Run {
  const [owner = "", repo = ""] = dto.pull_request.repo_full_name.split("/");

  return {
    id: dto.id,
    status: toRunStatus(dto.status, steps),
    createdAt: dto.created_at,
    finishedAt: dto.finished_at,
    findingCount: dto.finding_count,
    pullRequest: {
      owner,
      repo,
      number: dto.pull_request.number,
      title: dto.pull_request.title,
      url: dto.pull_request.url,
      author: dto.pull_request.author,
      headRef: dto.pull_request.head_ref,
      baseRef: dto.pull_request.base_ref,
      headSha: dto.pull_request.head_sha,
    },
  };
}

export function toRunDetails(dto: JobDetailDto): RunDetails {
  return {
    ...toRun(dto, dto.steps),
    stages: toRunStages(dto.steps),
    summary: dto.summary,
    failureReason: toFailureReason(dto),
  };
}

export function toFinding(dto: FindingDto): Finding {
  return {
    id: dto.id,
    position: {
      path: dto.file_path,
      line: dto.line,
      side: dto.side === "LEFT" ? "old" : "new",
    },
    severity: dto.severity,
    category: dto.category,
    message: dto.message,
    suggestion: dto.suggestion,
    publishedAt: dto.published_at,
    externalUrl: dto.external_url,
    snippet: toDiffFile(dto.snippet),
    fileLineCount: dto.file_line_count,
  };
}

/**
 * Drops findings whose position is not part of the snippet they came with. A comment
 * anchored outside the diff cannot be rendered against a line, so showing it would be
 * worse than leaving it out (see "Diff Position Mapping" in the review pipeline).
 */
export function toValidFindings(dtos: readonly FindingDto[]): Finding[] {
  return dtos
    .map(toFinding)
    .filter((finding) =>
      isPositionInDiff(finding.snippet.hunks, finding.position),
    );
}

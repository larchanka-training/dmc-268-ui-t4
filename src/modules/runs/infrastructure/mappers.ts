import { type DiffFile, type DiffHunk } from "@/shared/diff/domain/types";
import { httpsUrlOrNull } from "@/shared/lib/url";

import { type Finding, type FindingContext } from "../domain/finding";
import {
  RUN_STAGES,
  type Run,
  type RunDetails,
  type RunStage,
  type RunStatus,
} from "../domain/run";
import { type ReviewRules, toRulesStatus } from "../domain/run-rules";

import {
  type FindingContextDto,
  type FindingDto,
  type JobDetailDto,
  type JobDto,
  type JobStageDto,
  type JobStatusDto,
  type JobStepDto,
  type RulesDto,
} from "./dto";

function toDiffHunk(dto: FindingContextDto["hunks"][number]): DiffHunk {
  return {
    id: dto.id,
    oldStart: dto.old_start,
    oldLines: dto.old_lines,
    newStart: dto.new_start,
    newLines: dto.new_lines,
    header: dto.header,
    lines: dto.lines.map((line) => ({
      type: line.type,
      oldLine: line.old_line,
      newLine: line.new_line,
      content: line.content,
    })),
  };
}

function toDiffFile(dto: FindingContextDto): DiffFile {
  return {
    path: dto.path,
    oldPath: dto.old_path,
    status: dto.status,
    hunks: dto.hunks.map(toDiffHunk),
  };
}

/**
 * The API keeps the job status and the pipeline stage apart; the console shows one badge.
 * A PROCESSING job shows its stage when the response carries one (the job detail does,
 * the list does not), and `processing` otherwise.
 */
export function toRunStatus(
  status: JobStatusDto,
  stage: JobStageDto | null = null,
): RunStatus {
  switch (status) {
    case "QUEUED":
      return "queued";
    case "PROCESSING":
      return stage ?? "processing";
    case "RETRYING":
      return "retrying";
    case "COMPLETED":
      return "completed";
    case "FAILED":
      return "failed";
    case "SUPERSEDED":
      return "superseded";
    case "SKIPPED":
      return "skipped";
  }
}

/**
 * Folds the pipeline steps into the console's four stages. Only the latest attempt
 * counts: a retry starts the pipeline over, and the steps of the attempt before it would
 * stretch every stage across the wait between them.
 */
export function toStages(steps: readonly JobStepDto[]): RunStage[] {
  const latest = Math.max(-1, ...steps.map((step) => step.attempt));
  const current = steps.filter((step) => step.attempt === latest);

  return RUN_STAGES.flatMap((name) => {
    const inStage = current.filter((step) => step.stage === name);
    const [first] = inStage;

    if (first === undefined) {
      return [];
    }

    const startedAt = inStage.reduce(
      (earliest, step) =>
        Date.parse(step.started_at) < Date.parse(earliest)
          ? step.started_at
          : earliest,
      first.started_at,
    );
    let finishedAt: string | null = startedAt;

    for (const step of inStage) {
      const at = step.finished_at ?? null;

      if (at === null) {
        finishedAt = null;
        break;
      }

      if (Date.parse(at) > Date.parse(finishedAt)) {
        finishedAt = at;
      }
    }

    return [
      {
        name,
        startedAt,
        finishedAt,
        failed: inStage.some((step) => step.status === "FAILED"),
      },
    ];
  });
}

export function toRun(dto: JobDto, stage: JobStageDto | null = null): Run {
  const pullRequest = dto.pull_request;

  return {
    id: dto.id,
    status: toRunStatus(dto.status, stage),
    createdAt: dto.created_at,
    finishedAt: dto.finished_at ?? null,
    findingCount: dto.finding_count,
    pullRequest: {
      repository: pullRequest.repo_full_name,
      number: pullRequest.number,
      title: pullRequest.title,
      url: pullRequest.url,
      author: pullRequest.author,
      headRef: pullRequest.head_ref,
      baseRef: pullRequest.base_ref,
      headSha: pullRequest.head_sha,
    },
  };
}

export function toRunDetails(dto: JobDetailDto): RunDetails {
  return {
    ...toRun(dto, dto.stage),
    stages: toStages(dto.steps),
    summary: dto.summary ?? null,
    // The redacted log when the API has one, else the machine-readable reason.
    failureReason: dto.error_log ?? dto.error_kind ?? null,
  };
}

export function toFinding(dto: FindingDto): Finding {
  return {
    id: dto.id,
    position: { path: dto.path, line: dto.line, side: dto.side },
    severity: dto.severity,
    category: dto.category,
    message: dto.message,
    suggestion: dto.suggestion ?? null,
    publishedAt: dto.published_at,
    externalUrl: dto.external_url,
  };
}

export function toFindingContext(dto: FindingContextDto): FindingContext {
  return { snippet: toDiffFile(dto), fileLineCount: dto.file_line_count };
}

export function toReviewRules(dto: RulesDto): ReviewRules {
  return {
    path: dto.path,
    ref: dto.ref,
    status: toRulesStatus(dto.status),
    fileUrl: dto.file_url === null ? null : httpsUrlOrNull(dto.file_url),
    rules: dto.rules,
    droppedSuspicious: dto.dropped_suspicious,
    droppedOverLimit: dto.dropped_over_limit,
  };
}

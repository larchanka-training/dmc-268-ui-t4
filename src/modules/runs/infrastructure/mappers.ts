import { isPositionInDiff } from "@/shared/diff/domain/position";
import {
  type DiffFile,
  type DiffHunk,
  type DiffLine,
} from "@/shared/diff/domain/types";

import { type Finding } from "../domain/finding";
import { type Run, type RunDetails, type RunStage } from "../domain/run";

import {
  type DiffFileDto,
  type FindingDto,
  type RunDetailsDto,
  type RunDto,
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

export function toRun(dto: RunDto): Run {
  return {
    id: dto.id,
    status: dto.status,
    createdAt: dto.created_at,
    finishedAt: dto.finished_at,
    findingCount: dto.finding_count,
    pullRequest: {
      owner: dto.pull_request.owner,
      repo: dto.pull_request.repo,
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

function toStage(dto: RunDetailsDto["stages"][number]): RunStage {
  return {
    name: dto.name,
    startedAt: dto.started_at,
    finishedAt: dto.finished_at,
  };
}

export function toRunDetails(dto: RunDetailsDto): RunDetails {
  return {
    ...toRun(dto),
    stages: dto.stages.map(toStage),
    summary: dto.summary,
    failureReason: dto.failure_reason,
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

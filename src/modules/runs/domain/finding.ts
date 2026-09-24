import { type DiffFile, type DiffPosition } from "@/shared/diff/domain/types";

export type FindingSeverity = "critical" | "high" | "medium" | "low";

export type FindingCategory =
  | "security"
  | "correctness"
  | "concurrency"
  | "performance"
  | "maintainability";

export interface FindingSuggestion {
  readonly before: readonly string[];
  readonly after: readonly string[];
}

/** A review comment the agent published on the pull request. */
export interface Finding {
  readonly id: string;
  readonly position: DiffPosition;
  readonly severity: FindingSeverity;
  readonly category: FindingCategory;
  readonly message: string;
  readonly suggestion: FindingSuggestion | null;
  readonly publishedAt: string;
  /** The comment on GitHub. */
  readonly externalUrl: string;
  /** The part of the diff the comment is anchored to. */
  readonly snippet: DiffFile;
  /** Length of the file at the reviewed revision; bounds how far context can unfold. */
  readonly fileLineCount: number;
}

const SEVERITY_ORDER: Record<FindingSeverity, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

export function compareBySeverity(a: Finding, b: Finding): number {
  return SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity];
}

export function countBySeverity(
  findings: readonly Finding[],
): Record<FindingSeverity, number> {
  const counts: Record<FindingSeverity, number> = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
  };

  for (const finding of findings) {
    counts[finding.severity] += 1;
  }

  return counts;
}

/** Findings are grouped by file, the way a pull request review reads. */
export function groupByFile(
  findings: readonly Finding[],
): [string, Finding[]][] {
  const groups = new Map<string, Finding[]>();

  for (const finding of findings) {
    const path = finding.position.path;
    const existing = groups.get(path);

    if (existing) {
      existing.push(finding);
    } else {
      groups.set(path, [finding]);
    }
  }

  return [...groups.entries()];
}

import { type Finding, type FindingSeverity } from "./finding";

/** Quick filters over the findings of one run; they live in the URL of the run page. */
export interface FindingFilters {
  /** One file of the pull request, or undefined for every file. */
  readonly path?: string;
  /** Severities to keep; empty keeps every severity. */
  readonly severities: readonly FindingSeverity[];
  /** Free-text search over the comment, its suggestion and the file path. */
  readonly query?: string;
}

export const DEFAULT_FINDING_FILTERS: FindingFilters = { severities: [] };

export function hasActiveFindingFilters(filters: FindingFilters): boolean {
  return (
    filters.path !== undefined ||
    filters.severities.length > 0 ||
    normalizedQuery(filters.query) !== ""
  );
}

export function filterFindings(
  findings: readonly Finding[],
  filters: FindingFilters,
): Finding[] {
  const query = normalizedQuery(filters.query);

  return findings.filter(
    (finding) =>
      (filters.path === undefined || finding.position.path === filters.path) &&
      (filters.severities.length === 0 ||
        filters.severities.includes(finding.severity)) &&
      (query === "" || searchableText(finding).includes(query)),
  );
}

/** Adds the severity to the filter, or takes it out when it is already there. */
export function toggleSeverity(
  filters: FindingFilters,
  severity: FindingSeverity,
): FindingFilters {
  return {
    ...filters,
    severities: filters.severities.includes(severity)
      ? filters.severities.filter((candidate) => candidate !== severity)
      : [...filters.severities, severity],
  };
}

/** Every file that has at least one finding, in the order the page lists them. */
export function findingPaths(findings: readonly Finding[]): string[] {
  return [...new Set(findings.map((finding) => finding.position.path))];
}

function normalizedQuery(query: string | undefined): string {
  return (query ?? "").trim().toLowerCase();
}

function searchableText(finding: Finding): string {
  const suggestion =
    finding.suggestion === null ? [] : finding.suggestion.after;

  return [
    finding.message,
    finding.position.path,
    finding.category,
    ...suggestion,
  ]
    .join("\n")
    .toLowerCase();
}

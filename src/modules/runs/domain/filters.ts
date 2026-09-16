import { type RunStatus } from "./run";

export type RunStatusFilter = "all" | "completed" | "failed";

export interface RunFilters {
  readonly status: RunStatusFilter;
  /** "owner/repo", or undefined for every repository. */
  readonly repository?: string;
  readonly author?: string;
  /** ISO dates bounding the history. */
  readonly from?: string;
  readonly to?: string;
  /** Free-text search over the pull request title and number. */
  readonly query?: string;
}

export const DEFAULT_RUN_FILTERS: RunFilters = { status: "all" };

export function statusesForFilter(
  filter: RunStatusFilter,
): readonly RunStatus[] | null {
  switch (filter) {
    case "all":
      return null;
    case "completed":
      return ["completed"];
    case "failed":
      return ["failed"];
  }
}

export function hasActiveFilters(filters: RunFilters): boolean {
  return (
    filters.status !== "all" ||
    filters.repository !== undefined ||
    filters.author !== undefined ||
    filters.from !== undefined ||
    filters.to !== undefined ||
    (filters.query !== undefined && filters.query !== "")
  );
}

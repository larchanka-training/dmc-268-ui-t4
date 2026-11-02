import { cn } from "cn";
import { Search, X } from "lucide-react";

import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";

import {
  type Finding,
  type FindingSeverity,
  countBySeverity,
} from "../../domain/finding";
import {
  DEFAULT_FINDING_FILTERS,
  type FindingFilters,
  findingPaths,
  hasActiveFindingFilters,
  toggleSeverity,
} from "../../domain/finding-filters";

/** Most serious first, the same order as the summary in the header. */
const SEVERITIES: readonly FindingSeverity[] = [
  "critical",
  "high",
  "medium",
  "low",
];

const ACTIVE_STYLES: Record<FindingSeverity, string> = {
  critical: "border-severity-critical/60 bg-severity-critical/15",
  high: "border-severity-high/60 bg-severity-high/15",
  medium: "border-severity-medium/60 bg-severity-medium/20",
  low: "border-severity-low/60 bg-severity-low/15",
};

export interface FindingsFiltersProps {
  /** Every finding of the run, so the options do not shrink as the reader filters. */
  readonly findings: readonly Finding[];
  readonly filters: FindingFilters;
  readonly onChange: (filters: FindingFilters) => void;
}

/** Quick filters above the findings: file, severity and a search over the comments. */
export function FindingsFilters({
  findings,
  filters,
  onChange,
}: FindingsFiltersProps) {
  const counts = countBySeverity(findings);
  const paths = findingPaths(findings);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div
        className="flex flex-wrap gap-1"
        role="group"
        aria-label="Filter by severity"
      >
        {SEVERITIES.filter((severity) => counts[severity] > 0).map(
          (severity) => {
            const isActive = filters.severities.includes(severity);

            return (
              <Button
                key={severity}
                variant="outline"
                size="sm"
                aria-pressed={isActive}
                className={cn(
                  "h-7 gap-1.5",
                  isActive && ACTIVE_STYLES[severity],
                )}
                onClick={() => {
                  onChange(toggleSeverity(filters, severity));
                }}
              >
                <span className="capitalize">{severity}</span>
                <span className="text-content-muted tabular-nums">
                  {counts[severity]}
                </span>
              </Button>
            );
          },
        )}
      </div>

      {paths.length > 1 ? (
        <select
          aria-label="Filter by file"
          className="h-8 max-w-64 truncate rounded-lg border border-input bg-transparent px-2 text-sm"
          value={filters.path ?? ""}
          onChange={(event) => {
            onChange({ ...filters, path: event.target.value || undefined });
          }}
        >
          <option value="">All files</option>
          {paths.map((path) => (
            <option key={path} value={path}>
              {path}
            </option>
          ))}
        </select>
      ) : null}

      <div className="relative">
        <Search
          className="pointer-events-none absolute top-1/2 left-2 size-3.5 -translate-y-1/2 text-content-muted"
          aria-hidden
        />
        <Input
          type="search"
          aria-label="Search comments"
          className="h-8 w-56 pl-7"
          placeholder="Search comments"
          value={filters.query ?? ""}
          onChange={(event) => {
            onChange({ ...filters, query: event.target.value || undefined });
          }}
        />
      </div>

      {hasActiveFindingFilters(filters) ? (
        <Button
          variant="ghost"
          size="sm"
          className="h-8"
          onClick={() => {
            onChange(DEFAULT_FINDING_FILTERS);
          }}
        >
          <X className="size-3" aria-hidden />
          Reset
        </Button>
      ) : null}
    </div>
  );
}

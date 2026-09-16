import { X } from "lucide-react";

import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";

import {
  DEFAULT_RUN_FILTERS,
  type RunFilters,
  type RunStatusFilter,
  hasActiveFilters,
} from "../../domain/filters";

const STATUS_OPTIONS: readonly { value: RunStatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "completed", label: "Completed" },
  { value: "failed", label: "Failed" },
];

export interface RunsFiltersProps {
  readonly filters: RunFilters;
  readonly onChange: (filters: RunFilters) => void;
}

/** Filters live in the URL, so a filtered history can be shared as a link. */
export function RunsFilters({ filters, onChange }: RunsFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex rounded-md border border-border p-0.5">
        {STATUS_OPTIONS.map((option) => (
          <Button
            key={option.value}
            variant={filters.status === option.value ? "secondary" : "ghost"}
            size="sm"
            className="h-7"
            onClick={() => {
              onChange({ ...filters, status: option.value });
            }}
          >
            {option.label}
          </Button>
        ))}
      </div>

      <Input
        className="h-8 w-48"
        placeholder="Repository"
        value={filters.repository ?? ""}
        onChange={(event) => {
          onChange({ ...filters, repository: event.target.value || undefined });
        }}
      />
      <Input
        className="h-8 w-40"
        placeholder="Author"
        value={filters.author ?? ""}
        onChange={(event) => {
          onChange({ ...filters, author: event.target.value || undefined });
        }}
      />
      <Input
        className="h-8 w-56"
        placeholder="Search pull requests"
        value={filters.query ?? ""}
        onChange={(event) => {
          onChange({ ...filters, query: event.target.value || undefined });
        }}
      />

      {hasActiveFilters(filters) ? (
        <Button
          variant="ghost"
          size="sm"
          className="h-8"
          onClick={() => {
            onChange(DEFAULT_RUN_FILTERS);
          }}
        >
          <X className="size-3" aria-hidden />
          Reset
        </Button>
      ) : null}
    </div>
  );
}

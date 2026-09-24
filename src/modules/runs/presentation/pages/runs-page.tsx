import { Button } from "@/shared/ui/button";
import { Skeleton } from "@/shared/ui/skeleton";

import { type RunFilters } from "../../domain/filters";
import { RunRow } from "../components/run-row";
import { RunsFilters } from "../components/runs-filters";
import { useActiveRuns, useRunHistory } from "../queries";

export interface RunsPageProps {
  readonly filters: RunFilters;
  readonly onFiltersChange: (filters: RunFilters) => void;
}

/**
 * Active runs sit on top and refresh by polling; the history below is paginated with a
 * cursor, so new runs never shift the pages the reader is looking at.
 */
export function RunsPage({ filters, onFiltersChange }: RunsPageProps) {
  const activeRuns = useActiveRuns();
  const history = useRunHistory(filters);

  const historyRuns = history.data?.pages.flatMap((page) => page.items) ?? [];

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold">Active now</h2>

        {activeRuns.isPending ? (
          <Skeleton className="h-16 w-full" />
        ) : activeRuns.isError ? (
          <ErrorBox onRetry={() => void activeRuns.refetch()} />
        ) : activeRuns.data.length === 0 ? (
          <p className="text-sm text-content-muted">
            No reviews are running right now.
          </p>
        ) : (
          <ul className="overflow-hidden rounded-md border border-border bg-surface">
            {activeRuns.data.map((run) => (
              <RunRow key={run.id} run={run} />
            ))}
          </ul>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-semibold">History</h2>
          <RunsFilters filters={filters} onChange={onFiltersChange} />
        </div>

        {history.isPending ? (
          <Skeleton className="h-64 w-full" />
        ) : history.isError ? (
          <ErrorBox onRetry={() => void history.refetch()} />
        ) : historyRuns.length === 0 ? (
          <p className="text-sm text-content-muted">
            No runs match these filters.
          </p>
        ) : (
          <>
            <ul className="overflow-hidden rounded-md border border-border bg-surface">
              {historyRuns.map((run) => (
                <RunRow key={run.id} run={run} />
              ))}
            </ul>

            {history.hasNextPage ? (
              <Button
                variant="outline"
                className="self-center"
                disabled={history.isFetchingNextPage}
                onClick={() => void history.fetchNextPage()}
              >
                {history.isFetchingNextPage ? "Loading…" : "Load more"}
              </Button>
            ) : null}
          </>
        )}
      </section>
    </div>
  );
}

function ErrorBox({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex items-center gap-3 rounded-md border border-border bg-surface px-4 py-3 text-sm">
      <span>Could not load runs.</span>
      <Button variant="outline" size="sm" onClick={onRetry}>
        Retry
      </Button>
    </div>
  );
}

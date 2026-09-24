import { useInfiniteQuery, useQuery } from "@tanstack/react-query";

import {
  getRunDetails,
  listActiveRuns,
  listRunHistory,
} from "../application/use-cases";
import { type RunFilters } from "../domain/filters";
import { hasActiveRun } from "../domain/run";

import { useRunsDependencies } from "./dependencies";

/** Polling cadence for runs that are still in flight. */
const ACTIVE_RUNS_REFETCH_MS = 3000;

export const runsQueryKeys = {
  all: ["runs"] as const,
  active: () => [...runsQueryKeys.all, "active"] as const,
  history: (filters: RunFilters) =>
    [...runsQueryKeys.all, "history", filters] as const,
  details: (runId: string) => [...runsQueryKeys.all, "details", runId] as const,
};

/**
 * Active runs poll while anything is still running and stop once everything settles.
 * TanStack Query pauses refetching for background tabs on its own.
 */
export function useActiveRuns() {
  const dependencies = useRunsDependencies();

  return useQuery({
    queryKey: runsQueryKeys.active(),
    queryFn: ({ signal }) => listActiveRuns(dependencies, signal),
    refetchInterval: (query) =>
      query.state.data && hasActiveRun(query.state.data)
        ? ACTIVE_RUNS_REFETCH_MS
        : false,
  });
}

export function useRunHistory(filters: RunFilters) {
  const dependencies = useRunsDependencies();

  return useInfiniteQuery({
    queryKey: runsQueryKeys.history(filters),
    queryFn: ({ pageParam, signal }) =>
      listRunHistory(
        dependencies,
        { filters, cursor: pageParam ?? undefined },
        signal,
      ),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });
}

export function useRunDetails(runId: string) {
  const dependencies = useRunsDependencies();

  return useQuery({
    queryKey: runsQueryKeys.details(runId),
    queryFn: ({ signal }) => getRunDetails(dependencies, runId, signal),
  });
}

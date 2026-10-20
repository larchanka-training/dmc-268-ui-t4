import {
  useInfiniteQuery,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useEffect } from "react";

import {
  getFindingContext,
  getRunDetails,
  listActiveRuns,
  listRunHistory,
  watchRun,
} from "../application/use-cases";
import { type RunFilters } from "../domain/filters";
import { type Finding } from "../domain/finding";
import { hasActiveRun, isActiveStatus } from "../domain/run";

import { useRunsDependencies } from "./dependencies";

/** Polling cadence for runs that are still in flight. */
const ACTIVE_RUNS_REFETCH_MS = 3000;

/**
 * Polling cadence for an in-flight run's details. The event stream drives the page; this
 * only keeps it moving where the stream cannot open or has given up.
 */
const RUN_DETAILS_FALLBACK_REFETCH_MS = 15_000;

export const runsQueryKeys = {
  all: ["runs"] as const,
  active: () => [...runsQueryKeys.all, "active"] as const,
  history: (filters: RunFilters) =>
    [...runsQueryKeys.all, "history", filters] as const,
  details: (runId: string) => [...runsQueryKeys.all, "details", runId] as const,
  findingContext: (runId: string, findingId: string) =>
    [...runsQueryKeys.details(runId), "context", findingId] as const,
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
    refetchInterval: (query) =>
      query.state.data && isActiveStatus(query.state.data.run.status)
        ? RUN_DETAILS_FALLBACK_REFETCH_MS
        : false,
  });
}

/**
 * While a run is in flight, its event stream marks the details (and the active list)
 * stale on every change, so the timeline moves as soon as a stage does.
 */
export function useRunLiveUpdates(runId: string, isActive: boolean) {
  const dependencies = useRunsDependencies();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!isActive) {
      return undefined;
    }

    return watchRun(dependencies, runId, () => {
      void queryClient.invalidateQueries({
        queryKey: runsQueryKeys.details(runId),
      });
      void queryClient.invalidateQueries({ queryKey: runsQueryKeys.active() });
    });
  }, [dependencies, queryClient, runId, isActive]);
}

/**
 * The code around one finding. The API rebuilds it from the forge, so an old review can
 * answer 409 for good: no retries, and the card falls back to `path:line`.
 */
export function useFindingContext(runId: string, finding: Finding) {
  const dependencies = useRunsDependencies();

  return useQuery({
    queryKey: runsQueryKeys.findingContext(runId, finding.id),
    queryFn: ({ signal }) =>
      getFindingContext(dependencies, runId, finding, signal),
    retry: false,
    staleTime: Infinity,
  });
}

import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

import {
  type DisconnectStart,
  listRepositories,
  startConnect,
  startDisconnect,
} from "../application/use-cases";

import { useRepositoriesDependencies } from "./dependencies";

export const repositoriesQueryKeys = {
  all: ["repositories"] as const,
  list: () => [...repositoriesQueryKeys.all, "list"] as const,
};

/**
 * The connected repositories, page by page. The sidebar, the Overview and the
 * Repositories page share this one cache entry, so a refresh updates all of them.
 */
export function useRepositories() {
  const dependencies = useRepositoriesDependencies();

  return useInfiniteQuery({
    queryKey: repositoriesQueryKeys.list(),
    queryFn: ({ pageParam, signal }) =>
      listRepositories(
        dependencies,
        pageParam === null ? {} : { cursor: pageParam },
        signal,
      ),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    select: (data) => ({
      items: data.pages.flatMap((page) => page.items),
      totalCount: data.pages[0]?.totalCount ?? 0,
    }),
  });
}

/**
 * Finds out where GitHub lets the owner pick repositories and goes there in this tab;
 * GitHub's Setup URL brings the user back to /repositories?connected=1.
 */
export function useConnectRepository() {
  const dependencies = useRepositoriesDependencies();

  return useMutation({
    mutationFn: async () => {
      const start = await startConnect(dependencies);

      if (start.kind === "failed") {
        throw new Error(start.reason);
      }

      window.location.assign(start.url);
    },
  });
}

/** Why a disconnect could not start; the dialog shows a message per reason. */
export class DisconnectFailure extends Error {
  readonly reason: Extract<DisconnectStart, { kind: "failed" }>["reason"];

  constructor(reason: DisconnectFailure["reason"]) {
    super(`Disconnect failed: ${reason}`);
    this.name = "DisconnectFailure";
    this.reason = reason;
  }
}

/**
 * Finds out where GitHub lets the owner remove the repository and goes there in this tab;
 * "Redirect on update" brings the user back to /repositories?connected=1. A repository
 * that is already gone refreshes the list instead.
 */
export function useDisconnectRepository() {
  const dependencies = useRepositoriesDependencies();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (repositoryId: string) => {
      const start = await startDisconnect(dependencies, repositoryId);

      if (start.kind === "failed") {
        if (start.reason === "not-found") {
          void queryClient.invalidateQueries({
            queryKey: repositoriesQueryKeys.all,
          });
        }

        throw new DisconnectFailure(start.reason);
      }

      window.location.assign(start.url);
    },
  });
}

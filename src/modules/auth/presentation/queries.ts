import { queryOptions, useQuery } from "@tanstack/react-query";

import {
  type AuthDependencies,
  getCurrentSession,
} from "../application/use-cases";

import { useAuthDependencies } from "./dependencies";

export const sessionQueryKey = ["session"] as const;

/**
 * Shared by the hook and by the router guards, which prefetch the session in beforeLoad
 * through the same cache entry.
 */
export function sessionQueryOptions(dependencies: AuthDependencies) {
  return queryOptions({
    queryKey: sessionQueryKey,
    queryFn: ({ signal }) => getCurrentSession(dependencies, signal),
    staleTime: 5 * 60 * 1000,
  });
}

/** The signed-in user. A missing session resolves to null instead of an error. */
export function useSession() {
  return useQuery(sessionQueryOptions(useAuthDependencies()));
}

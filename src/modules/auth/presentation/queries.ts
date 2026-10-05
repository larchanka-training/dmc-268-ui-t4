import {
  type QueryClient,
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";

import {
  type AuthDependencies,
  getCurrentSession,
  signOut,
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

/**
 * Forgets everything cached for the signed-in user and records "signed out", so the next
 * guard does not need a request to find out.
 */
export function clearSessionCache(queryClient: QueryClient): void {
  queryClient.removeQueries();
  queryClient.setQueryData(sessionQueryKey, null);
}

/** Signs out here and in every other tab, then shows the sign-in page. */
export function useSignOut() {
  const dependencies = useAuthDependencies();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: () => signOut(dependencies),
    onSettled: () => {
      clearSessionCache(queryClient);
      void navigate({ to: "/login", search: {} });
    },
  });
}

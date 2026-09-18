import { QueryClient } from "@tanstack/react-query";

import { isRetryable } from "@/shared/lib/errors";

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30 * 1000,
        // A 403 will stay a 403; only transient failures are worth retrying.
        retry: (failureCount, error) => failureCount < 2 && isRetryable(error),
        refetchOnWindowFocus: false,
      },
    },
  });
}

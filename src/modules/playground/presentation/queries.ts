import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { parseDraftRules } from "../application/use-cases";

import { usePlaygroundDependencies } from "./dependencies";

export const playgroundQueryKeys = {
  all: ["playground"] as const,
  parse: (markdown: string) =>
    [...playgroundQueryKeys.all, "parse", markdown] as const,
};

/**
 * The draft as a review reads it. The answer depends on the text alone, so it never goes
 * stale; while the next text is parsed the previous answer stays on screen.
 */
export function useParsedDraft(markdown: string) {
  const dependencies = usePlaygroundDependencies();

  return useQuery({
    queryKey: playgroundQueryKeys.parse(markdown),
    queryFn: ({ signal }) => parseDraftRules(dependencies, markdown, signal),
    placeholderData: keepPreviousData,
    staleTime: Infinity,
    gcTime: 60_000,
  });
}

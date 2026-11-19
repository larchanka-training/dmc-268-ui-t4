import { RULES_MAX_BYTES, utf8Length } from "../domain/draft-rules";

import { type DraftParseResult, type PlaygroundRepository } from "./ports";

export interface PlaygroundDependencies {
  readonly playground: PlaygroundRepository;
}

/**
 * The draft as a review would read it. A draft over the review's size limit is answered
 * here, without a request: the backend would refuse it anyway.
 */
export function parseDraftRules(
  { playground }: PlaygroundDependencies,
  markdown: string,
  signal?: AbortSignal,
): Promise<DraftParseResult> {
  const bytes = utf8Length(markdown);

  if (bytes > RULES_MAX_BYTES) {
    return Promise.resolve({
      kind: "too-large",
      bytes,
      limit: RULES_MAX_BYTES,
    });
  }

  return playground.parseRules(markdown, signal);
}

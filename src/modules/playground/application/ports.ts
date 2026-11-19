import { type ParsedDraft } from "../domain/draft-rules";

/** The answer to a parse: the draft as a review reads it, or too large to be read at all. */
export type DraftParseResult =
  | { readonly kind: "parsed"; readonly draft: ParsedDraft }
  | {
      readonly kind: "too-large";
      readonly bytes: number;
      readonly limit: number;
    };

/**
 * The port the application layer depends on. The HTTP adapter lives in infrastructure,
 * and tests can hand in an in-memory implementation.
 */
export interface PlaygroundRepository {
  /** Parses a draft with the parser reviews use. No model runs and nothing is stored. */
  parseRules: (
    markdown: string,
    signal?: AbortSignal,
  ) => Promise<DraftParseResult>;
}

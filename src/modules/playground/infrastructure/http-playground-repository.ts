import { isAppError } from "@/shared/lib/errors";
import { type HttpClient } from "@/shared/lib/http";

import { type PlaygroundRepository } from "../application/ports";
import { RULES_MAX_BYTES, utf8Length } from "../domain/draft-rules";

import { parsedRulesDtoSchema } from "./dto";
import { toParsedDraft } from "./mappers";

export function createHttpPlaygroundRepository(
  http: HttpClient,
): PlaygroundRepository {
  return {
    async parseRules(markdown, signal) {
      try {
        const dto = await http.post(
          "/playground/rules/parse",
          { rules_markdown: markdown },
          { schema: parsedRulesDtoSchema, signal },
        );

        return { kind: "parsed", draft: toParsedDraft(dto) };
      } catch (error) {
        // 413 `rules_too_large`: the backend's limit, should it ever differ from ours.
        if (isAppError(error) && error.status === 413) {
          return {
            kind: "too-large",
            bytes: utf8Length(markdown),
            limit: RULES_MAX_BYTES,
          };
        }

        throw error;
      }
    },
  };
}

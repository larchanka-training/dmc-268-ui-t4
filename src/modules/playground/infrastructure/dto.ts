import { z } from "zod";

const lineSpan = {
  line_start: z.number().int().positive(),
  line_end: z.number().int().positive(),
};

/** POST /playground/rules/parse: a draft rules.md as the review's parser reads it. */
export const parsedRulesDtoSchema = z.object({
  rules: z.array(
    z.object({
      id: z.string(),
      section: z.string(),
      // Any string: a category newer than this client is shown as "other guidance".
      category: z.string().nullable(),
      text: z.string(),
      ...lineSpan,
    }),
  ),
  ignore: z.array(
    z.object({
      kind: z.enum(["path", "category"]),
      value: z.string(),
      ...lineSpan,
    }),
  ),
  diagnostics: z.array(
    z.object({
      // Any string: a code newer than this client becomes "unknown" in the mapper.
      code: z.string(),
      dropped: z.boolean(),
      ...lineSpan,
    }),
  ),
  dropped_suspicious: z.number().int().nonnegative(),
  dropped_over_limit: z.number().int().nonnegative(),
  limits: z.object({
    bytes: z.number().int().positive(),
    rules: z.number().int().positive(),
    rule_chars: z.number().int().positive(),
    ignore: z.number().int().positive(),
  }),
});

export type ParsedRulesDto = z.infer<typeof parsedRulesDtoSchema>;

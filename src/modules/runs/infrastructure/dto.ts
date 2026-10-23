import { z } from "zod";

/**
 * The wire format of the jobs API (`dmc-268-api-t4/docs/openapi.yaml`). Nothing enters the
 * domain without passing these schemas first: the backend proxies GitHub and an LLM, so
 * responses are treated as untrusted input.
 */

export const diffLineDtoSchema = z.object({
  type: z.enum(["context", "added", "removed"]),
  old_line: z.number().int().positive().nullable(),
  new_line: z.number().int().positive().nullable(),
  content: z.string(),
});

export const diffHunkDtoSchema = z.object({
  id: z.string().min(1),
  old_start: z.number().int().nonnegative(),
  old_lines: z.number().int().nonnegative(),
  new_start: z.number().int().nonnegative(),
  new_lines: z.number().int().nonnegative(),
  header: z.string().nullable(),
  lines: z.array(diffLineDtoSchema),
});

export const pullRequestDtoSchema = z.object({
  provider: z.enum(["github", "gitlab"]),
  repo_full_name: z.string().min(1),
  number: z.number().int().positive(),
  title: z.string(),
  url: z.url(),
  author: z.string(),
  head_ref: z.string(),
  base_ref: z.string(),
  head_sha: z.string(),
});

export const jobStatusSchema = z.enum([
  "QUEUED",
  "PROCESSING",
  "RETRYING",
  "COMPLETED",
  "FAILED",
  "SUPERSEDED",
  "SKIPPED",
]);

export const jobStageSchema = z.enum([
  "collecting_context",
  "reviewing",
  "validating",
  "publishing",
]);

export const jobDtoSchema = z.object({
  id: z.string().min(1),
  pull_request: pullRequestDtoSchema,
  status: jobStatusSchema,
  created_at: z.iso.datetime({ offset: true }),
  finished_at: z.iso.datetime({ offset: true }).nullish(),
  finding_count: z.number().int().nonnegative(),
  error_kind: z.string().nullish(),
});

export const jobStepDtoSchema = z.object({
  step: z.string().min(1),
  status: z.enum(["RUNNING", "OK", "FAILED", "SKIPPED"]),
  stage: jobStageSchema,
  attempt: z.number().int().nonnegative().default(0),
  started_at: z.iso.datetime({ offset: true }),
  finished_at: z.iso.datetime({ offset: true }).nullish(),
});

export const findingDtoSchema = z.object({
  id: z.string().min(1),
  path: z.string().min(1),
  line: z.number().int().positive(),
  side: z.enum(["old", "new"]),
  severity: z.enum(["critical", "high", "medium", "low"]),
  category: z.enum([
    "security",
    "correctness",
    "concurrency",
    "performance",
    "maintainability",
  ]),
  message: z.string(),
  suggestion: z
    .object({ before: z.array(z.string()), after: z.array(z.string()) })
    .nullish(),
  published_at: z.iso.datetime({ offset: true }),
  external_url: z.url(),
});

export const jobDetailDtoSchema = jobDtoSchema.extend({
  stage: jobStageSchema.nullable(),
  summary: z.string().nullish(),
  error_log: z.string().nullish(),
  steps: z.array(jobStepDtoSchema),
  findings: z.array(findingDtoSchema),
});

export const jobsPageDtoSchema = z.object({
  items: z.array(jobDtoSchema),
  next_cursor: z.string().nullable(),
});

export const findingContextDtoSchema = z.object({
  path: z.string().min(1),
  old_path: z.string().nullable(),
  status: z.enum(["added", "modified", "removed", "renamed"]),
  file_line_count: z.number().int().nonnegative(),
  hunks: z.array(diffHunkDtoSchema),
});

export const fileLinesDtoSchema = z.object({
  path: z.string(),
  from: z.number().int().positive(),
  lines: z.array(z.string()),
});

export type JobDto = z.infer<typeof jobDtoSchema>;
export type JobDetailDto = z.infer<typeof jobDetailDtoSchema>;
export type JobStepDto = z.infer<typeof jobStepDtoSchema>;
export type JobStatusDto = z.infer<typeof jobStatusSchema>;
export type JobStageDto = z.infer<typeof jobStageSchema>;
export type FindingDto = z.infer<typeof findingDtoSchema>;
export type FindingContextDto = z.infer<typeof findingContextDtoSchema>;

/** GET /jobs/{id}/rules: `.review/rules.md` at the job's head SHA. */
export const rulesDtoSchema = z.object({
  path: z.string(),
  ref: z.string(),
  // Any string: a status newer than this client becomes "unknown" in the mapper.
  status: z.string(),
  file_url: z.string().nullable(),
  rules: z.array(
    z.object({ id: z.string(), section: z.string(), text: z.string() }),
  ),
  dropped_suspicious: z.number().int().nonnegative(),
  dropped_over_limit: z.number().int().nonnegative(),
});

export type RulesDto = z.infer<typeof rulesDtoSchema>;

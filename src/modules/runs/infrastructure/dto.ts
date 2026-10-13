import { z } from "zod";

/**
 * The wire format. Nothing enters the domain without passing these schemas first:
 * the backend proxies GitHub and an LLM, so responses are treated as untrusted input.
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

export const diffFileDtoSchema = z.object({
  path: z.string().min(1),
  old_path: z.string().nullable(),
  status: z.enum(["added", "modified", "removed", "renamed"]),
  hunks: z.array(diffHunkDtoSchema),
});

/** Times carry an explicit offset ("+00:00"), the way the backend serialises them. */
const instant = z.iso.datetime({ offset: true });

export const jobStatusSchema = z.enum([
  "QUEUED",
  "PROCESSING",
  "RETRYING",
  "COMPLETED",
  "FAILED",
  "SUPERSEDED",
  "SKIPPED",
]);

export const jobStepNameSchema = z.enum([
  "CLAIMED",
  "AUTH",
  "FETCH_DIFF",
  "BUILD_CONTEXT",
  "REDACT",
  "GATE",
  "LLM_CALL",
  "POSTPROCESS",
  "POST_FEEDBACK",
  "METER",
]);

export const jobPullRequestDtoSchema = z.object({
  provider: z.string(),
  repo_full_name: z.string().regex(/^[^/]+\/[^/]+$/),
  number: z.number().int().positive(),
  title: z.string(),
  author: z.string(),
  head_ref: z.string(),
  base_ref: z.string(),
  head_sha: z.string(),
  url: z.url(),
});

export const jobDtoSchema = z.object({
  id: z.string().min(1),
  pull_request: jobPullRequestDtoSchema,
  status: jobStatusSchema,
  trigger: z.string(),
  created_at: instant,
  started_at: instant.nullable(),
  finished_at: instant.nullable(),
  finding_count: z.number().int().nonnegative(),
  error_kind: z.string().nullable(),
  retry_count: z.number().int().nonnegative(),
  next_attempt_at: instant.nullable(),
});

export const jobStepDtoSchema = z.object({
  step: jobStepNameSchema,
  status: z.enum(["RUNNING", "OK", "FAILED", "SKIPPED"]),
  attempt: z.number().int().nonnegative(),
  started_at: instant,
  finished_at: instant.nullable(),
  error_kind: z.string().nullable(),
});

export const findingDtoSchema = z.object({
  id: z.string().min(1),
  file_path: z.string().min(1),
  line: z.number().int().positive(),
  side: z.enum(["LEFT", "RIGHT"]),
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
    .nullable(),
  published_at: instant,
  external_url: z.url(),
  snippet: diffFileDtoSchema,
  file_line_count: z.number().int().positive(),
});

export const jobPageDtoSchema = z.object({
  items: z.array(jobDtoSchema),
  next_cursor: z.string().nullable(),
});

export const jobDetailDtoSchema = jobDtoSchema.extend({
  summary: z.string().nullable(),
  error_log: z.string().nullable(),
  external_check_url: z.url().nullable(),
  steps: z.array(jobStepDtoSchema),
  findings: z.array(findingDtoSchema),
});

export const fileLinesDtoSchema = z.object({
  path: z.string(),
  from: z.number().int().positive(),
  lines: z.array(z.string()),
});

export type JobDto = z.infer<typeof jobDtoSchema>;
export type JobStepDto = z.infer<typeof jobStepDtoSchema>;
export type JobDetailDto = z.infer<typeof jobDetailDtoSchema>;
export type FindingDto = z.infer<typeof findingDtoSchema>;
export type DiffFileDto = z.infer<typeof diffFileDtoSchema>;

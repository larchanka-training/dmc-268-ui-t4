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

export const pullRequestDtoSchema = z.object({
  owner: z.string().min(1),
  repo: z.string().min(1),
  number: z.number().int().positive(),
  title: z.string(),
  url: z.url(),
  author: z.string(),
  head_ref: z.string(),
  base_ref: z.string(),
  head_sha: z.string(),
});

export const runStatusSchema = z.enum([
  "queued",
  "collecting_context",
  "reviewing",
  "validating",
  "publishing",
  "completed",
  "failed",
]);

export const runDtoSchema = z.object({
  id: z.string().min(1),
  pull_request: pullRequestDtoSchema,
  status: runStatusSchema,
  created_at: z.iso.datetime(),
  finished_at: z.iso.datetime().nullable(),
  finding_count: z.number().int().nonnegative(),
});

export const runStageDtoSchema = z.object({
  name: z.enum(["collecting_context", "reviewing", "validating", "publishing"]),
  started_at: z.iso.datetime(),
  finished_at: z.iso.datetime().nullable(),
});

export const runDetailsDtoSchema = runDtoSchema.extend({
  stages: z.array(runStageDtoSchema),
  summary: z.string().nullable(),
  failure_reason: z.string().nullable(),
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
  published_at: z.iso.datetime(),
  external_url: z.url(),
  snippet: diffFileDtoSchema,
  file_line_count: z.number().int().positive(),
});

export const runHistoryPageDtoSchema = z.object({
  items: z.array(runDtoSchema),
  next_cursor: z.string().nullable(),
});

export const activeRunsDtoSchema = z.object({ items: z.array(runDtoSchema) });

export const runDetailsResponseDtoSchema = z.object({
  run: runDetailsDtoSchema,
  findings: z.array(findingDtoSchema),
});

export const fileLinesDtoSchema = z.object({
  path: z.string(),
  from: z.number().int().positive(),
  lines: z.array(z.string()),
});

export type RunDto = z.infer<typeof runDtoSchema>;
export type RunDetailsDto = z.infer<typeof runDetailsDtoSchema>;
export type FindingDto = z.infer<typeof findingDtoSchema>;
export type DiffFileDto = z.infer<typeof diffFileDtoSchema>;

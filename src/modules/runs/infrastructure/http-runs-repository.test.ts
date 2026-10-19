import { describe, expect, it, vi } from "vitest";

import { type HttpClient, type HttpRequestOptions } from "@/shared/lib/http";

import { DEFAULT_RUN_FILTERS } from "../domain/filters";

import { createHttpRunsRepository } from "./http-runs-repository";

/** Shaped like `api/jobs.py` answers: `isoformat()` offsets, not a trailing Z. */
const WIRE_JOB = {
  id: "0b6c1a52-6f0e-4b8e-9d55-1d6d2b6f1c11",
  pull_request: {
    provider: "github",
    repo_full_name: "acme/payments",
    number: 412,
    title: "Add retry logic for payment provider",
    author: "octocat",
    head_ref: "feature/payment-retry",
    base_ref: "main",
    head_sha: "a1b2c3d",
    url: "https://github.com/acme/payments/pull/412",
  },
  status: "PROCESSING",
  trigger: "webhook",
  created_at: "2026-10-11T12:00:00.123456+00:00",
  started_at: "2026-10-11T12:00:01+00:00",
  finished_at: null,
  finding_count: 0,
  error_kind: null,
  retry_count: 0,
  next_attempt_at: null,
};

function wireStep(
  step: string,
  stage: string,
  startedAt: string,
  finishedAt: string | null,
  overrides: Record<string, unknown> = {},
) {
  return {
    step,
    status: finishedAt === null ? "RUNNING" : "OK",
    stage,
    attempt: 0,
    started_at: startedAt,
    finished_at: finishedAt,
    error_kind: null,
    metrics: {},
    ...overrides,
  };
}

const WIRE_FINDING = {
  id: "5d1f0f8e-9a4e-4b3a-8f0c-3d1b2e4a5c6d",
  path: "src/payment_service.rb",
  line: 142,
  start_line: null,
  side: "new",
  severity: "high",
  category: "correctness",
  message: "The transaction stays open while the provider is retried.",
  suggestion: null,
  published_at: "2026-10-11T12:01:00+00:00",
  external_url: "https://github.com/acme/payments/pull/412#discussion_r1",
};

/** Answers like the real client: the canned response still has to pass the schema. */
function fakeHttp(answer: (path: string) => unknown) {
  const get =
    vi.fn<(path: string, options: HttpRequestOptions<unknown>) => void>();
  const http: HttpClient = {
    get: (path, options) => {
      get(path, options);

      return Promise.resolve(options.schema.parse(answer(path)));
    },
    post: () => Promise.reject(new Error("not used")),
  };

  return Object.assign(http, { calls: { get } });
}

describe("createHttpRunsRepository", () => {
  it("asks GET /jobs for the active shorthand and shows a stage-less job as processing", async () => {
    const http = fakeHttp(() => ({ items: [WIRE_JOB], next_cursor: null }));

    const [run] = await createHttpRunsRepository(http).listActiveRuns();

    expect(http.calls.get).toHaveBeenCalledWith(
      "/jobs",
      expect.objectContaining({
        searchParams: { status: "active", limit: 100 },
      }),
    );
    expect(run).toMatchObject({
      status: "processing",
      createdAt: "2026-10-11T12:00:00.123456+00:00",
      finishedAt: null,
      pullRequest: { repository: "acme/payments", number: 412 },
    });
  });

  it("sends the history filters in the API's vocabulary", async () => {
    const http = fakeHttp(() => ({ items: [], next_cursor: "abc" }));

    const page = await createHttpRunsRepository(http).listRunHistory({
      filters: { ...DEFAULT_RUN_FILTERS, status: "failed", query: "" },
      cursor: "xyz",
    });

    expect(page.nextCursor).toBe("abc");
    expect(http.calls.get).toHaveBeenCalledWith(
      "/jobs",
      expect.objectContaining({
        searchParams: expect.objectContaining({
          status: "FAILED",
          q: undefined,
          cursor: "xyz",
        }) as unknown,
      }),
    );
  });

  it("reads a job's stage, steps and findings into the run details", async () => {
    const http = fakeHttp(() => ({
      ...WIRE_JOB,
      stage: "reviewing",
      summary: null,
      error_log: null,
      external_check_url: null,
      steps: [
        // A first attempt that failed: a retry starts over, so it must not count.
        wireStep(
          "FETCH_DIFF",
          "collecting_context",
          "2026-10-11T11:00:00+00:00",
          "2026-10-11T11:00:05+00:00",
          { status: "FAILED", attempt: 0 },
        ),
        wireStep(
          "CLAIMED",
          "collecting_context",
          "2026-10-11T12:00:01+00:00",
          "2026-10-11T12:00:01+00:00",
          { attempt: 1 },
        ),
        wireStep(
          "FETCH_DIFF",
          "collecting_context",
          "2026-10-11T12:00:01+00:00",
          "2026-10-11T12:00:09+00:00",
          { attempt: 1 },
        ),
        wireStep("LLM_CALL", "reviewing", "2026-10-11T12:00:09+00:00", null, {
          attempt: 1,
        }),
      ],
      findings: [WIRE_FINDING],
    }));

    const { run, findings } =
      await createHttpRunsRepository(http).getRunDetails("job/1");

    expect(http.calls.get.mock.calls[0]?.[0]).toBe("/jobs/job%2F1");
    expect(run.status).toBe("reviewing");
    expect(run.stages).toEqual([
      {
        name: "collecting_context",
        startedAt: "2026-10-11T12:00:01+00:00",
        finishedAt: "2026-10-11T12:00:09+00:00",
        failed: false,
      },
      {
        name: "reviewing",
        startedAt: "2026-10-11T12:00:09+00:00",
        finishedAt: null,
        failed: false,
      },
    ]);
    expect(findings).toEqual([
      {
        id: WIRE_FINDING.id,
        position: { path: "src/payment_service.rb", line: 142, side: "new" },
        severity: "high",
        category: "correctness",
        message: WIRE_FINDING.message,
        suggestion: null,
        publishedAt: WIRE_FINDING.published_at,
        externalUrl: WIRE_FINDING.external_url,
      },
    ]);
  });

  it("explains a failed run with the log, else the error kind", async () => {
    const failed = {
      ...WIRE_JOB,
      status: "FAILED",
      stage: "collecting_context",
      error_kind: "diff_too_large",
      summary: null,
      error_log: null,
      steps: [
        wireStep(
          "FETCH_DIFF",
          "collecting_context",
          "2026-10-11T12:00:01+00:00",
          "2026-10-11T12:00:02+00:00",
          { status: "FAILED" },
        ),
      ],
      findings: [],
    };
    const http = fakeHttp(() => failed);

    const { run } = await createHttpRunsRepository(http).getRunDetails("1");

    expect(run.status).toBe("failed");
    expect(run.failureReason).toBe("diff_too_large");
    expect(run.stages[0]?.failed).toBe(true);
  });

  it("fetches a finding's context from its own endpoint", async () => {
    const http = fakeHttp(() => ({
      path: "src/payment_service.rb",
      old_path: null,
      status: "modified",
      file_line_count: 180,
      hunks: [],
    }));

    const context = await createHttpRunsRepository(http).getFindingContext(
      "job_1",
      "finding_1",
    );

    expect(http.calls.get.mock.calls[0]?.[0]).toBe(
      "/jobs/job_1/findings/finding_1/context",
    );
    expect(context).toEqual({
      snippet: {
        path: "src/payment_service.rb",
        oldPath: null,
        status: "modified",
        hunks: [],
      },
      fileLineCount: 180,
    });
  });
});

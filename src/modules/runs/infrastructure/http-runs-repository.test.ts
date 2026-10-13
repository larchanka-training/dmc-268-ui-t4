import { afterEach, describe, expect, it, vi } from "vitest";

import { type HttpClient, type HttpRequestOptions } from "@/shared/lib/http";

import { DEFAULT_RUN_FILTERS } from "../domain/filters";

import { createHttpRunsRepository } from "./http-runs-repository";

const START = "2026-10-13T10:00:00+00:00";

const WIRE_JOB = {
  id: "job_1",
  pull_request: {
    provider: "github",
    repo_full_name: "acme/payments",
    number: 412,
    title: "Add retry logic",
    author: "octocat",
    head_ref: "feature/retry",
    base_ref: "main",
    head_sha: "a1b2c3",
    url: "https://github.com/acme/payments/pull/412",
  },
  status: "PROCESSING",
  trigger: "webhook",
  created_at: START,
  started_at: START,
  finished_at: null,
  finding_count: 0,
  error_kind: null,
  retry_count: 0,
  next_attempt_at: null,
};

function step(
  name: string,
  startedAt: string,
  finishedAt: string | null,
  attempt = 1,
) {
  return {
    step: name,
    status: finishedAt === null ? "RUNNING" : "OK",
    attempt,
    started_at: startedAt,
    finished_at: finishedAt,
    error_kind: null,
  };
}

function detail(overrides: Record<string, unknown>) {
  return {
    ...WIRE_JOB,
    summary: null,
    error_log: null,
    external_check_url: null,
    steps: [],
    findings: [],
    ...overrides,
  };
}

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

class FakeEventSource {
  static last: FakeEventSource | null = null;
  readonly listeners = new Map<string, (() => void)[]>();
  closed = false;

  readonly url: string;
  readonly init: EventSourceInit;

  constructor(url: string, init: EventSourceInit) {
    this.url = url;
    this.init = init;
    FakeEventSource.last = this;
  }

  addEventListener(type: string, listener: () => void) {
    this.listeners.set(type, [...(this.listeners.get(type) ?? []), listener]);
  }

  emit(type: string) {
    for (const listener of this.listeners.get(type) ?? []) {
      listener();
    }
  }

  close() {
    this.closed = true;
  }
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("createHttpRunsRepository", () => {
  it("lists the jobs still in flight", async () => {
    const http = fakeHttp(() => ({ items: [WIRE_JOB], next_cursor: null }));

    const runs = await createHttpRunsRepository(http, "/api").listActiveRuns();

    expect(http.calls.get).toHaveBeenCalledWith(
      "/jobs",
      expect.objectContaining({
        searchParams: { status: "active", limit: 100 },
      }),
    );
    expect(runs).toEqual([
      expect.objectContaining({
        id: "job_1",
        status: "collecting_context",
        pullRequest: expect.objectContaining({
          owner: "acme",
          repo: "payments",
        }) as unknown,
      }),
    ]);
  });

  it("turns history filters into the backend's query", async () => {
    const http = fakeHttp(() => ({ items: [], next_cursor: "abc" }));

    const page = await createHttpRunsRepository(http, "/api").listRunHistory({
      filters: {
        ...DEFAULT_RUN_FILTERS,
        status: "failed",
        from: "2026-10-01",
        to: "2026-10-02",
      },
      cursor: "xyz",
    });

    expect(page.nextCursor).toBe("abc");
    expect(http.calls.get).toHaveBeenCalledWith(
      "/jobs",
      expect.objectContaining({
        searchParams: expect.objectContaining({
          status: "FAILED",
          from: "2026-10-01T00:00:00Z",
          to: "2026-10-02T23:59:59.999Z",
          cursor: "xyz",
        }) as unknown,
      }),
    );
  });

  it("groups the steps of the latest attempt into stages", async () => {
    const http = fakeHttp(() =>
      detail({
        retry_count: 1,
        steps: [
          step("CLAIMED", "2026-10-13T09:00:00+00:00", null, 0),
          step("CLAIMED", START, "2026-10-13T10:00:01+00:00"),
          step(
            "FETCH_DIFF",
            "2026-10-13T10:00:01+00:00",
            "2026-10-13T10:00:05+00:00",
          ),
          step("LLM_CALL", "2026-10-13T10:00:05+00:00", null),
        ],
      }),
    );

    const { run } = await createHttpRunsRepository(http, "/api").getRunDetails(
      "job_1",
    );

    expect(http.calls.get).toHaveBeenCalledWith(
      "/jobs/job_1",
      expect.anything(),
    );
    expect(run.status).toBe("reviewing");
    expect(run.stages).toEqual([
      {
        name: "collecting_context",
        startedAt: START,
        finishedAt: "2026-10-13T10:00:05+00:00",
      },
      {
        name: "reviewing",
        startedAt: "2026-10-13T10:00:05+00:00",
        finishedAt: null,
      },
    ]);
  });

  it.each([
    ["COMPLETED", null, "completed", null],
    ["FAILED", "llm_timeout", "failed", "llm_timeout"],
    ["SUPERSEDED", null, "failed", "Superseded by a newer push"],
    ["SKIPPED", "draft", "failed", "Skipped: draft"],
    ["RETRYING", "llm_timeout", "queued", null],
  ])(
    "maps a %s job to the %s run status",
    async (status, errorKind, runStatus, failureReason) => {
      const http = fakeHttp(() =>
        detail({ status, error_kind: errorKind, finished_at: START }),
      );

      const { run } = await createHttpRunsRepository(
        http,
        "/api",
      ).getRunDetails("job_1");

      expect(run.status).toBe(runStatus);
      expect(run.failureReason).toBe(failureReason);
    },
  );

  it("watches a run until its stream ends", () => {
    vi.stubGlobal("EventSource", FakeEventSource);
    const onChange = vi.fn();

    const stop = createHttpRunsRepository(
      fakeHttp(() => null),
      "/api",
    ).watchRun("job 1", onChange);
    const source = FakeEventSource.last;

    expect(source?.url).toBe("/api/jobs/job%201/events");
    expect(source?.init).toEqual({ withCredentials: true });

    source?.emit("snapshot");
    expect(onChange).not.toHaveBeenCalled();

    source?.emit("step");
    source?.emit("status");
    source?.emit("end");
    expect(onChange).toHaveBeenCalledTimes(3);
    expect(source?.closed).toBe(true);

    stop();
  });

  it("does nothing where EventSource is missing", () => {
    vi.stubGlobal("EventSource", undefined);

    const stop = createHttpRunsRepository(
      fakeHttp(() => null),
      "/api",
    ).watchRun("job_1", vi.fn());

    expect(stop).not.toThrow();
  });
});

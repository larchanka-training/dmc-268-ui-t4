import { describe, expect, it } from "vitest";

import {
  type Run,
  hasActiveRun,
  isActiveStatus,
  runDuration,
  stageDuration,
} from "./run";

const run: Run = {
  id: "run_1",
  pullRequest: {
    owner: "acme",
    repo: "payments",
    number: 412,
    title: "Add retry logic for payment provider",
    url: "https://github.com/acme/payments/pull/412",
    author: "octocat",
    headRef: "feature/payment-retry",
    baseRef: "main",
    headSha: "a1b2c3d",
  },
  status: "completed",
  createdAt: "2026-09-15T10:00:00.000Z",
  finishedAt: "2026-09-15T10:01:12.000Z",
  findingCount: 3,
};

describe("isActiveStatus", () => {
  it("treats pipeline stages as active", () => {
    expect(isActiveStatus("reviewing")).toBe(true);
    expect(isActiveStatus("queued")).toBe(true);
  });

  it("treats terminal statuses as inactive", () => {
    expect(isActiveStatus("completed")).toBe(false);
    expect(isActiveStatus("failed")).toBe(false);
  });
});

describe("hasActiveRun", () => {
  it("drives whether the list keeps polling", () => {
    expect(hasActiveRun([run])).toBe(false);
    expect(
      hasActiveRun([run, { ...run, id: "run_2", status: "publishing" }]),
    ).toBe(true);
  });
});

describe("runDuration", () => {
  it("measures a finished run between its own timestamps", () => {
    expect(runDuration(run)).toBe(72_000);
  });

  it("measures a running one against the current time", () => {
    const running: Run = { ...run, status: "reviewing", finishedAt: null };

    expect(runDuration(running, new Date("2026-09-15T10:00:30.000Z"))).toBe(
      30_000,
    );
  });
});

describe("stageDuration", () => {
  it("measures an unfinished stage against the current time", () => {
    const duration = stageDuration(
      {
        name: "reviewing",
        startedAt: "2026-09-15T10:00:10.000Z",
        finishedAt: null,
      },
      new Date("2026-09-15T10:00:25.000Z"),
    );

    expect(duration).toBe(15_000);
  });
});

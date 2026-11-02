import { describe, expect, it } from "vitest";

import { type RunDetails, type RunStage } from "./run";
import { progressSteps } from "./run-progress";

function runWith(
  status: RunDetails["status"],
  stages: readonly RunStage[],
): RunDetails {
  return {
    id: "run_1",
    pullRequest: {
      repository: "acme/payments",
      number: 412,
      title: "Add retry logic for payment provider",
      url: "https://github.com/acme/payments/pull/412",
      author: "octocat",
      headRef: "feature/payment-retry",
      baseRef: "main",
      headSha: "a1b2c3d",
    },
    status,
    createdAt: "2026-10-27T10:00:00.000Z",
    finishedAt: null,
    findingCount: 0,
    stages,
    summary: null,
    failureReason: null,
  };
}

function stage(
  name: RunStage["name"],
  finished: boolean,
  failed = false,
): RunStage {
  return {
    name,
    startedAt: "2026-10-27T10:00:01.000Z",
    finishedAt: finished ? "2026-10-27T10:00:05.000Z" : null,
    failed,
  };
}

function states(run: RunDetails) {
  return progressSteps(run).map((step) => step.state);
}

describe("progressSteps", () => {
  it("starts with every step pending", () => {
    expect(states(runWith("queued", []))).toEqual([
      "pending",
      "pending",
      "pending",
    ]);
  });

  it("shows the step the agent is on", () => {
    expect(
      states(
        runWith("reviewing", [
          stage("collecting_context", true),
          stage("reviewing", false),
        ]),
      ),
    ).toEqual(["done", "running", "pending"]);
  });

  it("keeps the analysis running between reviewing and validating", () => {
    expect(
      states(
        runWith("reviewing", [
          stage("collecting_context", true),
          stage("reviewing", true),
        ]),
      ),
    ).toEqual(["done", "running", "pending"]);
  });

  it("finishes the analysis once validation is done", () => {
    expect(
      states(
        runWith("publishing", [
          stage("collecting_context", true),
          stage("reviewing", true),
          stage("validating", true),
          stage("publishing", false),
        ]),
      ),
    ).toEqual(["done", "done", "running"]);
  });

  it("marks the failed step", () => {
    expect(
      states(
        runWith("failed", [
          stage("collecting_context", true),
          stage("reviewing", true, true),
        ]),
      ),
    ).toEqual(["done", "failed", "pending"]);
  });

  it("fails a step the run stopped in without a failed flag", () => {
    expect(
      states(runWith("failed", [stage("collecting_context", false)])),
    ).toEqual(["failed", "pending", "pending"]);
  });

  it("shows a completed run as done even without stages", () => {
    expect(states(runWith("completed", []))).toEqual(["done", "done", "done"]);
  });
});

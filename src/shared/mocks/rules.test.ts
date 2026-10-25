import { describe, expect, it } from "vitest";

import { mockJobRules } from "./rules";
import { completedJob, failedJob } from "./state";

describe("mockJobRules", () => {
  it("reads a listed job's rules at its head SHA", () => {
    const rules = mockJobRules(completedJob);

    expect(rules.status).toBe("applied");
    expect(rules.ref).toBe(completedJob.pull_request.head_sha);
    expect(rules.file_url).toBe(
      `https://github.com/acme/payments/blob/${completedJob.pull_request.head_sha}/.review/rules.md`,
    );
    expect(rules.rules.length).toBeGreaterThan(0);
  });

  it("links an unlisted job to creating the file on its branch", () => {
    const rules = mockJobRules(failedJob);

    expect(rules.status).toBe("absent");
    expect(rules.rules).toEqual([]);
    expect(rules.file_url).toBe(
      "https://github.com/acme/payments/new/chore/bump-deps?filename=.review%2Frules.md",
    );
  });
});

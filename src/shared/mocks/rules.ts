import { JOB_RULES } from "./state";

const RULES_PATH = ".review/rules.md";

interface MockJob {
  readonly id: string;
  readonly pull_request: {
    readonly repo_full_name: string;
    readonly head_ref: string;
    readonly head_sha: string;
  };
}

/**
 * GET /jobs/{id}/rules for one job, shaped like the backend's answer: read at the head
 * SHA, and when the file is absent the link creates it on the pull request's branch.
 */
export function mockJobRules(job: MockJob) {
  const {
    repo_full_name: repo,
    head_ref: branch,
    head_sha: sha,
  } = job.pull_request;
  const fixture = JOB_RULES[job.id];
  const base = {
    path: RULES_PATH,
    ref: sha,
    dropped_suspicious: 0,
    dropped_over_limit: 0,
  };

  if (fixture === undefined) {
    return {
      ...base,
      status: "absent",
      file_url: `https://github.com/${repo}/new/${branch.split("/").map(encodeURIComponent).join("/")}?filename=${encodeURIComponent(RULES_PATH)}`,
      rules: [],
    };
  }

  return {
    ...base,
    ...fixture,
    file_url: `https://github.com/${repo}/blob/${sha}/${RULES_PATH}`,
  };
}

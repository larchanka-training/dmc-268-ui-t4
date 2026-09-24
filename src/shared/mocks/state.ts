/**
 * The mock application state: one typed snapshot that both the MSW handlers and the
 * documentation refer to. It is written in the wire format (snake_case DTOs), so it
 * exercises the Zod schemas and the mappers exactly like a real backend would.
 */

const ORG = {
  id: "org_acme",
  login: "acme",
  name: "Acme Corp",
  avatar_url: "https://avatars.githubusercontent.com/u/1?v=4",
} as const;

export type MockRole = "member" | "owner" | "platform-admin";

export function sessionFor(role: MockRole) {
  return {
    user: {
      id: "u_octocat",
      login: "octocat",
      name: "Octo Cat",
      avatar_url: "https://avatars.githubusercontent.com/u/583231?v=4",
      is_platform_admin: role === "platform-admin",
    },
    organizations: [{ ...ORG, role: role === "owner" ? "owner" : "member" }],
    current_organization_id: ORG.id,
  };
}

const PULL_REQUEST = {
  owner: "acme",
  repo: "payments",
  number: 412,
  title: "Add retry logic for payment provider",
  url: "https://github.com/acme/payments/pull/412",
  author: "octocat",
  head_ref: "feature/payment-retry",
  base_ref: "main",
  head_sha: "a1b2c3d4e5f6a7b8",
} as const;

export const completedRun = {
  id: "run_8f21",
  pull_request: PULL_REQUEST,
  status: "completed",
  created_at: "2026-09-15T09:12:03.000Z",
  finished_at: "2026-09-15T09:13:31.000Z",
  finding_count: 3,
} as const;

export const failedRun = {
  id: "run_7c02",
  pull_request: {
    ...PULL_REQUEST,
    number: 408,
    title: "Bump dependencies",
    url: "https://github.com/acme/payments/pull/408",
    head_ref: "chore/bump-deps",
  },
  status: "failed",
  created_at: "2026-09-14T17:41:10.000Z",
  finished_at: "2026-09-14T17:41:52.000Z",
  finding_count: 0,
} as const;

export const olderRuns = Array.from({ length: 12 }, (_, index) => ({
  id: `run_old_${String(index)}`,
  pull_request: {
    ...PULL_REQUEST,
    number: 400 - index,
    title: `Refactor settlement job (part ${String(index + 1)})`,
    url: `https://github.com/acme/payments/pull/${String(400 - index)}`,
    author: index % 3 === 0 ? "hubot" : "octocat",
    head_ref: `refactor/settlement-${String(index)}`,
  },
  status: "completed" as const,
  created_at: new Date(
    Date.parse("2026-09-13T12:00:00.000Z") - index * 3_600_000,
  ).toISOString(),
  finished_at: new Date(
    Date.parse("2026-09-13T12:01:02.000Z") - index * 3_600_000,
  ).toISOString(),
  finding_count: index % 4,
}));

export const activeRun = {
  id: "run_9a44",
  pull_request: {
    ...PULL_REQUEST,
    number: 415,
    title: "Handle provider timeouts",
    url: "https://github.com/acme/payments/pull/415",
    head_ref: "feature/provider-timeouts",
  },
  status: "reviewing",
  created_at: new Date(Date.now() - 42_000).toISOString(),
  finished_at: null,
  finding_count: 0,
} as const;

export const completedRunDetails = {
  ...completedRun,
  stages: [
    {
      name: "collecting_context",
      started_at: "2026-09-15T09:12:03.000Z",
      finished_at: "2026-09-15T09:12:19.000Z",
    },
    {
      name: "reviewing",
      started_at: "2026-09-15T09:12:19.000Z",
      finished_at: "2026-09-15T09:13:14.000Z",
    },
    {
      name: "validating",
      started_at: "2026-09-15T09:13:14.000Z",
      finished_at: "2026-09-15T09:13:25.000Z",
    },
    {
      name: "publishing",
      started_at: "2026-09-15T09:13:25.000Z",
      finished_at: "2026-09-15T09:13:31.000Z",
    },
  ],
  summary:
    "Retries are added around the provider call. Two issues are worth a look: the retry loop keeps the database transaction open, and the backoff has no upper bound.",
  failure_reason: null,
} as const;

export const failedRunDetails = {
  ...failedRun,
  stages: [
    {
      name: "collecting_context",
      started_at: "2026-09-14T17:41:10.000Z",
      finished_at: "2026-09-14T17:41:52.000Z",
    },
  ],
  summary: null,
  failure_reason:
    "The diff exceeded the context budget: 412 changed files, 61k lines.",
} as const;

/** The file the findings point at, used both for the snippets and for unfolding context. */
export const PAYMENT_SERVICE_FILE = {
  path: "src/payment_service.rb",
  lineCount: 180,
  lines: Array.from(
    { length: 180 },
    (_, index) => `  # line ${String(index + 1)} of payment_service.rb`,
  ),
};

export const findings = [
  {
    id: "finding_1",
    file_path: PAYMENT_SERVICE_FILE.path,
    line: 142,
    side: "RIGHT",
    severity: "high",
    category: "correctness",
    message:
      "The transaction stays open while the provider is retried. A slow provider holds the row locks for the whole backoff window, which can stall unrelated payments.",
    suggestion: {
      before: [
        "    with_transaction do",
        "      charge_with_retries(account, amount)",
        "    end",
      ],
      after: [
        "    charge_with_retries(account, amount)",
        "    with_transaction do",
        "      record_settlement(account, amount)",
        "    end",
      ],
    },
    published_at: "2026-09-15T09:13:28.000Z",
    external_url: "https://github.com/acme/payments/pull/412#discussion_r1",
    snippet: {
      path: PAYMENT_SERVICE_FILE.path,
      old_path: null,
      status: "modified",
      hunks: [
        {
          id: "hunk_1",
          old_start: 138,
          old_lines: 4,
          new_start: 138,
          new_lines: 7,
          header: "def process_payment(user, amount)",
          lines: [
            {
              type: "context",
              old_line: 138,
              new_line: 138,
              content: "    account = get_account(user)",
            },
            { type: "context", old_line: 139, new_line: 139, content: "" },
            {
              type: "removed",
              old_line: 140,
              new_line: null,
              content: "    charge(account, amount)",
            },
            {
              type: "added",
              old_line: null,
              new_line: 140,
              content: "    with_transaction do",
            },
            {
              type: "added",
              old_line: null,
              new_line: 141,
              content: "      # retry the provider until it answers",
            },
            {
              type: "added",
              old_line: null,
              new_line: 142,
              content: "      charge_with_retries(account, amount)",
            },
            {
              type: "added",
              old_line: null,
              new_line: 143,
              content: "    end",
            },
            { type: "context", old_line: 141, new_line: 144, content: "  end" },
          ],
        },
      ],
    },
    file_line_count: PAYMENT_SERVICE_FILE.lineCount,
  },
  {
    id: "finding_2",
    file_path: PAYMENT_SERVICE_FILE.path,
    line: 158,
    side: "RIGHT",
    severity: "medium",
    category: "performance",
    message:
      "The backoff doubles without an upper bound, so the fifth attempt waits over a minute. Cap the delay and the total number of attempts.",
    suggestion: null,
    published_at: "2026-09-15T09:13:29.000Z",
    external_url: "https://github.com/acme/payments/pull/412#discussion_r2",
    snippet: {
      path: PAYMENT_SERVICE_FILE.path,
      old_path: null,
      status: "modified",
      hunks: [
        {
          id: "hunk_2",
          old_start: 152,
          old_lines: 3,
          new_start: 155,
          new_lines: 6,
          header: "def charge_with_retries(account, amount)",
          lines: [
            {
              type: "context",
              old_line: 152,
              new_line: 155,
              content: "    delay = 1",
            },
            {
              type: "context",
              old_line: 153,
              new_line: 156,
              content: "    attempts = 0",
            },
            {
              type: "added",
              old_line: null,
              new_line: 157,
              content: "    loop do",
            },
            {
              type: "added",
              old_line: null,
              new_line: 158,
              content: "      delay *= 2",
            },
            {
              type: "added",
              old_line: null,
              new_line: 159,
              content: "      sleep(delay)",
            },
            {
              type: "context",
              old_line: 154,
              new_line: 160,
              content: "    end",
            },
          ],
        },
      ],
    },
    file_line_count: PAYMENT_SERVICE_FILE.lineCount,
  },
  {
    id: "finding_3",
    file_path: "src/webhooks_controller.rb",
    line: 64,
    side: "RIGHT",
    severity: "critical",
    category: "security",
    message:
      "The provider webhook is processed before its signature is verified, so anyone who knows the URL can mark a payment as settled.",
    suggestion: {
      before: ["    process(payload)"],
      after: [
        "    return head :unauthorized unless valid_signature?(request)",
        "",
        "    process(payload)",
      ],
    },
    published_at: "2026-09-15T09:13:30.000Z",
    external_url: "https://github.com/acme/payments/pull/412#discussion_r3",
    snippet: {
      path: "src/webhooks_controller.rb",
      old_path: null,
      status: "modified",
      hunks: [
        {
          id: "hunk_3",
          old_start: 60,
          old_lines: 3,
          new_start: 60,
          new_lines: 5,
          header: "def provider_callback",
          lines: [
            {
              type: "context",
              old_line: 60,
              new_line: 60,
              content: "    payload = JSON.parse(request.body.read)",
            },
            { type: "context", old_line: 61, new_line: 61, content: "" },
            {
              type: "added",
              old_line: null,
              new_line: 62,
              content: "    # TODO: verify signature",
            },
            { type: "added", old_line: null, new_line: 63, content: "" },
            {
              type: "added",
              old_line: null,
              new_line: 64,
              content: "    process(payload)",
            },
            { type: "context", old_line: 62, new_line: 65, content: "  end" },
          ],
        },
      ],
    },
    file_line_count: 120,
  },
] as const;

/** A finding the backend would have dropped: its line is not part of the diff. */
export const findingOutsideDiff = {
  ...findings[0],
  id: "finding_out_of_range",
  line: 900,
  message:
    "This position does not exist in the diff and must never be rendered.",
} as const;

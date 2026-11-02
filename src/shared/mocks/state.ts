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

/** The user's own account, with the app installed on it too. */
const PERSONAL = {
  id: "acct_octocat",
  login: "octocat",
  name: "Octo Cat",
  avatar_url: "https://avatars.githubusercontent.com/u/583231?v=4",
} as const;

export const MOCK_ORGANIZATION_ID = ORG.id;
export const MOCK_PERSONAL_ACCOUNT = PERSONAL;

export type MockRole = "member" | "owner" | "platform-admin";

/**
 * The GET /me answer. Without an organisation the user signed in, but the app is not
 * installed anywhere they belong.
 */
export function sessionFor(role: MockRole, hasOrganization = true) {
  return {
    user: {
      id: "u_octocat",
      login: "octocat",
      name: "Octo Cat",
      avatar_url: "https://avatars.githubusercontent.com/u/583231?v=4",
      is_platform_admin: role === "platform-admin",
    },
    // The user owns their personal account whatever their role in "acme".
    organizations: hasOrganization
      ? [
          { ...ORG, role: role === "owner" ? "owner" : "member" },
          { ...PERSONAL, role: "owner" },
        ]
      : [],
    current_organization_id: hasOrganization ? ORG.id : null,
  };
}

/** Connected repositories of the "acme" organisation, in the wire format. */
export const REPOSITORIES = [
  ["api", true, "2026-10-03T09:12:00.000Z"],
  ["payments", true, "2026-10-02T08:30:00.000Z"],
  ["web", false, "2026-09-30T16:45:00.000Z"],
  ["mobile", true, null],
  ["billing", true, "2026-09-12T11:00:00.000Z"],
  ["docs", false, "2026-08-28T10:20:00.000Z"],
  ["infra", true, null],
  ["auth-service", true, "2026-09-25T13:05:00.000Z"],
  ["design-system", false, "2026-09-18T15:40:00.000Z"],
  ["analytics", true, null],
  ["notifications", true, "2026-09-05T07:55:00.000Z"],
].map(([name, isPrivate, lastRunAt], index) => ({
  id: `repo_${String(index + 1)}`,
  owner: ORG.login,
  name: String(name),
  private: isPrivate === true,
  default_branch: "main",
  html_url: `https://github.com/${ORG.login}/${String(name)}`,
  // Alternating, so both renderings stay exercised: the backend sends null for
  // every repository today, but the field may be filled in later.
  connected_at: index % 2 === 0 ? "2026-08-15T10:00:00.000Z" : null,
  last_run_at: typeof lastRunAt === "string" ? lastRunAt : null,
  organization_id: ORG.id,
}));

/** Connected repositories of the user's personal account, listed next to "acme". */
export const PERSONAL_REPOSITORIES = [
  ["dotfiles", false, "2026-10-01T18:20:00.000Z"],
  ["side-project", true, null],
].map(([name, isPrivate, lastRunAt], index) => ({
  id: `repo_personal_${String(index + 1)}`,
  owner: PERSONAL.login,
  name: String(name),
  private: isPrivate === true,
  default_branch: "main",
  html_url: `https://github.com/${PERSONAL.login}/${String(name)}`,
  connected_at: null,
  last_run_at: typeof lastRunAt === "string" ? lastRunAt : null,
  organization_id: PERSONAL.id,
}));

/** What "connecting" adds in mock mode, one per click, in this order. */
export const REPOSITORIES_TO_CONNECT = [
  "search",
  "worker",
  "cli",
  "sdk",
  "status-page",
];

const PULL_REQUEST = {
  provider: "github",
  repo_full_name: "acme/payments",
  number: 412,
  title: "Add retry logic for payment provider",
  url: "https://github.com/acme/payments/pull/412",
  author: "octocat",
  head_ref: "feature/payment-retry",
  base_ref: "main",
  head_sha: "a1b2c3d4e5f6a7b8",
} as const;

/** A pipeline step of the job detail, in the order the worker runs them. */
function step(
  name: string,
  stage: string,
  startedAt: string,
  finishedAt: string | null,
  status = finishedAt === null ? "RUNNING" : "OK",
) {
  return {
    step: name,
    status,
    stage,
    attempt: 0,
    started_at: startedAt,
    finished_at: finishedAt,
    error_kind: status === "FAILED" ? "diff_too_large" : null,
    metrics: {},
  };
}

export const completedJob = {
  id: "run_8f21",
  pull_request: PULL_REQUEST,
  status: "COMPLETED",
  trigger: "webhook",
  created_at: "2026-09-15T09:12:03.000Z",
  started_at: "2026-09-15T09:12:03.000Z",
  finished_at: "2026-09-15T09:13:31.000Z",
  finding_count: 5,
  error_kind: null,
  retry_count: 0,
  next_attempt_at: null,
} as const;

export const failedJob = {
  ...completedJob,
  id: "run_7c02",
  pull_request: {
    ...PULL_REQUEST,
    number: 408,
    title: "Bump dependencies",
    url: "https://github.com/acme/payments/pull/408",
    head_ref: "chore/bump-deps",
  },
  status: "FAILED",
  created_at: "2026-09-14T17:41:10.000Z",
  started_at: "2026-09-14T17:41:10.000Z",
  finished_at: "2026-09-14T17:41:52.000Z",
  finding_count: 0,
  error_kind: "diff_too_large",
} as const;

export const olderJobs = Array.from({ length: 12 }, (_, index) => ({
  ...completedJob,
  id: `run_old_${String(index)}`,
  pull_request: {
    ...PULL_REQUEST,
    number: 400 - index,
    title: `Refactor settlement job (part ${String(index + 1)})`,
    url: `https://github.com/acme/payments/pull/${String(400 - index)}`,
    author: index % 3 === 0 ? "hubot" : "octocat",
    head_ref: `refactor/settlement-${String(index)}`,
  },
  created_at: new Date(
    Date.parse("2026-09-13T12:00:00.000Z") - index * 3_600_000,
  ).toISOString(),
  finished_at: new Date(
    Date.parse("2026-09-13T12:01:02.000Z") - index * 3_600_000,
  ).toISOString(),
  finding_count: index % 4,
}));

/**
 * `.review/rules.md` at each job's head SHA, in the wire format of GET /jobs/{id}/rules
 * minus `path`, `ref` and `file_url`, which `rules.ts` derives from the job. Jobs not
 * listed here have no rules file.
 */
export const JOB_RULES: Readonly<
  Record<
    string,
    {
      readonly status: string;
      readonly rules: readonly {
        readonly id: string;
        readonly section: string;
        readonly text: string;
      }[];
      readonly dropped_suspicious: number;
      readonly dropped_over_limit: number;
    }
  >
> = {
  run_8f21: {
    status: "applied",
    rules: [
      {
        id: "R1",
        section: "Payments",
        text: "Amounts are integers in minor units; flag any float arithmetic on money.",
      },
      {
        id: "R2",
        section: "Payments",
        text: "Every call to the payment provider has an idempotency key.",
      },
      {
        id: "R3",
        section: "Security",
        text: "SQL is built only through bound parameters or the query builder, never by string formatting.",
      },
      {
        id: "R4",
        section: "Performance",
        text: "Flag any query inside a loop over request items.",
      },
    ],
    dropped_suspicious: 1,
    dropped_over_limit: 0,
  },
  run_9a44: {
    status: "applied",
    rules: [
      {
        id: "R1",
        section: "Payments",
        text: "Every call to the payment provider has a timeout.",
      },
    ],
    dropped_suspicious: 0,
    dropped_over_limit: 0,
  },
  run_old_0: {
    status: "rejected:too_large",
    rules: [],
    dropped_suspicious: 0,
    dropped_over_limit: 0,
  },
  run_old_1: {
    status: "ignored:forbidden",
    rules: [],
    dropped_suspicious: 0,
    dropped_over_limit: 0,
  },
  run_old_2: {
    status: "applied",
    rules: [],
    dropped_suspicious: 0,
    dropped_over_limit: 0,
  },
};

/** The timestamps are placeholders: `active-job.ts` replaces them when the mocks start. */
export const activeJob = {
  ...completedJob,
  id: "run_9a44",
  pull_request: {
    ...PULL_REQUEST,
    number: 415,
    title: "Handle provider timeouts",
    url: "https://github.com/acme/payments/pull/415",
    head_ref: "feature/provider-timeouts",
  },
  status: "PROCESSING",
  created_at: "2026-09-15T10:00:00.000Z",
  started_at: "2026-09-15T10:00:00.000Z",
  finished_at: null,
  finding_count: 0,
} as const;

export const completedJobDetail = {
  ...completedJob,
  stage: "publishing",
  summary:
    "Retries are added around the provider call. Two issues are worth a look: the retry loop keeps the database transaction open, and the backoff has no upper bound.",
  error_log: null,
  external_check_url: null,
  steps: [
    step(
      "CLAIMED",
      "collecting_context",
      "2026-09-15T09:12:03.000Z",
      "2026-09-15T09:12:03.000Z",
    ),
    step(
      "FETCH_DIFF",
      "collecting_context",
      "2026-09-15T09:12:03.000Z",
      "2026-09-15T09:12:11.000Z",
    ),
    step(
      "BUILD_CONTEXT",
      "collecting_context",
      "2026-09-15T09:12:11.000Z",
      "2026-09-15T09:12:19.000Z",
    ),
    step(
      "LLM_CALL",
      "reviewing",
      "2026-09-15T09:12:19.000Z",
      "2026-09-15T09:13:14.000Z",
    ),
    step(
      "POSTPROCESS",
      "validating",
      "2026-09-15T09:13:14.000Z",
      "2026-09-15T09:13:25.000Z",
    ),
    step(
      "POST_FEEDBACK",
      "publishing",
      "2026-09-15T09:13:25.000Z",
      "2026-09-15T09:13:31.000Z",
    ),
  ],
} as const;

export const failedJobDetail = {
  ...failedJob,
  stage: "collecting_context",
  summary: null,
  error_log:
    "The diff exceeded the context budget: 412 changed files, 61k lines.",
  external_check_url: null,
  steps: [
    step(
      "CLAIMED",
      "collecting_context",
      "2026-09-14T17:41:10.000Z",
      "2026-09-14T17:41:10.000Z",
    ),
    step(
      "FETCH_DIFF",
      "collecting_context",
      "2026-09-14T17:41:10.000Z",
      "2026-09-14T17:41:52.000Z",
      "FAILED",
    ),
  ],
  findings: [],
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

/**
 * The published findings together with the code each one points at. The API sends the
 * two separately (`GET /jobs/{id}` and `.../findings/{id}/context`), so the fixtures are
 * split below.
 */
const FINDING_FIXTURES = [
  {
    id: "finding_1",
    path: PAYMENT_SERVICE_FILE.path,
    line: 142,
    side: "new",
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
    path: PAYMENT_SERVICE_FILE.path,
    line: 158,
    side: "new",
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
    path: "src/webhooks_controller.rb",
    line: 64,
    side: "new",
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
  {
    // TypeScript, so the viewer is exercised with a second grammar, and a replacement
    // that pairs line for line in the side-by-side view.
    id: "finding_4",
    path: "src/billing/invoice-total.ts",
    line: 24,
    side: "new",
    severity: "low",
    category: "maintainability",
    message:
      "`any` hides the shape of a line item here, so a missing price would only surface at runtime. The type is already exported two files away.",
    suggestion: null,
    published_at: "2026-09-15T09:13:31.000Z",
    external_url: "https://github.com/acme/payments/pull/412#discussion_r4",
    snippet: {
      path: "src/billing/invoice-total.ts",
      old_path: null,
      status: "modified",
      hunks: [
        {
          id: "hunk_4",
          old_start: 20,
          old_lines: 5,
          new_start: 20,
          new_lines: 6,
          header: "export function invoiceTotal(",
          lines: [
            {
              type: "context",
              old_line: 20,
              new_line: 20,
              content: "export function invoiceTotal(",
            },
            {
              type: "removed",
              old_line: 21,
              new_line: null,
              content: "  items: LineItem[],",
            },
            {
              type: "added",
              old_line: null,
              new_line: 21,
              content: "  items: any[],",
            },
            {
              type: "context",
              old_line: 22,
              new_line: 22,
              content: "): number {",
            },
            {
              type: "context",
              old_line: 23,
              new_line: 23,
              content: "  // Totals are in minor units; never round here.",
            },
            {
              type: "added",
              old_line: null,
              new_line: 24,
              content:
                "  return items.reduce((sum, item) => sum + item.price, 0);",
            },
          ],
        },
      ],
    },
    file_line_count: 64,
  },
  {
    // A Mermaid diagram: we have no grammar for it, so the viewer must stay plain and
    // still render the finding correctly.
    id: "finding_5",
    path: "diagrams/payment-retry.mmd",
    line: 7,
    side: "new",
    severity: "medium",
    category: "correctness",
    message:
      "The diagram shows the retry loop returning to `charge`, but the code retries `authorise`. One of the two is wrong, and the diagram is the cheaper one to fix.",
    suggestion: null,
    published_at: "2026-09-15T09:13:31.000Z",
    external_url: "https://github.com/acme/payments/pull/412#discussion_r5",
    snippet: {
      path: "diagrams/payment-retry.mmd",
      old_path: null,
      status: "modified",
      hunks: [
        {
          id: "hunk_5",
          old_start: 5,
          old_lines: 3,
          new_start: 5,
          new_lines: 4,
          header: null,
          lines: [
            {
              type: "context",
              old_line: 5,
              new_line: 5,
              content: "  provider-->>service: 502",
            },
            {
              type: "context",
              old_line: 6,
              new_line: 6,
              content: "  service->>service: backoff",
            },
            {
              type: "added",
              old_line: null,
              new_line: 7,
              content: "  service->>provider: charge (retry)",
            },
          ],
        },
      ],
    },
    file_line_count: 18,
  },
] as const;

export const findings = FINDING_FIXTURES.map((fixture) => ({
  id: fixture.id,
  path: fixture.path,
  line: fixture.line,
  side: fixture.side,
  severity: fixture.severity,
  category: fixture.category,
  message: fixture.message,
  suggestion: fixture.suggestion,
  published_at: fixture.published_at,
  external_url: fixture.external_url,
}));

/** GET /jobs/{id}/findings/{finding_id}/context, keyed by finding. */
export const findingContexts: Record<string, unknown> = Object.fromEntries(
  FINDING_FIXTURES.map((fixture) => [
    fixture.id,
    { ...fixture.snippet, file_line_count: fixture.file_line_count },
  ]),
);

/**
 * A finding on a commit the forge no longer has: its context answers 409, and the page
 * shows the comment with `path:line` instead of the code.
 */
export const findingWithoutContext = {
  id: "finding_commit_gone",
  path: "src/legacy/settlement.rb",
  line: 12,
  side: "new",
  severity: "low",
  category: "maintainability",
  suggestion: null,
  message:
    "This comment was made on a commit that has since been force-pushed away, so its code can no longer be shown.",
  published_at: "2026-09-15T09:13:31.000Z",
  external_url: "https://github.com/acme/payments/pull/412#discussion_r6",
} as const;

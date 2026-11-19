import { describe, expect, it, vi } from "vitest";

import { AppError } from "@/shared/lib/errors";
import { type HttpClient, type HttpRequestOptions } from "@/shared/lib/http";

import { createHttpPlaygroundRepository } from "./http-playground-repository";

/** Shaped like `api/playground.py` answers. */
const WIRE_PARSED = {
  rules: [
    {
      id: "R1",
      section: "Security",
      category: "security",
      text: "Bind every SQL parameter.",
      line_start: 2,
      line_end: 3,
    },
    {
      id: "R2",
      section: "Payments",
      category: null,
      text: "Money is integer cents.",
      line_start: 6,
      line_end: 6,
    },
  ],
  ignore: [{ kind: "path", value: "gen/**", line_start: 9, line_end: 9 }],
  diagnostics: [
    { code: "section_other", dropped: false, line_start: 5, line_end: 5 },
    { code: "rule_from_the_future", dropped: true, line_start: 7, line_end: 7 },
  ],
  dropped_suspicious: 0,
  dropped_over_limit: 0,
  limits: { bytes: 65536, rules: 50, rule_chars: 8000, ignore: 100 },
};

function fakeHttp(answer: () => unknown) {
  const post =
    vi.fn<
      (
        path: string,
        body: unknown,
        options: HttpRequestOptions<unknown>,
      ) => void
    >();
  const http: HttpClient = {
    get: () => Promise.reject(new Error("not used")),
    post: (path, body, options) => {
      post(path, body, options);

      try {
        return Promise.resolve(options.schema.parse(answer()));
      } catch (error) {
        return Promise.reject(error instanceof Error ? error : new Error("?"));
      }
    },
  };

  return Object.assign(http, { calls: { post } });
}

describe("createHttpPlaygroundRepository", () => {
  it("posts the draft and maps the parse", async () => {
    const http = fakeHttp(() => WIRE_PARSED);

    const result = await createHttpPlaygroundRepository(http).parseRules(
      "# Security\n- Bind every SQL parameter.\n",
    );

    expect(http.calls.post.mock.calls[0]?.slice(0, 2)).toEqual([
      "/playground/rules/parse",
      { rules_markdown: "# Security\n- Bind every SQL parameter.\n" },
    ]);
    expect(result).toEqual({
      kind: "parsed",
      draft: {
        rules: [
          {
            id: "R1",
            section: "Security",
            category: "security",
            text: "Bind every SQL parameter.",
            lineStart: 2,
            lineEnd: 3,
          },
          {
            id: "R2",
            section: "Payments",
            category: null,
            text: "Money is integer cents.",
            lineStart: 6,
            lineEnd: 6,
          },
        ],
        ignore: [{ kind: "path", value: "gen/**", lineStart: 9, lineEnd: 9 }],
        diagnostics: [
          { code: "section_other", dropped: false, lineStart: 5, lineEnd: 5 },
          { code: "unknown", dropped: true, lineStart: 7, lineEnd: 7 },
        ],
        limits: { bytes: 65536, rules: 50, ruleChars: 8000, ignore: 100 },
      },
    });
  });

  it("turns the backend's 413 into a too-large answer", async () => {
    const http = fakeHttp(() => {
      throw new AppError("validation", "too large", 413);
    });

    await expect(
      createHttpPlaygroundRepository(http).parseRules("ab"),
    ).resolves.toEqual({ kind: "too-large", bytes: 2, limit: 65536 });
  });

  it("lets any other failure through", async () => {
    const http = fakeHttp(() => {
      throw new AppError("server", "down", 503);
    });

    await expect(
      createHttpPlaygroundRepository(http).parseRules("ab"),
    ).rejects.toMatchObject({ kind: "server" });
  });
});

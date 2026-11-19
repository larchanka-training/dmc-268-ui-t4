import { describe, expect, it, vi } from "vitest";

import { RULES_MAX_BYTES } from "../domain/draft-rules";

import { type DraftParseResult, type PlaygroundRepository } from "./ports";
import { parseDraftRules } from "./use-cases";

const PARSED: DraftParseResult = {
  kind: "parsed",
  draft: {
    rules: [],
    ignore: [],
    diagnostics: [],
    limits: { bytes: 65536, rules: 50, ruleChars: 8000, ignore: 100 },
  },
};

function repository() {
  const parseRules = vi.fn<PlaygroundRepository["parseRules"]>(() =>
    Promise.resolve(PARSED),
  );

  return { parseRules };
}

describe("parseDraftRules", () => {
  it("asks the backend for a draft within the limit", async () => {
    const playground = repository();

    await expect(parseDraftRules({ playground }, "# Security\n")).resolves.toBe(
      PARSED,
    );
    expect(playground.parseRules).toHaveBeenCalledWith(
      "# Security\n",
      undefined,
    );
  });

  it("answers a draft over the limit itself, without a request", async () => {
    const playground = repository();
    const markdown = "я".repeat(RULES_MAX_BYTES / 2 + 1);

    await expect(parseDraftRules({ playground }, markdown)).resolves.toEqual({
      kind: "too-large",
      bytes: RULES_MAX_BYTES + 2,
      limit: RULES_MAX_BYTES,
    });
    expect(playground.parseRules).not.toHaveBeenCalled();
  });
});

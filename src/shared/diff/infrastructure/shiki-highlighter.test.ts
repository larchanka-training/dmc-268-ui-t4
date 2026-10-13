import { describe, expect, it } from "vitest";

import { createShikiHighlighter } from "./shiki-highlighter";

/**
 * The adapter is thin, but it is the one place that depends on another project's API, and
 * a change there would otherwise show up as code that quietly stops being coloured.
 */
describe("createShikiHighlighter", () => {
  it("returns one entry per line, with a colour for each theme", async () => {
    const lines = await createShikiHighlighter().highlight(
      "def charge\n  pay(1)\nend",
      "ruby",
    );

    expect(lines).toHaveLength(3);

    const keyword = lines?.[0]?.[0];

    expect(keyword?.content).toBe("def");
    expect(typeof keyword?.style?.["--shiki-light"]).toBe("string");
    expect(typeof keyword?.style?.["--shiki-dark"]).toBe("string");
  });

  it("returns null for a file we have no grammar for, instead of throwing", async () => {
    expect(
      await createShikiHighlighter().highlight("a-->b", "mermaidish"),
    ).toBeNull();
  });
});

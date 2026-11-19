import { StringStream } from "@codemirror/language";
import { describe, expect, it } from "vitest";

import { rulesStreamParser } from "./rules-language";

/** The [token, text] pairs of each line, the way CodeMirror feeds the parser. */
function tokens(text: string): [string | null, string][][] {
  const parser = rulesStreamParser;
  const state = parser.startState?.(2) ?? { inComment: false };

  return text.split("\n").map((line) => {
    const stream = new StringStream(line, 2, 2);
    const out: [string | null, string][] = [];

    while (!stream.eol()) {
      stream.start = stream.pos;
      const token = parser.token(stream, state);
      out.push([token, line.slice(stream.start, stream.pos)]);
    }

    return out;
  });
}

describe("rulesStreamParser", () => {
  it("marks headings, list marks and inline code", () => {
    expect(tokens("# Security\n- Bind `sql` here")).toEqual([
      [
        ["meta", "#"],
        ["heading", " Security"],
      ],
      [
        ["meta", "-"],
        [null, " Bind "],
        ["monospace", "`sql`"],
        [null, " here"],
      ],
    ]);
  });

  it("carries an HTML comment across lines", () => {
    expect(tokens("<!-- a\nb -->- c")).toEqual([
      [["comment", "<!-- a"]],
      [
        ["comment", "b -->"],
        [null, "- c"],
      ],
    ]);
  });

  it("does not take a hash without a space for a heading", () => {
    expect(tokens("#tag")).toEqual([[[null, "#tag"]]]);
  });
});

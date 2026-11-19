import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { type ParsedDraft } from "../../domain/draft-rules";

import { ParsedDraftView } from "./parsed-draft-view";

const DRAFT: ParsedDraft = {
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
    { code: "ignore_security", dropped: true, lineStart: 10, lineEnd: 10 },
  ],
  limits: { bytes: 65536, rules: 50, ruleChars: 8000, ignore: 100 },
};

function render(draft: ParsedDraft): string {
  return renderToStaticMarkup(
    createElement(ParsedDraftView, { draft, onSelect: () => undefined }),
  );
}

describe("ParsedDraftView", () => {
  it("lists rules by section with their category and lines", () => {
    const html = render(DRAFT);

    expect(html).toContain(
      "2 rules of 50 · 1 ignore directive · 1 item dropped",
    );
    expect(html).toContain(">Security</h3>");
    expect(html).toContain(">L2–3</button>");
    expect(html).toContain(">guidance</span>");
    expect(html).toContain("gen/**");
    expect(html).toContain("security findings cannot be muted");
  });

  it("explains an empty draft", () => {
    const html = render({ ...DRAFT, rules: [], ignore: [], diagnostics: [] });

    expect(html).toContain("No rules yet");
    expect(html).not.toContain("Notes");
  });
});

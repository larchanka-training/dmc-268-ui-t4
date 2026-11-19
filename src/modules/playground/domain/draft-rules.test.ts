import { describe, expect, it } from "vitest";

import {
  type DraftRule,
  type ParsedDraft,
  clampSpan,
  droppedCount,
  groupDraftBySection,
  toDiagnosticCode,
  toRuleCategory,
  utf8Length,
} from "./draft-rules";

function rule(id: string, section: string): DraftRule {
  return { id, section, category: null, text: id, lineStart: 1, lineEnd: 1 };
}

describe("draft rules", () => {
  it("measures a draft in UTF-8 bytes, as the backend's limit does", () => {
    expect(utf8Length("abc")).toBe(3);
    expect(utf8Length("я")).toBe(2);
  });

  it("keeps a code it knows and calls a newer one unknown", () => {
    expect(toDiagnosticCode("rule_suspicious")).toBe("rule_suspicious");
    expect(toDiagnosticCode("rule_from_the_future")).toBe("unknown");
  });

  it("shows a category it does not know as other guidance", () => {
    expect(toRuleCategory("security")).toBe("security");
    expect(toRuleCategory("style")).toBeNull();
    expect(toRuleCategory(null)).toBeNull();
  });

  it("groups rules by section in the order sections first appear", () => {
    const sections = groupDraftBySection([
      rule("R1", "Security"),
      rule("R2", "Payments"),
      rule("R3", "Security"),
    ]);

    expect(sections.map((section) => section.title)).toEqual([
      "Security",
      "Payments",
    ]);
    expect(sections[0]?.rules.map((r) => r.id)).toEqual(["R1", "R3"]);
  });

  it("counts dropped items, not notes", () => {
    const draft: ParsedDraft = {
      rules: [],
      ignore: [],
      diagnostics: [
        { code: "section_other", dropped: false, lineStart: 1, lineEnd: 1 },
        { code: "rule_suspicious", dropped: true, lineStart: 2, lineEnd: 2 },
      ],
      limits: { bytes: 65536, rules: 50, ruleChars: 8000, ignore: 100 },
    };

    expect(droppedCount(draft)).toBe(1);
  });

  it("clamps a span into the document", () => {
    expect(clampSpan({ lineStart: 4, lineEnd: 9 }, 6)).toEqual({
      lineStart: 4,
      lineEnd: 6,
    });
    expect(clampSpan({ lineStart: 12, lineEnd: 14 }, 6)).toEqual({
      lineStart: 6,
      lineEnd: 6,
    });
    expect(clampSpan({ lineStart: 1, lineEnd: 1 }, 0)).toEqual({
      lineStart: 1,
      lineEnd: 1,
    });
  });
});

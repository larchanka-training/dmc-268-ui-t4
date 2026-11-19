/**
 * POST /playground/rules/parse for the mocks: a small stand-in for the backend's parser
 * (`adapters/llm/rules.py`), in the wire format. It follows the same reading of the file
 * (headings, list items, `# Ignore` directives, line numbers, the limits) but only a few
 * of the suspicious-rule patterns, so a demo can show every kind of note.
 */

const RULES_MAX = 50;
const RULES_MAX_CHARS = 8000;
const IGNORE_MAX = 100;
const RULES_MAX_BYTES = 64 * 1024;

const SECTION_CATEGORIES: Record<string, string> = {
  security: "security",
  correctness: "correctness",
  performance: "performance",
  concurrency: "concurrency",
  style: "maintainability",
};
const MUTABLE_CATEGORIES = new Set([
  "correctness",
  "concurrency",
  "performance",
  "maintainability",
]);

const SUSPICIOUS = [
  /\b(?:ignore|disregard|forget)\b.{0,40}?\b(?:all|previous|prior|above|earlier)\b.{0,40}?\binstructions?\b/i,
  /\bsystem\s+prompt\b/i,
  /\byou\s+are\s+now\b/i,
];

const HEADING = /^ {0,3}#{1,6}\s+(.*?)\s*#*\s*$/;
const LIST_ITEM = /^ {0,3}(?:[-*+]|\d{1,9}[.)])\s+(.*)$/;
const DIRECTIVE = /^(path|category)\s*:\s*(.*)$/i;

interface Item {
  section: string;
  sectionLine: number;
  text: string;
  start: number;
  end: number;
}

function splitItems(markdown: string): Item[] {
  const items: Item[] = [];
  let section = "General";
  let sectionLine = 0;
  let current: { parts: string[]; start: number; end: number } | null = null;

  const close = () => {
    if (current !== null) {
      const text = current.parts.join(" ").replace(/\s+/g, " ").trim();

      if (text) {
        items.push({ section, sectionLine, text, ...current });
      }
    }

    current = null;
  };

  markdown.split("\n").forEach((line, index) => {
    const number = index + 1;
    const heading = HEADING.exec(line);
    const item = LIST_ITEM.exec(line);

    if (heading) {
      close();
      section = (heading[1] ?? "").replace(/\s+/g, " ").trim() || "General";
      sectionLine = number;
    } else if (item) {
      close();
      current = { parts: [item[1] ?? ""], start: number, end: number };
    } else if (!line.trim()) {
      return;
    } else if (current !== null && /^[ \t]/.test(line)) {
      current.parts.push(line);
      current.end = number;
    } else {
      close();
    }
  });
  close();

  return items;
}

export function mockParseRules(markdown: string) {
  const text = markdown
    .replace(/\r\n?/g, "\n")
    .replace(/<!--[\s\S]*?(?:-->|$)/g, (comment) =>
      "\n".repeat(comment.split("\n").length - 1),
    );
  const rules: object[] = [];
  const ignore: object[] = [];
  const diagnostics: object[] = [];
  const notedSections = new Set<number>();
  let suspicious = 0;
  let overLimit = 0;
  let chars = 0;

  const note = (code: string, start: number, end: number) => {
    diagnostics.push({
      code,
      dropped: code !== "section_other",
      line_start: start,
      line_end: end,
    });
  };

  for (const item of splitItems(text)) {
    const title = item.section.trim().toLowerCase();

    if (title === "ignore") {
      const match = DIRECTIVE.exec(item.text);
      const kind = match?.[1]?.toLowerCase();
      const value = (match?.[2] ?? "").trim().replace(/^`+|`+$/g, "");

      if (ignore.length >= IGNORE_MAX) {
        note("ignore_over_limit", item.start, item.end);
      } else if (kind === "path" && value && !/^!|\s/.test(value)) {
        ignore.push({
          kind,
          value,
          line_start: item.start,
          line_end: item.end,
        });
      } else if (kind === "category" && value.toLowerCase() === "security") {
        note("ignore_security", item.start, item.end);
      } else if (
        kind === "category" &&
        MUTABLE_CATEGORIES.has(value.toLowerCase())
      ) {
        ignore.push({
          kind,
          value: value.toLowerCase(),
          line_start: item.start,
          line_end: item.end,
        });
      } else if (kind === "category") {
        note("ignore_unknown_category", item.start, item.end);
      } else {
        note("ignore_invalid", item.start, item.end);
      }

      continue;
    }

    const category = SECTION_CATEGORIES[title] ?? null;

    if (
      category === null &&
      item.sectionLine &&
      !notedSections.has(item.sectionLine)
    ) {
      notedSections.add(item.sectionLine);
      note("section_other", item.sectionLine, item.sectionLine);
    }

    if (
      SUSPICIOUS.some(
        (pattern) => pattern.test(item.text) || pattern.test(item.section),
      )
    ) {
      suspicious += 1;
      note("rule_suspicious", item.start, item.end);
    } else if (
      rules.length >= RULES_MAX ||
      chars + item.text.length > RULES_MAX_CHARS
    ) {
      overLimit += 1;
      note("rule_over_limit", item.start, item.end);
    } else {
      chars += item.text.length;
      rules.push({
        id: `R${String(rules.length + 1)}`,
        section: item.section,
        category,
        text: item.text,
        line_start: item.start,
        line_end: item.end,
      });
    }
  }

  return {
    rules,
    ignore,
    diagnostics,
    dropped_suspicious: suspicious,
    dropped_over_limit: overLimit,
    limits: {
      bytes: RULES_MAX_BYTES,
      rules: RULES_MAX,
      rule_chars: RULES_MAX_CHARS,
      ignore: IGNORE_MAX,
    },
  };
}

export function isOverRulesLimit(markdown: string): boolean {
  return new TextEncoder().encode(markdown).length > RULES_MAX_BYTES;
}

/**
 * A draft `.review/rules.md` as the backend's parser reads it (RULES_FORMAT_SPEC §2, §4):
 * the rules a review would send to the model, the `# Ignore` directives code applies, and
 * a note on every item that was dropped. The parser is the backend's, so the playground
 * never disagrees with a real review about what the file says.
 */

export type RuleCategory =
  | "security"
  | "correctness"
  | "concurrency"
  | "performance"
  | "maintainability";

const RULE_CATEGORIES: readonly RuleCategory[] = [
  "security",
  "correctness",
  "concurrency",
  "performance",
  "maintainability",
];

export type DiagnosticCode =
  | "section_other"
  | "rule_suspicious"
  | "rule_over_limit"
  | "ignore_invalid"
  | "ignore_unknown_category"
  | "ignore_security"
  | "ignore_over_limit"
  | "unknown";

const DIAGNOSTIC_CODES: readonly DiagnosticCode[] = [
  "section_other",
  "rule_suspicious",
  "rule_over_limit",
  "ignore_invalid",
  "ignore_unknown_category",
  "ignore_security",
  "ignore_over_limit",
];

/** Lines are 1-based and inclusive, counted as the editor counts them. */
export interface LineSpan {
  readonly lineStart: number;
  readonly lineEnd: number;
}

export interface DraftRule extends LineSpan {
  /** R1, R2, … numbered after filtering, as the model sees them. */
  readonly id: string;
  readonly section: string;
  /** The category of a recognised section; null for "other guidance". */
  readonly category: RuleCategory | null;
  readonly text: string;
}

export interface IgnoreDirective extends LineSpan {
  readonly kind: "path" | "category";
  readonly value: string;
}

export interface RulesDiagnostic extends LineSpan {
  readonly code: DiagnosticCode;
  /** Whether the item is left out of the review; false for a note. */
  readonly dropped: boolean;
}

export interface RulesLimits {
  /** Largest file a review accepts, in UTF-8 bytes. */
  readonly bytes: number;
  readonly rules: number;
  readonly ruleChars: number;
  readonly ignore: number;
}

export interface ParsedDraft {
  readonly rules: readonly DraftRule[];
  readonly ignore: readonly IgnoreDirective[];
  readonly diagnostics: readonly RulesDiagnostic[];
  readonly limits: RulesLimits;
}

export interface DraftRuleSection {
  readonly title: string;
  readonly rules: readonly DraftRule[];
}

/** The backend's limit (RULES_FORMAT_SPEC §4), checked here before a draft is sent. */
export const RULES_MAX_BYTES = 64 * 1024;

const encoder = new TextEncoder();

export function utf8Length(text: string): number {
  return encoder.encode(text).length;
}

export function toRuleCategory(value: string | null): RuleCategory | null {
  return RULE_CATEGORIES.find((category) => category === value) ?? null;
}

/** A code newer than this client becomes "unknown" rather than failing the screen. */
export function toDiagnosticCode(value: string): DiagnosticCode {
  return DIAGNOSTIC_CODES.find((code) => code === value) ?? "unknown";
}

/** Rules grouped by section, sections in the order they first appear in the file. */
export function groupDraftBySection(
  rules: readonly DraftRule[],
): readonly DraftRuleSection[] {
  const sections = new Map<string, DraftRule[]>();

  for (const rule of rules) {
    const section = sections.get(rule.section);

    if (section === undefined) {
      sections.set(rule.section, [rule]);
    } else {
      section.push(rule);
    }
  }

  return [...sections].map(([title, sectionRules]) => ({
    title,
    rules: sectionRules,
  }));
}

export function droppedCount(draft: ParsedDraft): number {
  return draft.diagnostics.filter((diagnostic) => diagnostic.dropped).length;
}

/**
 * A span clamped into a document of `lineCount` lines, so a result parsed from a slightly
 * older text never points past the end of the editor.
 */
export function clampSpan(span: LineSpan, lineCount: number): LineSpan {
  const last = Math.max(1, lineCount);
  const lineStart = Math.min(Math.max(1, span.lineStart), last);

  return {
    lineStart,
    lineEnd: Math.min(Math.max(lineStart, span.lineEnd), last),
  };
}

/** A starter file: every kind of section and directive the format knows. */
export const EXAMPLE_RULES = `# Security
- SQL is built only through bound parameters or the query builder, never by string formatting.
- Every handler under \`api/\` checks the tenant id before reading a row.

# Performance
- Flag any query inside a loop over request items.

# Style
- Public functions in \`domain/\` have a docstring.

# Payments
- Amounts are integers in minor units; flag any float arithmetic on money.

# Ignore
- path: gen/**
- path: *.snap
- category: maintainability
`;

/**
 * What `.review/rules.md` holds at a run's pull request head, the revision a review reads
 * rules from. Statuses follow the backend's RULES_FORMAT_SPEC §7; anything newer than
 * this client arrives as "unknown" rather than failing the screen.
 */
export type RulesStatus =
  | "absent"
  | "applied"
  | "rejected:too_large"
  | "rejected:encoding"
  | "ignored:forbidden"
  | "unknown";

export const RULES_STATUSES: readonly RulesStatus[] = [
  "absent",
  "applied",
  "rejected:too_large",
  "rejected:encoding",
  "ignored:forbidden",
];

export interface ReviewRule {
  /** R1, R2, … numbered after filtering, so the ids have no gaps. */
  readonly id: string;
  readonly section: string;
  readonly text: string;
}

export interface ReviewRules {
  readonly path: string;
  /** The head SHA that was read. */
  readonly ref: string;
  readonly status: RulesStatus;
  /**
   * The file on GitHub, or the page that creates it on the pull request's branch; null
   * when the branch is not known or the link is not https.
   */
  readonly fileUrl: string | null;
  readonly rules: readonly ReviewRule[];
  readonly droppedSuspicious: number;
  readonly droppedOverLimit: number;
}

export interface RuleSection {
  readonly title: string;
  readonly rules: readonly ReviewRule[];
}

export function toRulesStatus(value: string): RulesStatus {
  return RULES_STATUSES.find((status) => status === value) ?? "unknown";
}

/** Rules grouped by section, sections in the order they first appear in the file. */
export function groupBySection(
  rules: readonly ReviewRule[],
): readonly RuleSection[] {
  const sections = new Map<string, ReviewRule[]>();

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

/** True when reviews run on the built-in rules only, whatever the reason. */
export function usesDefaultRules(rules: ReviewRules): boolean {
  return rules.status !== "applied" || rules.rules.length === 0;
}

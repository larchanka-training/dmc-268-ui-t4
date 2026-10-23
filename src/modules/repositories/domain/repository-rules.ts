/**
 * What `.review/rules.md` holds on one branch of a connected repository, as the review
 * would read it. Statuses follow the backend's RULES_FORMAT_SPEC §7; anything newer than
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

export interface RepositoryRule {
  /** R1, R2, … numbered after filtering, so the ids have no gaps. */
  readonly id: string;
  readonly section: string;
  readonly text: string;
}

export interface RepositoryRules {
  readonly path: string;
  readonly ref: string;
  readonly status: RulesStatus;
  /** The file on GitHub, or the page that creates it; null when not https. */
  readonly fileUrl: string | null;
  readonly rules: readonly RepositoryRule[];
  readonly droppedSuspicious: number;
  readonly droppedOverLimit: number;
}

export interface RuleSection {
  readonly title: string;
  readonly rules: readonly RepositoryRule[];
}

export function toRulesStatus(value: string): RulesStatus {
  return RULES_STATUSES.find((status) => status === value) ?? "unknown";
}

/** Rules grouped by section, sections in the order they first appear in the file. */
export function groupBySection(
  rules: readonly RepositoryRule[],
): readonly RuleSection[] {
  const sections = new Map<string, RepositoryRule[]>();

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
export function usesDefaultRules(rules: RepositoryRules): boolean {
  return rules.status !== "applied" || rules.rules.length === 0;
}

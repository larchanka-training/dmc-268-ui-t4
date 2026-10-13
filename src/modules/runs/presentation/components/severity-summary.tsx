import {
  type Finding,
  type FindingSeverity,
  countBySeverity,
} from "../../domain/finding";

/** Most serious first, so the reader meets the worst number before the rest. */
const ORDER: readonly FindingSeverity[] = ["critical", "high", "medium", "low"];

const TEXT_STYLES: Record<FindingSeverity, string> = {
  critical: "text-severity-critical",
  high: "text-severity-high",
  medium: "text-severity-medium",
  low: "text-severity-low",
};

/**
 * What the agent found, counted by severity. It is a summary of this page, not a score:
 * nothing here is a number the backend could reproduce.
 */
export function SeveritySummary({
  findings,
}: {
  readonly findings: readonly Finding[];
}) {
  if (findings.length === 0) {
    return null;
  }

  const counts = countBySeverity(findings);
  const present = ORDER.filter((severity) => counts[severity] > 0);

  return (
    <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
      {present.map((severity) => (
        <span key={severity} className={TEXT_STYLES[severity]}>
          <span className="font-medium tabular-nums">{counts[severity]}</span>{" "}
          {severity}
        </span>
      ))}
    </p>
  );
}

import { cn } from "cn";

import {
  type FindingCategory,
  type FindingSeverity,
} from "../../domain/finding";

const SEVERITY_STYLES: Record<FindingSeverity, string> = {
  critical: "bg-severity-critical/15 text-severity-critical",
  high: "bg-severity-high/15 text-severity-high",
  medium: "bg-severity-medium/20 text-severity-medium",
  low: "bg-severity-low/15 text-severity-low",
};

export function SeverityBadge({ severity }: { severity: FindingSeverity }) {
  return (
    <span
      className={cn(
        SEVERITY_STYLES[severity],
        "rounded-sm px-1.5 py-0.5 text-[10px] font-medium uppercase",
      )}
    >
      {severity}
    </span>
  );
}

export function CategoryBadge({ category }: { category: FindingCategory }) {
  return (
    <span className="rounded-sm bg-surface-muted px-1.5 py-0.5 text-[10px] text-content-muted">
      {category}
    </span>
  );
}

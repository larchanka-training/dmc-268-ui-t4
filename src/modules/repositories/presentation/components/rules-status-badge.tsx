import { AlertTriangle, CheckCircle2, FileX, ShieldOff } from "lucide-react";

import { Badge } from "@/shared/ui/badge";

import { type RulesStatus } from "../../domain/repository-rules";

const LABELS: Record<RulesStatus, string> = {
  absent: "No rules.md",
  applied: "rules.md found",
  "rejected:too_large": "rules.md ignored",
  "rejected:encoding": "rules.md ignored",
  "ignored:forbidden": "Cannot read rules.md",
  unknown: "Unknown status",
};

/** Whether the branch carries `.review/rules.md`, and whether a review would use it. */
export function RulesStatusBadge({ status }: { status: RulesStatus }) {
  if (status === "applied") {
    return (
      <Badge variant="secondary">
        <CheckCircle2 className="size-3 text-severity-low" aria-hidden />
        {LABELS[status]}
      </Badge>
    );
  }

  if (status === "absent") {
    return (
      <Badge variant="outline">
        <FileX className="size-3" aria-hidden />
        {LABELS[status]}
      </Badge>
    );
  }

  if (status === "ignored:forbidden") {
    return (
      <Badge variant="destructive">
        <ShieldOff className="size-3" aria-hidden />
        {LABELS[status]}
      </Badge>
    );
  }

  return (
    <Badge variant="destructive">
      <AlertTriangle className="size-3" aria-hidden />
      {LABELS[status]}
    </Badge>
  );
}

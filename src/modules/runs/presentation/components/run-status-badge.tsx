import { CheckCircle2, CircleDashed, Loader2, XCircle } from "lucide-react";

import { Badge } from "@/shared/ui/badge";

import { type RunStatus } from "../../domain/run";

const LABELS: Record<RunStatus, string> = {
  queued: "Queued",
  collecting_context: "Collecting context",
  reviewing: "Reviewing",
  validating: "Validating",
  publishing: "Publishing",
  completed: "Completed",
  failed: "Failed",
};

export function RunStatusBadge({ status }: { status: RunStatus }) {
  if (status === "completed") {
    return (
      <Badge variant="secondary">
        <CheckCircle2 className="size-3" aria-hidden />
        {LABELS[status]}
      </Badge>
    );
  }

  if (status === "failed") {
    return (
      <Badge variant="destructive">
        <XCircle className="size-3" aria-hidden />
        {LABELS[status]}
      </Badge>
    );
  }

  return (
    <Badge variant="outline">
      {status === "queued" ? (
        <CircleDashed className="size-3" aria-hidden />
      ) : (
        <Loader2 className="size-3 animate-spin" aria-hidden />
      )}
      {LABELS[status]}
    </Badge>
  );
}

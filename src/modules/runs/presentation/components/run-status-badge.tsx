import {
  CheckCircle2,
  CircleDashed,
  Loader2,
  MinusCircle,
  XCircle,
} from "lucide-react";

import { Badge } from "@/shared/ui/badge";

import { type RunStatus } from "../../domain/run";

const LABELS: Record<RunStatus, string> = {
  queued: "Queued",
  processing: "In progress",
  collecting_context: "Collecting context",
  reviewing: "Reviewing",
  validating: "Validating",
  publishing: "Publishing",
  retrying: "Retrying",
  completed: "Completed",
  failed: "Failed",
  superseded: "Superseded",
  skipped: "Skipped",
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

  // Ended without a review, but not because something broke: a newer push took over, or
  // the configuration or quota said no.
  if (status === "superseded" || status === "skipped") {
    return (
      <Badge variant="outline">
        <MinusCircle className="size-3" aria-hidden />
        {LABELS[status]}
      </Badge>
    );
  }

  return (
    <Badge variant="outline">
      {status === "queued" || status === "retrying" ? (
        <CircleDashed className="size-3" aria-hidden />
      ) : (
        <Loader2 className="size-3 animate-spin" aria-hidden />
      )}
      {LABELS[status]}
    </Badge>
  );
}

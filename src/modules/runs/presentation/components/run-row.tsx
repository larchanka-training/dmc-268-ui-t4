import { Link } from "@tanstack/react-router";
import { MessageSquare } from "lucide-react";

import { formatDuration, formatRelativeTime } from "@/shared/lib/format";

import { type Run, repositoryName, runDuration } from "../../domain/run";

import { RunStatusBadge } from "./run-status-badge";

export function RunRow({ run }: { run: Run }) {
  return (
    <li className="border-b border-border last:border-b-0">
      <Link
        to="/runs/$runId"
        params={{ runId: run.id }}
        className="flex flex-col gap-1 px-4 py-3 hover:bg-surface-muted sm:flex-row sm:items-center sm:gap-4"
      >
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="truncate text-sm font-medium">
            {run.pullRequest.title}
          </span>
          <span className="truncate text-xs text-content-muted">
            {`${repositoryName(run.pullRequest)} #${String(run.pullRequest.number)} · ${run.pullRequest.author} · ${run.pullRequest.headRef} → ${run.pullRequest.baseRef}`}
          </span>
        </span>

        <span className="flex items-center gap-3 text-xs text-content-muted">
          <span className="inline-flex items-center gap-1">
            <MessageSquare className="size-3" aria-hidden />
            {run.findingCount}
          </span>
          <span className="tabular-nums">
            {formatDuration(runDuration(run))}
          </span>
          <time dateTime={run.createdAt}>
            {formatRelativeTime(run.createdAt)}
          </time>
          <RunStatusBadge status={run.status} />
        </span>
      </Link>
    </li>
  );
}

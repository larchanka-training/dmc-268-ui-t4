import { AlertTriangle, ExternalLink, GitPullRequest } from "lucide-react";
import { useEffect } from "react";

import {
  type ContextGap,
  type ExpandDirection,
} from "@/shared/diff/domain/types";
import { formatDateTime, formatDuration } from "@/shared/lib/format";
import { Button } from "@/shared/ui/button";
import { Skeleton } from "@/shared/ui/skeleton";

import { expandContext } from "../../application/use-cases";
import { type Finding, groupByFile } from "../../domain/finding";
import { repositoryName, runDuration } from "../../domain/run";
import { FindingCard } from "../components/finding-card";
import { RunStatusBadge } from "../components/run-status-badge";
import { RunTimeline } from "../components/run-timeline";
import { useRunsDependencies } from "../dependencies";
import { useRunDetails } from "../queries";
import { useRunDetailsStore } from "../run-details-store";

/**
 * Everything one run of the agent did: the pull request it looked at, how long each stage
 * took, the summary it posted and every finding it published, each with its diff.
 */
export function RunDetailsPage({ runId }: { runId: string }) {
  const dependencies = useRunsDependencies();
  const details = useRunDetails(runId);

  const addExpansion = useRunDetailsStore((state) => state.addExpansion);
  const setLoadingGapId = useRunDetailsStore((state) => state.setLoadingGapId);
  const reset = useRunDetailsStore((state) => state.reset);

  // Unfolded context belongs to one run; switching runs starts from the API snapshot again.
  useEffect(() => {
    reset();

    return reset;
  }, [runId, reset]);

  const handleExpand = (
    finding: Finding,
    gap: ContextGap,
    direction: ExpandDirection,
  ) => {
    const hunkId =
      direction === "down"
        ? (gap.previousHunkId ?? gap.nextHunkId)
        : (gap.nextHunkId ?? gap.previousHunkId);

    if (hunkId === null) {
      return;
    }

    setLoadingGapId(gap.id);

    void expandContext(dependencies, {
      runId,
      path: finding.position.path,
      gap,
      direction,
    })
      .then((lines) => {
        if (lines !== null) {
          addExpansion(finding.id, { hunkId, lines });
        }
      })
      .finally(() => {
        setLoadingGapId(null);
      });
  };

  if (details.isPending) {
    return <Skeleton className="h-96 w-full" />;
  }

  if (details.isError) {
    return (
      <div className="flex items-center gap-3 rounded-md border border-border bg-surface px-4 py-3 text-sm">
        <span>Could not load this run.</span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => void details.refetch()}
        >
          Retry
        </Button>
      </div>
    );
  }

  const { run, findings } = details.data;
  const groups = groupByFile(findings);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <GitPullRequest className="size-4 text-content-muted" aria-hidden />
          <h1 className="text-lg font-semibold">{run.pullRequest.title}</h1>
          <RunStatusBadge status={run.status} />
        </div>
        <p className="text-sm text-content-muted">
          {`${repositoryName(run.pullRequest)} #${String(run.pullRequest.number)} · ${run.pullRequest.author} · ${run.pullRequest.headRef} → ${run.pullRequest.baseRef} · ${run.pullRequest.headSha.slice(0, 7)}`}
        </p>
        <p className="text-xs text-content-muted">
          {`Started ${formatDateTime(run.createdAt)} · took ${formatDuration(runDuration(run))}`}
        </p>
        <a
          href={run.pullRequest.url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex w-fit items-center gap-1 text-sm hover:underline"
        >
          Open pull request on GitHub
          <ExternalLink className="size-3" aria-hidden />
        </a>
      </header>

      {run.failureReason === null ? null : (
        <div className="flex items-start gap-2 rounded-md border border-severity-critical/40 bg-severity-critical/10 px-4 py-3 text-sm">
          <AlertTriangle
            className="mt-0.5 size-4 text-severity-critical"
            aria-hidden
          />
          <div>
            <p className="font-medium">The run failed</p>
            <p className="text-content-muted">{run.failureReason}</p>
          </div>
        </div>
      )}

      <section className="grid gap-6 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="flex flex-col gap-2 rounded-md border border-border bg-surface p-4">
          <h2 className="text-sm font-semibold">Review summary</h2>
          <p className="text-sm whitespace-pre-line text-content-muted">
            {run.summary ?? "The agent has not posted a summary yet."}
          </p>
        </div>

        <div className="flex flex-col gap-3 rounded-md border border-border bg-surface p-4">
          <h2 className="text-sm font-semibold">Pipeline</h2>
          <RunTimeline run={run} />
        </div>
      </section>

      <section className="flex flex-col gap-6">
        <h2 className="text-sm font-semibold">
          {`Published findings (${String(findings.length)})`}
        </h2>

        {groups.length === 0 ? (
          <p className="text-sm text-content-muted">
            The agent published no comments for this pull request.
          </p>
        ) : (
          groups.map(([path, fileFindings]) => (
            <div key={path} className="flex flex-col gap-4">
              {fileFindings.map((finding) => (
                <FindingCard
                  key={finding.id}
                  finding={finding}
                  onExpand={handleExpand}
                />
              ))}
            </div>
          ))
        )}
      </section>
    </div>
  );
}

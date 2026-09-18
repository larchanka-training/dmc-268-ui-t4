import { CheckCircle2, CircleDashed, Loader2 } from "lucide-react";

import { formatDuration } from "@/shared/lib/format";

import {
  RUN_STAGES,
  type RunDetails,
  type RunStageName,
  stageDuration,
} from "../../domain/run";

const STAGE_LABELS: Record<RunStageName, string> = {
  collecting_context: "Collecting context",
  reviewing: "Reviewing",
  validating: "Validating findings",
  publishing: "Publishing to GitHub",
};

/** The pipeline the agent goes through, with how long each stage took. */
export function RunTimeline({ run }: { run: RunDetails }) {
  return (
    <ol className="flex flex-col gap-2">
      {RUN_STAGES.map((name) => {
        const stage = run.stages.find((candidate) => candidate.name === name);
        const isDone = stage?.finishedAt != null;
        const isRunning = stage !== undefined && !isDone;

        return (
          <li key={name} className="flex items-center gap-2 text-sm">
            {isDone ? (
              <CheckCircle2 className="size-4 text-severity-low" aria-hidden />
            ) : isRunning ? (
              <Loader2
                className="size-4 animate-spin text-content-muted"
                aria-hidden
              />
            ) : (
              <CircleDashed className="size-4 text-content-muted" aria-hidden />
            )}
            <span
              className={stage === undefined ? "text-content-muted" : undefined}
            >
              {STAGE_LABELS[name]}
            </span>
            {stage === undefined ? null : (
              <span className="ml-auto text-xs text-content-muted tabular-nums">
                {formatDuration(stageDuration(stage))}
              </span>
            )}
          </li>
        );
      })}
    </ol>
  );
}

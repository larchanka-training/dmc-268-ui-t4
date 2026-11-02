import { cn } from "cn";
import { Check, Loader2, X } from "lucide-react";

import { type RunDetails } from "../../domain/run";
import {
  type ProgressStepName,
  type ProgressStepState,
  progressSteps,
} from "../../domain/run-progress";

const STEP_LABELS: Record<ProgressStepName, string> = {
  context: "Collecting context",
  analysis: "LLM analysis",
  publishing: "Publishing",
};

const STATE_LABELS: Record<ProgressStepState, string> = {
  pending: "not started",
  running: "in progress",
  done: "done",
  failed: "failed",
};

const DOT_STYLES: Record<ProgressStepState, string> = {
  pending: "border-border text-content-muted",
  running: "border-content text-content",
  done: "border-severity-low bg-severity-low text-surface",
  failed: "border-severity-critical bg-severity-critical text-surface",
};

/**
 * The run step by step, at a glance. It follows the live run details, so it moves on its
 * own while the page is open; the Pipeline card below keeps the per-stage timings.
 */
export function RunProgress({ run }: { run: RunDetails }) {
  const steps = progressSteps(run);

  return (
    <ol className="flex items-center gap-2" aria-label="Review progress">
      {steps.map((step, index) => (
        <li
          key={step.name}
          className="flex min-w-0 flex-1 items-center gap-2 text-xs"
          aria-current={step.state === "running" ? "step" : undefined}
        >
          <span
            className={cn(
              "flex size-5 shrink-0 items-center justify-center rounded-full border",
              DOT_STYLES[step.state],
            )}
          >
            {step.state === "done" ? (
              <Check className="size-3" aria-hidden />
            ) : step.state === "failed" ? (
              <X className="size-3" aria-hidden />
            ) : step.state === "running" ? (
              <Loader2 className="size-3 animate-spin" aria-hidden />
            ) : (
              <span className="tabular-nums">{index + 1}</span>
            )}
          </span>
          <span
            className={cn(
              "truncate",
              step.state === "pending" && "text-content-muted",
            )}
          >
            {STEP_LABELS[step.name]}
            <span className="sr-only">{`, ${STATE_LABELS[step.state]}`}</span>
          </span>
          {index < steps.length - 1 ? (
            <span
              className={cn(
                "h-px min-w-4 flex-1",
                step.state === "done" ? "bg-severity-low" : "bg-border",
              )}
              aria-hidden
            />
          ) : null}
        </li>
      ))}
    </ol>
  );
}

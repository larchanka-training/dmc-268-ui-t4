import { type RunDetails, type RunStageName, isActiveStatus } from "./run";

/**
 * The three steps the console shows in the progress bar. Validating findings is part of
 * the LLM analysis for the reader, so two pipeline stages fold into one step.
 */
export const PROGRESS_STEPS = ["context", "analysis", "publishing"] as const;

export type ProgressStepName = (typeof PROGRESS_STEPS)[number];

export type ProgressStepState = "pending" | "running" | "done" | "failed";

export interface ProgressStep {
  readonly name: ProgressStepName;
  readonly state: ProgressStepState;
}

const STEP_STAGES: Record<ProgressStepName, readonly RunStageName[]> = {
  context: ["collecting_context"],
  analysis: ["reviewing", "validating"],
  publishing: ["publishing"],
};

/**
 * Where the run is, step by step. A finished run shows every step done even when the
 * API never reported a stage (a skipped run reports none), so the bar does not look stuck.
 */
export function progressSteps(run: RunDetails): ProgressStep[] {
  return PROGRESS_STEPS.map((name) => ({
    name,
    state: stepState(run, STEP_STAGES[name]),
  }));
}

function stepState(
  run: RunDetails,
  stageNames: readonly RunStageName[],
): ProgressStepState {
  const stages = run.stages.filter((stage) => stageNames.includes(stage.name));

  if (stages.some((stage) => stage.failed)) {
    return "failed";
  }

  if (run.status === "completed") {
    return "done";
  }

  if (stages.length === 0) {
    return "pending";
  }

  const lastStage = stageNames[stageNames.length - 1];
  const lastDone = stages.some(
    (stage) => stage.name === lastStage && stage.finishedAt !== null,
  );
  const anyRunning = stages.some((stage) => stage.finishedAt === null);

  if (lastDone && !anyRunning) {
    return "done";
  }

  // A run that stopped mid-step (failed or superseded) is no longer working on it.
  if (!isActiveStatus(run.status)) {
    return run.status === "failed" ? "failed" : "pending";
  }

  return "running";
}

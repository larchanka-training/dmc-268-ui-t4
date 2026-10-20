import { activeJob } from "./state";

/** The pipeline the mock job goes through: step, start and end in seconds. */
const SCRIPT = [
  ["CLAIMED", 0, 1],
  ["AUTH", 1, 2],
  ["FETCH_DIFF", 2, 6],
  ["BUILD_CONTEXT", 6, 9],
  ["REDACT", 9, 10],
  ["GATE", 10, 11],
  ["LLM_CALL", 11, 30],
  ["POSTPROCESS", 30, 35],
  ["POST_FEEDBACK", 35, 40],
  ["METER", 40, 41],
] as const;

const STAGE_OF_STEP = {
  CLAIMED: "collecting_context",
  AUTH: "collecting_context",
  FETCH_DIFF: "collecting_context",
  BUILD_CONTEXT: "collecting_context",
  REDACT: "collecting_context",
  GATE: "reviewing",
  LLM_CALL: "reviewing",
  POSTPROCESS: "validating",
  POST_FEEDBACK: "publishing",
  METER: "publishing",
} as const;

/** One event of GET /jobs/{id}/events, in the wire format. */
export interface MockJobEvent {
  readonly kind: "step" | "status";
  readonly data: {
    readonly job_id: string;
    readonly seq: number;
    readonly at: string;
    readonly status: string;
    readonly step: string | null;
    readonly step_status: string | null;
    readonly stage: string | null;
    readonly attempt: number;
    readonly error_kind: null;
  };
}

/** A pipeline step of the job detail, shaped like `state.ts`'s own `step()` helper. */
function jobStep(
  step: string,
  stage: string,
  startedAt: string,
  finishedAt: string | null,
) {
  return {
    step,
    status: finishedAt === null ? "RUNNING" : "OK",
    stage,
    attempt: 0,
    started_at: startedAt,
    finished_at: finishedAt,
    error_kind: null,
    metrics: {},
  };
}

/**
 * The job the mock backend reviews in front of the user. It starts when the mocks load,
 * walks through the pipeline in about forty seconds and then completes, so the details
 * page shows the timeline moving and the active list emptying. A reload starts it over.
 */
export function createMockActiveJob(now: () => number = Date.now) {
  const startedAt = new Date(now()).toISOString();
  const createdAt = new Date(now() - 2000).toISOString();
  const elapsed = () => (now() - Date.parse(startedAt)) / 1000;
  const totalSeconds = SCRIPT[SCRIPT.length - 1]?.[2] ?? 0;

  const isDone = () => elapsed() >= totalSeconds;

  function steps() {
    const seconds = elapsed();

    return SCRIPT.filter(([, from]) => from <= seconds).map(
      ([stepName, from, to]) =>
        jobStep(
          stepName,
          STAGE_OF_STEP[stepName],
          new Date(Date.parse(startedAt) + from * 1000).toISOString(),
          to <= seconds
            ? new Date(Date.parse(startedAt) + to * 1000).toISOString()
            : null,
        ),
    );
  }

  function job() {
    const done = isDone();

    return {
      ...activeJob,
      status: done ? "COMPLETED" : "PROCESSING",
      created_at: createdAt,
      started_at: startedAt,
      finished_at: done
        ? new Date(Date.parse(startedAt) + totalSeconds * 1000).toISOString()
        : null,
    };
  }

  /** Every event so far: a start and an end per step, then the final status. */
  function events(): MockJobEvent[] {
    const seconds = elapsed();
    const raw = SCRIPT.flatMap(([stepName, from, to]) => [
      { step: stepName, at: from, stepStatus: "RUNNING" },
      { step: stepName, at: to, stepStatus: "OK" },
    ]).filter((event) => event.at <= seconds);

    const list: MockJobEvent[] = raw.map((event, index) => ({
      kind: "step",
      data: {
        job_id: activeJob.id,
        seq: index + 1,
        at: new Date(Date.parse(startedAt) + event.at * 1000).toISOString(),
        status: "PROCESSING",
        step: event.step,
        step_status: event.stepStatus,
        stage: STAGE_OF_STEP[event.step],
        attempt: 1,
        error_kind: null,
      },
    }));

    if (isDone()) {
      list.push({
        kind: "status",
        data: {
          job_id: activeJob.id,
          seq: list.length + 1,
          at: job().finished_at ?? startedAt,
          status: "COMPLETED",
          step: null,
          step_status: null,
          stage: null,
          attempt: 1,
          error_kind: null,
        },
      });
    }

    return list;
  }

  return {
    id: activeJob.id,
    isDone,
    job,
    detail: () => {
      const currentSteps = steps();

      return {
        ...job(),
        stage: currentSteps.at(-1)?.stage ?? null,
        summary: null,
        error_log: null,
        external_check_url: null,
        steps: currentSteps,
        findings: [],
      };
    },
    events,
  };
}

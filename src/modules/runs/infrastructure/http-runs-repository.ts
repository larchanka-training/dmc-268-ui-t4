import { type HttpClient } from "@/shared/lib/http";

import {
  type FileLinesQuery,
  type RunDetailsResult,
  type RunHistoryPage,
  type RunsRepository,
} from "../application/ports";
import { type RunFilters, type RunStatusFilter } from "../domain/filters";

import {
  type JobStatusDto,
  fileLinesDtoSchema,
  findingContextDtoSchema,
  jobDetailDtoSchema,
  jobsPageDtoSchema,
  rulesDtoSchema,
} from "./dto";
import {
  toFinding,
  toFindingContext,
  toReviewRules,
  toRun,
  toRunDetails,
} from "./mappers";

const STATUS_PARAM: Record<RunStatusFilter, JobStatusDto | undefined> = {
  all: undefined,
  completed: "COMPLETED",
  failed: "FAILED",
};

/**
 * The API pages at most 100 jobs. The active list is not paginated in the console: more
 * than a page of reviews in flight at once is not a case the panel is built for.
 */
const ACTIVE_LIMIT = 100;

function jobPath(runId: string, ...rest: string[]): string {
  return `/jobs/${[runId, ...rest].map(encodeURIComponent).join("/")}`;
}

/**
 * Events after which the job may look different from what the console fetched. `snapshot`
 * opens every connection, reconnects included, and the API ignores `Last-Event-ID`, so it
 * is the only record of what happened while the stream was not open.
 */
const CHANGE_EVENTS = ["snapshot", "step", "status"] as const;

function toSearchParams(filters: RunFilters, cursor: string | undefined) {
  return {
    status: STATUS_PARAM[filters.status],
    repository: filters.repository,
    author: filters.author,
    from: filters.from,
    to: filters.to,
    q: filters.query === "" ? undefined : filters.query,
    cursor,
  };
}

/**
 * Runs are the backend's review jobs: `/jobs` for the lists and the details, and the
 * `/jobs/{id}/events` stream for live progress. `baseUrl` is the HTTP client's, since
 * EventSource opens its own connection.
 */
export function createHttpRunsRepository(
  http: HttpClient,
  baseUrl: string,
): RunsRepository {
  return {
    async listActiveRuns(signal) {
      const dto = await http.get("/jobs", {
        schema: jobsPageDtoSchema,
        searchParams: { status: "active", limit: ACTIVE_LIMIT },
        signal,
      });

      return dto.items.map((item) => toRun(item));
    },

    async listRunHistory({ filters, cursor }, signal): Promise<RunHistoryPage> {
      const dto = await http.get("/jobs", {
        schema: jobsPageDtoSchema,
        searchParams: toSearchParams(filters, cursor),
        signal,
      });

      return {
        items: dto.items.map((item) => toRun(item)),
        nextCursor: dto.next_cursor,
      };
    },

    async getRunDetails(runId, signal): Promise<RunDetailsResult> {
      const dto = await http.get(jobPath(runId), {
        schema: jobDetailDtoSchema,
        signal,
      });

      return {
        run: toRunDetails(dto),
        findings: dto.findings.map(toFinding),
      };
    },

    async getFindingContext(runId, findingId, signal) {
      const dto = await http.get(
        jobPath(runId, "findings", findingId, "context"),
        { schema: findingContextDtoSchema, signal },
      );

      return toFindingContext(dto);
    },

    async getFileLines({ runId, path, from, to }: FileLinesQuery, signal) {
      const dto = await http.get(jobPath(runId, "file-lines"), {
        schema: fileLinesDtoSchema,
        searchParams: { path, from, to },
        signal,
      });

      return dto.lines;
    },

    async getRules(runId, signal) {
      const dto = await http.get(jobPath(runId, "rules"), {
        schema: rulesDtoSchema,
        signal,
      });

      return toReviewRules(dto);
    },

    watchRun(runId, onChange) {
      if (typeof EventSource === "undefined") {
        return () => undefined;
      }

      // The session cookie authorises the stream, as it does every request.
      const source = new EventSource(`${baseUrl}${jobPath(runId)}/events`, {
        withCredentials: true,
      });

      for (const type of CHANGE_EVENTS) {
        source.addEventListener(type, onChange);
      }

      // The job is terminal: the server closes the stream, and reconnecting would only
      // replay the same snapshot.
      source.addEventListener("end", () => {
        source.close();
        onChange();
      });

      // EventSource retries a dropped connection by itself. A non-200 answer (401, 404)
      // closes it for good: refetch, so the HTTP client reports why and the details
      // fall back to polling.
      source.addEventListener("error", () => {
        if (source.readyState === EventSource.CLOSED) {
          onChange();
        }
      });

      return () => {
        source.close();
      };
    },
  };
}

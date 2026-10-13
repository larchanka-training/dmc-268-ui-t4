import { type HttpClient } from "@/shared/lib/http";

import {
  type FileLinesQuery,
  type RunDetailsResult,
  type RunHistoryPage,
  type RunsRepository,
} from "../application/ports";
import { type RunFilters } from "../domain/filters";

import {
  fileLinesDtoSchema,
  jobDetailDtoSchema,
  jobPageDtoSchema,
} from "./dto";
import { toRun, toRunDetails, toValidFindings } from "./mappers";

/** The backend's page limit; one page covers every job still in flight. */
const ACTIVE_JOBS_LIMIT = 100;

/** Events after which the job looks different; `snapshot` only restates it. */
const CHANGE_EVENTS = ["step", "status"] as const;

const JOB_STATUS_OF_FILTER = {
  completed: "COMPLETED",
  failed: "FAILED",
} as const;

/** The filters carry calendar days; the backend wants instants with an offset. */
function toSearchParams(filters: RunFilters, cursor: string | undefined) {
  return {
    status:
      filters.status === "all"
        ? undefined
        : JOB_STATUS_OF_FILTER[filters.status],
    repository: filters.repository,
    author: filters.author,
    from: filters.from === undefined ? undefined : `${filters.from}T00:00:00Z`,
    to: filters.to === undefined ? undefined : `${filters.to}T23:59:59.999Z`,
    q: filters.query === "" ? undefined : filters.query,
    cursor,
  };
}

function jobPath(runId: string): string {
  return `/jobs/${encodeURIComponent(runId)}`;
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
        schema: jobPageDtoSchema,
        searchParams: { status: "active", limit: ACTIVE_JOBS_LIMIT },
        signal,
      });

      return dto.items.map((job) => toRun(job));
    },

    async listRunHistory({ filters, cursor }, signal): Promise<RunHistoryPage> {
      const dto = await http.get("/jobs", {
        schema: jobPageDtoSchema,
        searchParams: toSearchParams(filters, cursor),
        signal,
      });

      return {
        items: dto.items.map((job) => toRun(job)),
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
        findings: toValidFindings(dto.findings),
      };
    },

    async getFileLines({ runId, path, from, to }: FileLinesQuery, signal) {
      const dto = await http.get(`${jobPath(runId)}/file-lines`, {
        schema: fileLinesDtoSchema,
        searchParams: { path, from, to },
        signal,
      });

      return dto.lines;
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

      return () => {
        source.close();
      };
    },
  };
}

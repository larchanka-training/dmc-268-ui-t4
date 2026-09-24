import { type HttpClient } from "@/shared/lib/http";

import {
  type FileLinesQuery,
  type RunDetailsResult,
  type RunHistoryPage,
  type RunsRepository,
} from "../application/ports";
import { type RunFilters } from "../domain/filters";

import {
  activeRunsDtoSchema,
  fileLinesDtoSchema,
  runDetailsResponseDtoSchema,
  runHistoryPageDtoSchema,
} from "./dto";
import { toRun, toRunDetails, toValidFindings } from "./mappers";

function toSearchParams(filters: RunFilters, cursor: string | undefined) {
  return {
    status: filters.status === "all" ? undefined : filters.status,
    repository: filters.repository,
    author: filters.author,
    from: filters.from,
    to: filters.to,
    q: filters.query === "" ? undefined : filters.query,
    cursor,
  };
}

export function createHttpRunsRepository(http: HttpClient): RunsRepository {
  return {
    async listActiveRuns(signal) {
      const dto = await http.get("/runs/active", {
        schema: activeRunsDtoSchema,
        signal,
      });

      return dto.items.map(toRun);
    },

    async listRunHistory({ filters, cursor }, signal): Promise<RunHistoryPage> {
      const dto = await http.get("/runs", {
        schema: runHistoryPageDtoSchema,
        searchParams: toSearchParams(filters, cursor),
        signal,
      });

      return { items: dto.items.map(toRun), nextCursor: dto.next_cursor };
    },

    async getRunDetails(runId, signal): Promise<RunDetailsResult> {
      const dto = await http.get(`/runs/${encodeURIComponent(runId)}`, {
        schema: runDetailsResponseDtoSchema,
        signal,
      });

      return {
        run: toRunDetails(dto.run),
        findings: toValidFindings(dto.findings),
      };
    },

    async getFileLines({ runId, path, from, to }: FileLinesQuery, signal) {
      const dto = await http.get(
        `/runs/${encodeURIComponent(runId)}/file-lines`,
        {
          schema: fileLinesDtoSchema,
          searchParams: { path, from, to },
          signal,
        },
      );

      return dto.lines;
    },
  };
}

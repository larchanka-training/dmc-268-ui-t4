import { z } from "zod";

import { type HttpClient } from "@/shared/lib/http";
import { httpsUrlOrNull } from "@/shared/lib/url";

import { type ConnectedReposApi } from "../application/ports";
import { type Repository } from "../domain/repository";
import {
  type RepositoryRules,
  toRulesStatus,
} from "../domain/repository-rules";

const repositoryDtoSchema = z.object({
  id: z.string().min(1),
  owner: z.string().min(1),
  name: z.string().min(1),
  private: z.boolean(),
  default_branch: z.string(),
  // Any string: a non-https link is dropped by the mapper, not the whole page.
  html_url: z.string(),
  // Nullable: GitHub does not record when a repository was added to an
  // installation, and the backend keeps no copy of forge state.
  connected_at: z.iso.datetime().nullable(),
  last_run_at: z.iso.datetime().nullable(),
});

const repositoryPageDtoSchema = z.object({
  items: z.array(repositoryDtoSchema),
  next_cursor: z.string().nullable(),
  total_count: z.number().int().nonnegative(),
});

/** Both connect-url and disconnect-url answer with the GitHub page to send the user to. */
const gitHubUrlDtoSchema = z.object({ url: z.string().min(1) });

const repositoryRulesDtoSchema = z.object({
  path: z.string(),
  ref: z.string(),
  // Any string: a status newer than this client becomes "unknown" in the mapper.
  status: z.string(),
  file_url: z.string(),
  rules: z.array(
    z.object({ id: z.string(), section: z.string(), text: z.string() }),
  ),
  dropped_suspicious: z.number().int().nonnegative(),
  dropped_over_limit: z.number().int().nonnegative(),
});

function toRepositoryRules(
  dto: z.infer<typeof repositoryRulesDtoSchema>,
): RepositoryRules {
  return {
    path: dto.path,
    ref: dto.ref,
    status: toRulesStatus(dto.status),
    fileUrl: httpsUrlOrNull(dto.file_url),
    rules: dto.rules,
    droppedSuspicious: dto.dropped_suspicious,
    droppedOverLimit: dto.dropped_over_limit,
  };
}

function toRepository(dto: z.infer<typeof repositoryDtoSchema>): Repository {
  return {
    id: dto.id,
    owner: dto.owner,
    name: dto.name,
    fullName: `${dto.owner}/${dto.name}`,
    isPrivate: dto.private,
    defaultBranch: dto.default_branch,
    htmlUrl: httpsUrlOrNull(dto.html_url),
    connectedAt: dto.connected_at,
    lastRunAt: dto.last_run_at,
  };
}

export function createHttpConnectedReposApi(
  http: HttpClient,
): ConnectedReposApi {
  return {
    async listRepositories({ cursor }, signal) {
      const dto = await http.get("/repositories", {
        schema: repositoryPageDtoSchema,
        searchParams: { cursor },
        signal,
      });

      return {
        items: dto.items.map(toRepository),
        nextCursor: dto.next_cursor,
        totalCount: dto.total_count,
      };
    },

    async getConnectUrl(signal) {
      const dto = await http.get("/repositories/connect-url", {
        schema: gitHubUrlDtoSchema,
        signal,
      });

      return dto.url;
    },

    async getDisconnectUrl(repositoryId, signal) {
      const dto = await http.get(
        `/repositories/${encodeURIComponent(repositoryId)}/disconnect-url`,
        { schema: gitHubUrlDtoSchema, signal },
      );

      return dto.url;
    },

    async getRules({ repositoryId, ref }, signal) {
      const dto = await http.get(
        `/repositories/${encodeURIComponent(repositoryId)}/rules`,
        { schema: repositoryRulesDtoSchema, searchParams: { ref }, signal },
      );

      return toRepositoryRules(dto);
    },
  };
}

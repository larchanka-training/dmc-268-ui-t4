import { z } from "zod";

import { type HttpClient } from "@/shared/lib/http";
import { httpsUrlOrNull } from "@/shared/lib/url";

import { type ConnectedReposApi } from "../application/ports";
import { type Repository } from "../domain/repository";

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
  };
}

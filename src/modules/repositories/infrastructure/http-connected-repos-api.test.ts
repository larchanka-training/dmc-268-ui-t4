import { describe, expect, it, vi } from "vitest";

import { type HttpClient, type HttpRequestOptions } from "@/shared/lib/http";

import { createHttpConnectedReposApi } from "./http-connected-repos-api";

const WIRE_REPOSITORY = {
  id: "repo_1",
  owner: "acme",
  name: "payments",
  private: true,
  default_branch: "main",
  html_url: "https://github.com/acme/payments",
  connected_at: "2026-09-01T10:00:00.000Z",
  last_run_at: null,
};

/** Answers like the real client: the canned response still has to pass the schema. */
function fakeHttp(answer: (path: string) => unknown) {
  const get =
    vi.fn<(path: string, options: HttpRequestOptions<unknown>) => void>();
  const http: HttpClient = {
    get: (path, options) => {
      get(path, options);

      return Promise.resolve(options.schema.parse(answer(path)));
    },
    post: () => Promise.reject(new Error("not used")),
  };

  return Object.assign(http, { calls: { get } });
}

describe("createHttpConnectedReposApi", () => {
  it("maps a page of repositories into the domain", async () => {
    const http = fakeHttp(() => ({
      items: [WIRE_REPOSITORY],
      next_cursor: "10",
      total_count: 11,
    }));

    await expect(
      createHttpConnectedReposApi(http).listRepositories({}),
    ).resolves.toEqual({
      items: [
        {
          id: "repo_1",
          owner: "acme",
          name: "payments",
          fullName: "acme/payments",
          isPrivate: true,
          defaultBranch: "main",
          htmlUrl: "https://github.com/acme/payments",
          connectedAt: "2026-09-01T10:00:00.000Z",
          lastRunAt: null,
        },
      ],
      nextCursor: "10",
      totalCount: 11,
    });
  });

  it("keeps a null connected_at, which is what the backend sends today", async () => {
    const http = fakeHttp(() => ({
      items: [{ ...WIRE_REPOSITORY, connected_at: null }],
      next_cursor: null,
      total_count: 1,
    }));

    const page = await createHttpConnectedReposApi(http).listRepositories({});

    expect(page.items[0]?.connectedAt).toBeNull();
  });

  it("drops a GitHub link that is not https", async () => {
    const http = fakeHttp(() => ({
      items: [{ ...WIRE_REPOSITORY, html_url: "javascript:alert(1)" }],
      next_cursor: null,
      total_count: 1,
    }));

    const page = await createHttpConnectedReposApi(http).listRepositories({});

    expect(page.items[0]?.htmlUrl).toBeNull();
  });

  it("passes the cursor on", async () => {
    const http = fakeHttp(() => ({
      items: [],
      next_cursor: null,
      total_count: 11,
    }));

    await createHttpConnectedReposApi(http).listRepositories({
      cursor: "10",
    });

    expect(http.calls.get).toHaveBeenCalledWith(
      "/repositories",
      expect.objectContaining({ searchParams: { cursor: "10" } }),
    );
  });

  it("rejects a page without a total", async () => {
    const http = fakeHttp(() => ({ items: [], next_cursor: null }));

    await expect(
      createHttpConnectedReposApi(http).listRepositories({}),
    ).rejects.toThrow();
  });

  it("reads the connect URL", async () => {
    const http = fakeHttp(() => ({
      url: "https://github.com/apps/review-agent/installations/new",
    }));

    await expect(
      createHttpConnectedReposApi(http).getConnectUrl(),
    ).resolves.toBe("https://github.com/apps/review-agent/installations/new");
    expect(http.calls.get).toHaveBeenCalledWith(
      "/repositories/connect-url",
      expect.anything(),
    );
  });

  it("asks for the disconnect URL of one repository, with its id encoded", async () => {
    const http = fakeHttp(() => ({
      url: "https://github.com/organizations/acme/settings/installations/42",
    }));

    await expect(
      createHttpConnectedReposApi(http).getDisconnectUrl("repo/1"),
    ).resolves.toBe(
      "https://github.com/organizations/acme/settings/installations/42",
    );
    expect(http.calls.get).toHaveBeenCalledWith(
      "/repositories/repo%2F1/disconnect-url",
      expect.anything(),
    );
  });
});

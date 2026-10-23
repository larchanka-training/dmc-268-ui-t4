import { describe, expect, it, vi } from "vitest";

import { AppError } from "@/shared/lib/errors";

import { type ConnectedReposApi, type RepositoryPage } from "./ports";
import { listRepositories, startConnect, startDisconnect } from "./use-cases";

const EMPTY_PAGE: RepositoryPage = {
  items: [],
  nextCursor: null,
  totalCount: 0,
};

function dependencies(overrides: Partial<ConnectedReposApi> = {}) {
  const repositories: ConnectedReposApi = {
    listRepositories: vi.fn(() => Promise.resolve(EMPTY_PAGE)),
    getConnectUrl: vi.fn(() =>
      Promise.resolve("https://github.com/apps/review-agent/installations/new"),
    ),
    getDisconnectUrl: vi.fn(() =>
      Promise.resolve(
        "https://github.com/organizations/acme/settings/installations/42",
      ),
    ),
    ...overrides,
  };

  return { repositories };
}

describe("listRepositories", () => {
  it("asks for the page after the cursor", async () => {
    const deps = dependencies();

    await listRepositories(deps, { cursor: "10" });

    expect(deps.repositories.listRepositories).toHaveBeenCalledWith(
      { cursor: "10" },
      undefined,
    );
  });
});

describe("startConnect", () => {
  it("returns the GitHub page to send the user to", async () => {
    await expect(startConnect(dependencies())).resolves.toEqual({
      kind: "redirect",
      url: "https://github.com/apps/review-agent/installations/new",
    });
  });

  it("refuses to follow a URL that is not https or local", async () => {
    const deps = dependencies({
      getConnectUrl: () => Promise.resolve("javascript:alert(1)"),
    });

    await expect(startConnect(deps)).resolves.toEqual({
      kind: "failed",
      reason: "unsafe-url",
    });
  });

  it("reports the connect page as unavailable when the request fails", async () => {
    const deps = dependencies({
      getConnectUrl: () => Promise.reject(new Error("offline")),
    });

    await expect(startConnect(deps)).resolves.toEqual({
      kind: "failed",
      reason: "unavailable",
    });
  });
});

describe("startDisconnect", () => {
  it("returns the GitHub page where the repository is removed", async () => {
    const deps = dependencies();

    await expect(startDisconnect(deps, "repo_1")).resolves.toEqual({
      kind: "redirect",
      url: "https://github.com/organizations/acme/settings/installations/42",
    });
    expect(deps.repositories.getDisconnectUrl).toHaveBeenCalledWith(
      "repo_1",
      undefined,
    );
  });

  it("says so when the repository is no longer connected", async () => {
    const deps = dependencies({
      getDisconnectUrl: () =>
        Promise.reject(new AppError("not-found", "Not found", 404)),
    });

    await expect(startDisconnect(deps, "repo_1")).resolves.toEqual({
      kind: "failed",
      reason: "not-found",
    });
  });

  it("refuses to follow a URL that is not https or local", async () => {
    const deps = dependencies({
      getDisconnectUrl: () => Promise.resolve("//evil.example/settings"),
    });

    await expect(startDisconnect(deps, "repo_1")).resolves.toEqual({
      kind: "failed",
      reason: "unsafe-url",
    });
  });

  it("reports GitHub as unavailable for any other failure", async () => {
    const deps = dependencies({
      getDisconnectUrl: () =>
        Promise.reject(new AppError("server", "Boom", 502)),
    });

    await expect(startDisconnect(deps, "repo_1")).resolves.toEqual({
      kind: "failed",
      reason: "unavailable",
    });
  });
});

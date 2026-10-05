import { QueryClient } from "@tanstack/react-query";
import { createMemoryHistory } from "@tanstack/react-router";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import { type Session, type SessionRepository } from "@/modules/auth";
import {
  type ConnectedReposApi,
  repositoriesQueryKeys,
  useConnectedBannerStore,
} from "@/modules/repositories";
import { type RunsRepository } from "@/modules/runs";

import { type AppDependencies } from "../composition/dependencies";

import { createAppRouter } from "./router";

const SESSION: Session = {
  user: {
    id: "u1",
    login: "octocat",
    name: "Octo Cat",
    avatarUrl: null,
    isPlatformAdmin: false,
  },
  organizations: [
    { id: "org1", login: "acme", name: "Acme", avatarUrl: null, role: "owner" },
  ],
  currentOrganizationId: "org1",
};

const NO_ORGANIZATION: Session = {
  ...SESSION,
  organizations: [],
  currentOrganizationId: null,
};

function notUsed(): never {
  throw new Error("The repositories are not loaded by the routes themselves");
}

const runs: RunsRepository = {
  listActiveRuns: notUsed,
  listRunHistory: notUsed,
  getRunDetails: notUsed,
  getFileLines: notUsed,
};

const repositories: ConnectedReposApi = {
  listRepositories: notUsed,
  getConnectUrl: notUsed,
  getDisconnectUrl: notUsed,
};

/** The routes run against fakes and an in-memory history: no DOM, no network. */
async function navigate(
  url: string,
  session: Session | null,
  {
    previous,
    queryClient = new QueryClient(),
  }: { previous?: string; queryClient?: QueryClient } = {},
) {
  const repository: SessionRepository = {
    getCurrentSession: vi.fn(() => Promise.resolve(session)),
    getSignInUrl: (returnTo) =>
      `/api/auth/github?return_to=${String(returnTo)}`,
    signOut: () => Promise.resolve(),
  };
  const dependencies: AppDependencies = {
    auth: {
      session: repository,
      notifier: {
        notifySignedOut: () => undefined,
        onSignedOut: () => () => undefined,
      },
    },
    runs: { runs },
    repositories: { repositories },
  };
  const history = createMemoryHistory({
    initialEntries: previous === undefined ? [url] : [previous, url],
    initialIndex: previous === undefined ? 0 : 1,
  });
  const router = createAppRouter(
    { queryClient, dependencies },
    { history, isServer: false },
  );

  await router.load();

  return { router, history, repository };
}

function where(router: Awaited<ReturnType<typeof navigate>>["router"]) {
  const { pathname, search } = router.state.location;

  return { pathname, search: search as Record<string, unknown> };
}

describe("routes", () => {
  // The router runs in client mode; all it needs from the browser is the page's origin.
  beforeAll(() => {
    vi.stubGlobal("window", { origin: "http://localhost" });
  });

  afterAll(() => {
    vi.unstubAllGlobals();
  });

  it("sends a signed-out visitor to sign in, remembering the page", async () => {
    const { router } = await navigate("/runs", null);

    expect(where(router)).toEqual({
      pathname: "/login",
      search: { returnTo: "/runs" },
    });
  });

  it("returns a signed-in user to the page they were heading for", async () => {
    const { router } = await navigate(
      "/auth/callback?result=success&return_to=%2Fbilling",
      SESSION,
    );

    expect(where(router).pathname).toBe("/billing");
  });

  it("lands a direct sign-in on the success page", async () => {
    const { router } = await navigate("/auth/callback?result=success", SESSION);

    expect(where(router).pathname).toBe("/auth/success");
  });

  it("lands a user without organisations on the success page", async () => {
    const { router } = await navigate(
      "/auth/callback?result=success&return_to=%2Fbilling",
      NO_ORGANIZATION,
    );

    expect(where(router).pathname).toBe("/auth/success");
  });

  it("ignores a return path that leaves the console", async () => {
    const { router } = await navigate(
      "/auth/callback?result=success&return_to=%2F%2Fevil.example",
      SESSION,
    );

    expect(where(router).pathname).toBe("/auth/success");
  });

  it("never leaves the callback in the history", async () => {
    const { history } = await navigate(
      "/auth/callback?result=success&return_to=%2Fbilling",
      SESSION,
      { previous: "/pricing" },
    );

    history.back();

    expect(history.location.pathname).toBe("/pricing");
  });

  it("shows a cancelled sign-in on the login page, keeping the return path", async () => {
    const { router, repository } = await navigate(
      "/auth/callback?result=access_denied&return_to=%2Fbilling",
      null,
    );

    expect(where(router)).toEqual({
      pathname: "/login",
      search: { error: "access_denied", returnTo: "/billing" },
    });
    expect(repository.getCurrentSession).toHaveBeenCalledOnce();
  });

  it("reports a missing session after a reported success as a server error", async () => {
    const { router } = await navigate("/auth/callback?result=success", null);

    expect(where(router)).toEqual({
      pathname: "/login",
      search: { error: "server_error" },
    });
  });

  it("moves a signed-in user past the login page", async () => {
    const { router } = await navigate("/login?returnTo=%2Fbilling", SESSION);

    expect(where(router).pathname).toBe("/billing");
  });

  it("opens the Overview at the root instead of redirecting", async () => {
    const { router } = await navigate("/", SESSION);

    expect(where(router).pathname).toBe("/");
  });

  it("sends a signed-out visitor to sign in from the repositories page", async () => {
    const { router } = await navigate("/repositories", null);

    expect(where(router)).toEqual({
      pathname: "/login",
      search: { returnTo: "/repositories" },
    });
  });

  it("refreshes the list and announces it when GitHub sends the user back", async () => {
    useConnectedBannerStore.getState().dismiss();
    const queryClient = new QueryClient();
    queryClient.setQueryData(repositoriesQueryKeys.list(), { pages: [] });

    const { router } = await navigate("/repositories?connected=1", SESSION, {
      queryClient,
    });

    // The flag leaves the URL, so a reload does not announce it again.
    expect(where(router)).toEqual({ pathname: "/repositories", search: {} });
    expect(useConnectedBannerStore.getState().isVisible).toBe(true);
    expect(
      queryClient.getQueryState(repositoriesQueryKeys.list())?.isInvalidated,
    ).toBe(true);
  });

  it("keeps a signed-out visitor away from the success page", async () => {
    const { router } = await navigate("/auth/success", null);

    expect(where(router).pathname).toBe("/login");
  });
});

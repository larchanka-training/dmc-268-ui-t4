import { describe, expect, it, vi } from "vitest";

import { type Session } from "../domain/session";

import { type AuthNotifier, type SessionRepository } from "./ports";
import {
  type AuthDependencies,
  completeSignIn,
  getSignInUrl,
  signOut,
} from "./use-cases";

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

function dependencies(repository: Partial<SessionRepository> = {}) {
  const session: SessionRepository = {
    getCurrentSession: vi.fn(() => Promise.resolve<Session | null>(SESSION)),
    getSignInUrl: vi.fn(
      (returnTo: string | null) => `sign-in:${String(returnTo)}`,
    ),
    signOut: vi.fn(() => Promise.resolve()),
    ...repository,
  };
  const notifier: AuthNotifier = {
    notifySignedOut: vi.fn(),
    onSignedOut: vi.fn(() => () => undefined),
  };

  return { session, notifier } satisfies AuthDependencies;
}

describe("completeSignIn", () => {
  it("reports the provider's error without asking for a session", async () => {
    const deps = dependencies();

    await expect(
      completeSignIn(deps, { result: "access_denied", returnTo: "/runs" }),
    ).resolves.toEqual({ kind: "failed", error: "access_denied" });
    expect(deps.session.getCurrentSession).not.toHaveBeenCalled();
  });

  it("treats an unknown result as a server error", async () => {
    await expect(
      completeSignIn(dependencies(), { result: "bogus", returnTo: undefined }),
    ).resolves.toEqual({ kind: "failed", error: "server_error" });
  });

  it("loads the session and picks the destination", async () => {
    await expect(
      completeSignIn(dependencies(), {
        result: "success",
        returnTo: "/runs?status=failed",
      }),
    ).resolves.toEqual({
      kind: "signed-in",
      session: SESSION,
      destination: "/runs?status=failed",
    });
  });

  it("fails when the backend reports success but no session exists", async () => {
    const deps = dependencies({
      getCurrentSession: () => Promise.resolve(null),
    });

    await expect(
      completeSignIn(deps, { result: "success", returnTo: "/runs" }),
    ).resolves.toEqual({ kind: "failed", error: "server_error" });
  });

  it("fails when the session cannot be loaded", async () => {
    const deps = dependencies({
      getCurrentSession: () => Promise.reject(new Error("offline")),
    });

    await expect(
      completeSignIn(deps, { result: "success", returnTo: "/runs" }),
    ).resolves.toEqual({ kind: "failed", error: "server_error" });
  });
});

describe("getSignInUrl", () => {
  it("passes a safe return path through", () => {
    expect(getSignInUrl(dependencies(), "/runs")).toBe("sign-in:/runs");
  });

  it("drops an unsafe return path", () => {
    expect(getSignInUrl(dependencies(), "//evil.example")).toBe("sign-in:null");
  });
});

describe("signOut", () => {
  it("ends the session on the backend and tells the other tabs", async () => {
    const deps = dependencies();

    await signOut(deps);

    expect(deps.session.signOut).toHaveBeenCalledOnce();
    expect(deps.notifier.notifySignedOut).toHaveBeenCalledOnce();
  });

  it("still signs out locally when the backend cannot be reached", async () => {
    const deps = dependencies({
      signOut: () => Promise.reject(new Error("offline")),
    });

    await expect(signOut(deps)).resolves.toBeUndefined();
    expect(deps.notifier.notifySignedOut).toHaveBeenCalledOnce();
  });
});

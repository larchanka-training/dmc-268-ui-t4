import { describe, expect, it, vi } from "vitest";

import { AppError } from "@/shared/lib/errors";
import { type HttpClient, type HttpRequestOptions } from "@/shared/lib/http";

import { createHttpSessionRepository } from "./http-session-repository";

const WIRE_SESSION = {
  user: {
    id: "u1",
    login: "octocat",
    name: "Octo Cat",
    avatar_url: "https://avatars.githubusercontent.com/u/1",
    is_platform_admin: true,
  },
  organizations: [
    {
      id: "org1",
      login: "acme",
      name: "Acme",
      avatar_url: "http://insecure.example/acme.png",
      role: "owner",
    },
  ],
  current_organization_id: "org1",
};

/**
 * Answers like the real client would: the response still has to pass the schema. The
 * spies record the calls; the client itself stays generic.
 */
function fakeHttp(answer: (path: string) => Promise<unknown>) {
  const get =
    vi.fn<(path: string, options: HttpRequestOptions<unknown>) => void>();
  const post =
    vi.fn<
      (
        path: string,
        body: unknown,
        options: HttpRequestOptions<unknown>,
      ) => void
    >();

  const http: HttpClient = {
    get: async (path, options) => {
      get(path, options);

      return options.schema.parse(await answer(path));
    },
    post: async (path, body, options) => {
      post(path, body, options);

      return options.schema.parse(await answer(path));
    },
  };

  return Object.assign(http, { calls: { get, post } });
}

describe("createHttpSessionRepository", () => {
  it("maps the wire session into the domain", async () => {
    const http = fakeHttp(() => Promise.resolve(WIRE_SESSION));
    const repository = createHttpSessionRepository(http, "/api");

    await expect(repository.getCurrentSession()).resolves.toEqual({
      user: {
        id: "u1",
        login: "octocat",
        name: "Octo Cat",
        avatarUrl: "https://avatars.githubusercontent.com/u/1",
        isPlatformAdmin: true,
      },
      organizations: [
        // A non-https avatar is dropped rather than rendered.
        {
          id: "org1",
          login: "acme",
          name: "Acme",
          avatarUrl: null,
          role: "owner",
        },
      ],
      currentOrganizationId: "org1",
    });
  });

  it("accepts a user whose organisations have not installed the app", async () => {
    const http = fakeHttp(() =>
      Promise.resolve({
        ...WIRE_SESSION,
        organizations: [],
        current_organization_id: null,
      }),
    );
    const session = await createHttpSessionRepository(
      http,
      "/api",
    ).getCurrentSession();

    expect(session?.currentOrganizationId).toBeNull();
    expect(session?.organizations).toEqual([]);
  });

  it("asks for /me without triggering the global sign-out on a 401", async () => {
    const http = fakeHttp(() => Promise.resolve(WIRE_SESSION));

    await createHttpSessionRepository(http, "/api").getCurrentSession();

    expect(http.calls.get).toHaveBeenCalledWith(
      "/me",
      expect.objectContaining({ ignoreUnauthorized: true }),
    );
  });

  it("resolves to null when nobody is signed in", async () => {
    const http = fakeHttp(() =>
      Promise.reject(new AppError("unauthorized", "Sign in", 401)),
    );

    await expect(
      createHttpSessionRepository(http, "/api").getCurrentSession(),
    ).resolves.toBeNull();
  });

  it("passes other failures on", async () => {
    const http = fakeHttp(() =>
      Promise.reject(new AppError("server", "Boom", 500)),
    );

    await expect(
      createHttpSessionRepository(http, "/api").getCurrentSession(),
    ).rejects.toMatchObject({ kind: "server" });
  });

  it("signs out with a POST that expects no body back", async () => {
    const http = fakeHttp(() => Promise.resolve(undefined));

    await createHttpSessionRepository(http, "/api").signOut();

    expect(http.calls.post).toHaveBeenCalledWith(
      "/auth/logout",
      undefined,
      expect.anything(),
    );
  });

  it("builds the sign-in URL with and without a return path", () => {
    const repository = createHttpSessionRepository(fakeHttp(vi.fn()), "/api");

    expect(repository.getSignInUrl("/runs?status=failed")).toBe(
      "/api/auth/github?return_to=%2Fruns%3Fstatus%3Dfailed",
    );
    expect(repository.getSignInUrl(null)).toBe("/api/auth/github");
  });
});

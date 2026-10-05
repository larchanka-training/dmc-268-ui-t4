import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";

import { createHttpClient } from "./http";

const schema = z.object({ ok: z.boolean() });

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

// fetch is replaced for every test, so nothing here touches the network.
const fetchMock = vi.fn<typeof fetch>();

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

function lastInit(): RequestInit {
  const call = fetchMock.mock.calls.at(-1);

  if (!call?.[1]) {
    throw new Error("fetch was not called with options");
  }

  return call[1];
}

describe("createHttpClient", () => {
  it("sends the session cookie and the CSRF header with every request", async () => {
    fetchMock.mockResolvedValue(json({ ok: true }));

    await createHttpClient("/api").get("/me", { schema });

    expect(lastInit()).toMatchObject({
      method: "GET",
      credentials: "include",
      headers: { "X-Requested-With": "fetch" },
    });
  });

  it("builds the URL from the base, the path and the defined parameters", async () => {
    fetchMock.mockResolvedValue(json({ ok: true }));

    await createHttpClient("/api").get("/runs", {
      schema,
      searchParams: { status: "failed", cursor: undefined, limit: 20 },
    });

    expect(fetchMock.mock.calls.at(-1)?.[0]).toBe(
      "/api/runs?status=failed&limit=20",
    );
  });

  it("sends a JSON body with a POST", async () => {
    fetchMock.mockResolvedValue(json({ ok: true }));

    await createHttpClient("/api").post("/things", { a: 1 }, { schema });

    expect(lastInit()).toMatchObject({
      method: "POST",
      body: JSON.stringify({ a: 1 }),
      headers: {
        "Content-Type": "application/json",
        "X-Requested-With": "fetch",
      },
    });
  });

  it("accepts 204 No Content without parsing a body", async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));

    await expect(
      createHttpClient("/api").post("/auth/logout", undefined, {
        schema: z.undefined(),
      }),
    ).resolves.toBeUndefined();
  });

  it("reports a 401 to the session handler and still rejects", async () => {
    fetchMock.mockResolvedValue(json({ error: "no_session" }, 401));
    const onUnauthorized = vi.fn();

    await expect(
      createHttpClient("/api", { onUnauthorized }).get("/runs", { schema }),
    ).rejects.toMatchObject({ kind: "unauthorized", status: 401 });
    expect(onUnauthorized).toHaveBeenCalledOnce();
  });

  it("lets a request handle its own 401", async () => {
    fetchMock.mockResolvedValue(json({ error: "no_session" }, 401));
    const onUnauthorized = vi.fn();

    await expect(
      createHttpClient("/api", { onUnauthorized }).get("/me", {
        schema,
        ignoreUnauthorized: true,
      }),
    ).rejects.toMatchObject({ kind: "unauthorized" });
    expect(onUnauthorized).not.toHaveBeenCalled();
  });

  it("does not treat a 403 as a lost session", async () => {
    fetchMock.mockResolvedValue(json({ error: "forbidden" }, 403));
    const onUnauthorized = vi.fn();

    await expect(
      createHttpClient("/api", { onUnauthorized }).get("/admin", { schema }),
    ).rejects.toMatchObject({ kind: "forbidden" });
    expect(onUnauthorized).not.toHaveBeenCalled();
  });

  it("turns a failed fetch into a network error", async () => {
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));

    await expect(
      createHttpClient("/api").get("/me", { schema }),
    ).rejects.toMatchObject({ kind: "network" });
  });

  it("rejects a response that does not match the schema", async () => {
    fetchMock.mockResolvedValue(json({ ok: "yes" }));

    await expect(
      createHttpClient("/api").get("/me", { schema }),
    ).rejects.toMatchObject({ kind: "validation" });
  });
});

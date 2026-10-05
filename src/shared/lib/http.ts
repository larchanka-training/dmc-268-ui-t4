import { type ZodType } from "zod";

import { AppError } from "./errors";

export interface HttpRequestOptions<TOutput> {
  /** Schema the response body must satisfy before it reaches the mappers. */
  readonly schema: ZodType<TOutput>;
  readonly searchParams?: Record<string, string | number | undefined>;
  readonly signal?: AbortSignal;
  /**
   * The caller treats a 401 as an answer of its own (the session probe does: a 401 there
   * just means "signed out"), so the client-wide handler is not called.
   */
  readonly ignoreUnauthorized?: boolean;
}

export interface HttpClientHooks {
  /** Called on a 401: the session expired or was revoked. The request still rejects. */
  readonly onUnauthorized?: () => void;
}

export interface HttpClient {
  get: <TOutput>(
    path: string,
    options: HttpRequestOptions<TOutput>,
  ) => Promise<TOutput>;
  post: <TOutput>(
    path: string,
    body: unknown,
    options: HttpRequestOptions<TOutput>,
  ) => Promise<TOutput>;
}

function buildUrl(
  baseUrl: string,
  path: string,
  searchParams: Record<string, string | number | undefined> | undefined,
): string {
  const query = new URLSearchParams();

  for (const [key, value] of Object.entries(searchParams ?? {})) {
    if (value !== undefined) {
      query.set(key, String(value));
    }
  }

  const search = query.toString();

  return `${baseUrl}${path}${search ? `?${search}` : ""}`;
}

function toAppError(status: number, message: string): AppError {
  switch (status) {
    case 401:
      return new AppError("unauthorized", "Sign in to continue", status);
    case 403:
      return new AppError(
        "forbidden",
        "You do not have access to this resource",
        status,
      );
    case 404:
      return new AppError("not-found", "Not found", status);
    default:
      return new AppError(
        status >= 500 ? "server" : "validation",
        message,
        status,
      );
  }
}

/**
 * The only place that knows about fetch. Sessions travel in an httpOnly cookie, so
 * credentials are always included and no token is ever handled in JavaScript. The
 * X-Requested-With header is the CSRF marker the backend requires on every request.
 */
export function createHttpClient(
  baseUrl: string,
  hooks: HttpClientHooks = {},
): HttpClient {
  async function request<TOutput>(
    method: "GET" | "POST",
    path: string,
    body: unknown,
    options: HttpRequestOptions<TOutput>,
  ): Promise<TOutput> {
    let response: Response;

    try {
      response = await fetch(buildUrl(baseUrl, path, options.searchParams), {
        method,
        credentials: "include",
        headers:
          body === undefined
            ? { "X-Requested-With": "fetch" }
            : {
                "Content-Type": "application/json",
                "X-Requested-With": "fetch",
              },
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: options.signal ?? null,
      });
    } catch {
      throw new AppError("network", "The server could not be reached");
    }

    if (!response.ok) {
      if (response.status === 401 && options.ignoreUnauthorized !== true) {
        hooks.onUnauthorized?.();
      }

      throw toAppError(response.status, `Request to ${path} failed`);
    }

    const payload: unknown =
      response.status === 204 ? undefined : await response.json();
    const parsed = options.schema.safeParse(payload);

    if (!parsed.success) {
      throw new AppError(
        "validation",
        `Unexpected response shape for ${path}`,
        response.status,
      );
    }

    return parsed.data;
  }

  return {
    get: (path, options) => request("GET", path, undefined, options),
    post: (path, body, options) => request("POST", path, body, options),
  };
}

import { type ZodType } from "zod";

import { AppError } from "./errors";

export interface HttpRequestOptions<TOutput> {
  /** Schema the response body must satisfy before it reaches the mappers. */
  readonly schema: ZodType<TOutput>;
  readonly searchParams?: Record<string, string | number | undefined>;
  readonly signal?: AbortSignal;
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
 * credentials are always included and no token is ever handled in JavaScript.
 */
export function createHttpClient(baseUrl: string): HttpClient {
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
            ? undefined
            : { "Content-Type": "application/json" },
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: options.signal ?? null,
      });
    } catch {
      throw new AppError("network", "The server could not be reached");
    }

    if (!response.ok) {
      throw toAppError(response.status, `Request to ${path} failed`);
    }

    const payload: unknown = await response.json();
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

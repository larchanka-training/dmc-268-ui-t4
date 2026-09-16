/**
 * Every failure crossing the infrastructure boundary is normalised into one of these
 * kinds, so the UI can react without knowing anything about HTTP.
 */
export type AppErrorKind =
  | "unauthorized"
  | "forbidden"
  | "not-found"
  | "validation"
  | "network"
  | "server";

export class AppError extends Error {
  readonly kind: AppErrorKind;
  readonly status: number | null;

  constructor(
    kind: AppErrorKind,
    message: string,
    status: number | null = null,
  ) {
    super(message);
    this.name = "AppError";
    this.kind = kind;
    this.status = status;
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

export function errorKind(error: unknown): AppErrorKind | null {
  return isAppError(error) ? error.kind : null;
}

/** Retrying only helps for transient failures; a 403 will stay a 403. */
export function isRetryable(error: unknown): boolean {
  const kind = errorKind(error);

  return kind === "network" || kind === "server" || kind === null;
}

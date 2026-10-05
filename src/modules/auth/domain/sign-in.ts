import { sanitizeReturnTo } from "./return-to";
import { type Session, currentOrganization } from "./session";

/** The outcome the backend reports when it redirects back from GitHub. */
export const SIGN_IN_RESULTS = [
  "success",
  "access_denied",
  "state_mismatch",
  "server_error",
] as const;

export type SignInResult = (typeof SIGN_IN_RESULTS)[number];

export type SignInError = Exclude<SignInResult, "success">;

/** Shown after a direct sign-in, and to users whose organisations lack the app. */
export const SIGN_IN_SUCCESS_PATH = "/auth/success";

/** Anything the backend did not promise is treated as a failure on its side. */
export function parseSignInResult(value: unknown): SignInResult {
  return SIGN_IN_RESULTS.find((result) => result === value) ?? "server_error";
}

/**
 * Where a freshly signed-in user lands: back where they were heading, unless the console
 * would have nothing to show them or there is nowhere safe to go back to.
 */
export function signInDestination(
  session: Session,
  returnTo: string | null | undefined,
): string {
  if (currentOrganization(session) === null) {
    return SIGN_IN_SUCCESS_PATH;
  }

  return sanitizeReturnTo(returnTo) ?? SIGN_IN_SUCCESS_PATH;
}

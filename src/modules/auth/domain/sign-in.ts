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

/**
 * The console's home. The Overview shows the "install the app" state itself, so a user
 * without an organisation lands there too instead of on a page of their own.
 */
export const CONSOLE_HOME_PATH = "/";

/** Anything the backend did not promise is treated as a failure on its side. */
export function parseSignInResult(value: unknown): SignInResult {
  return SIGN_IN_RESULTS.find((result) => result === value) ?? "server_error";
}

/**
 * Where a freshly signed-in user lands: back where they were heading, or the Overview when
 * there is nowhere safe to go back to. Without an organisation the page they were heading
 * for would be empty, so they land on the Overview, which offers to install the app.
 */
export function signInDestination(
  session: Session,
  returnTo: string | null | undefined,
): string {
  if (currentOrganization(session) === null) {
    return CONSOLE_HOME_PATH;
  }

  return sanitizeReturnTo(returnTo) ?? CONSOLE_HOME_PATH;
}

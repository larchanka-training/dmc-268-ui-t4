import { sanitizeReturnTo } from "../domain/return-to";
import { type Session } from "../domain/session";
import {
  type SignInError,
  parseSignInResult,
  signInDestination,
} from "../domain/sign-in";

import { type AuthNotifier, type SessionRepository } from "./ports";

export interface AuthDependencies {
  readonly session: SessionRepository;
  readonly notifier: AuthNotifier;
}

export type SignInOutcome =
  | {
      readonly kind: "signed-in";
      readonly session: Session;
      readonly destination: string;
    }
  | { readonly kind: "failed"; readonly error: SignInError };

export function getCurrentSession(
  { session }: AuthDependencies,
  signal?: AbortSignal,
): Promise<Session | null> {
  return session.getCurrentSession(signal);
}

export function getSignInUrl(
  { session }: AuthDependencies,
  returnTo: string | null | undefined,
): string {
  return session.getSignInUrl(sanitizeReturnTo(returnTo));
}

/**
 * Turns the redirect back from the backend into either a signed-in session and the page
 * to open, or the reason sign-in failed. A reported success without a session behind it
 * counts as a server error: the cookie did not arrive.
 */
export async function completeSignIn(
  { session }: AuthDependencies,
  params: { readonly result: unknown; readonly returnTo: string | undefined },
  signal?: AbortSignal,
): Promise<SignInOutcome> {
  const result = parseSignInResult(params.result);

  if (result !== "success") {
    return { kind: "failed", error: result };
  }

  let current: Session | null;

  try {
    current = await session.getCurrentSession(signal);
  } catch {
    return { kind: "failed", error: "server_error" };
  }

  if (current === null) {
    return { kind: "failed", error: "server_error" };
  }

  return {
    kind: "signed-in",
    session: current,
    destination: signInDestination(current, params.returnTo),
  };
}

/**
 * Signing out always succeeds locally: if the backend cannot be reached, the user is still
 * signed out in this browser, and the other tabs follow.
 */
export async function signOut({
  session,
  notifier,
}: AuthDependencies): Promise<void> {
  try {
    await session.signOut();
  } catch {
    // The local sign-out below must happen regardless.
  }

  notifier.notifySignedOut();
}

import { type Session } from "../domain/session";

import { type SessionRepository } from "./ports";

export interface AuthDependencies {
  readonly session: SessionRepository;
}

export function getCurrentSession(
  { session }: AuthDependencies,
  signal?: AbortSignal,
): Promise<Session | null> {
  return session.getCurrentSession(signal);
}

export function getSignInUrl(
  { session }: AuthDependencies,
  returnTo: string,
): string {
  return session.getSignInUrl(returnTo);
}

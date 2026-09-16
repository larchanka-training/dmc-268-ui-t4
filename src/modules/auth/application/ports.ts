import { type Session } from "../domain/session";

export interface SessionRepository {
  /** Returns null when nobody is signed in, instead of throwing. */
  getCurrentSession: (signal?: AbortSignal) => Promise<Session | null>;
  /** Where the browser has to go to start the GitHub OAuth flow. */
  getSignInUrl: (returnTo: string) => string;
}

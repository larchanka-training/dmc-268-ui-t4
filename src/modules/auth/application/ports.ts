import { type Session } from "../domain/session";

export interface SessionRepository {
  /** Returns null when nobody is signed in, instead of throwing. */
  getCurrentSession: (signal?: AbortSignal) => Promise<Session | null>;
  /**
   * Where the browser has to go to start the GitHub sign-in. `returnTo` is already
   * sanitised; null means "no return path".
   */
  getSignInUrl: (returnTo: string | null) => string;
  /** Ends the session on the backend, which also expires the cookie. */
  signOut: () => Promise<void>;
}

/** Keeps the tabs of one browser in step: signing out in one signs out all of them. */
export interface AuthNotifier {
  notifySignedOut: () => void;
  /** Returns the unsubscribe function. */
  onSignedOut: (listener: () => void) => () => void;
}

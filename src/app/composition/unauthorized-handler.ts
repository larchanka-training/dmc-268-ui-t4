export interface UnauthorizedHandlerPorts {
  readonly currentLocation: () => { pathname: string; href: string };
  /** Forgets the session and every piece of private data cached for it. */
  readonly clearSession: () => void;
  readonly redirectToLogin: (returnTo: string) => Promise<void>;
}

/** Pages that deal with signing in themselves; a 401 there is expected. */
const SIGN_IN_PAGES = /^\/(?:login|auth)(?:\/|$)/;

/**
 * What happens when the backend says the session is gone (expired or revoked): drop it
 * and send the user to sign in, keeping their place. A burst of 401s from parallel
 * requests leads to a single redirect.
 */
export function createUnauthorizedHandler(
  ports: UnauthorizedHandlerPorts,
): () => void {
  let isRedirecting = false;

  return () => {
    const location = ports.currentLocation();

    if (isRedirecting || SIGN_IN_PAGES.test(location.pathname)) {
      return;
    }

    isRedirecting = true;
    ports.clearSession();

    void ports.redirectToLogin(location.href).finally(() => {
      isRedirecting = false;
    });
  };
}

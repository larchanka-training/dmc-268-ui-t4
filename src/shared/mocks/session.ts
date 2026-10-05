import { type MockScenario } from "./scenario";

/** The part of Web Storage the mock session needs; tests hand in an in-memory map. */
export interface MockStorage {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
}

const SESSION_KEY = "mock-session";
const EXPIRED_KEY = "mock-session-expired";
/** Written by the mock repositories; reset together with the session. */
export const CONNECTED_REPOSITORIES_KEY = "mock-repositories-connected";
export const DISCONNECTED_REPOSITORIES_KEY = "mock-repositories-disconnected";

const CALLBACK_PATH = "/auth/callback";

/**
 * The mock backend's idea of "is there a session cookie". Real sign-in is a full-page trip
 * through GitHub that MSW cannot intercept, so the mock signs in when the page loads on
 * the callback URL with a successful result — exactly when the real cookie would arrive.
 * The state lives in storage, so it survives reloads and is shared by tabs.
 */
export function createMockSession({
  scenario,
  storage,
  location,
}: {
  scenario: MockScenario;
  storage: MockStorage;
  location: { pathname: string; search: string };
}) {
  if (
    location.pathname === CALLBACK_PATH &&
    new URLSearchParams(location.search).get("result") === "success"
  ) {
    storage.setItem(SESSION_KEY, "signed-in");
  }

  let answeredRequests = 0;

  const isSignedIn = (): boolean => {
    const stored = storage.getItem(SESSION_KEY);

    return stored === null ? scenario.startsSignedIn : stored === "signed-in";
  };

  const signOut = (): void => {
    storage.setItem(SESSION_KEY, "signed-out");
  };

  return {
    /** Whether the request carries a live session; counts it for the "expired" scenario. */
    authorize(): boolean {
      if (!isSignedIn()) {
        return false;
      }

      const expiresAfter = scenario.expiresAfterRequests;

      if (expiresAfter !== null && storage.getItem(EXPIRED_KEY) === null) {
        if (answeredRequests >= expiresAfter) {
          // Expire once per scenario, so signing in again leads somewhere.
          storage.setItem(EXPIRED_KEY, "true");
          signOut();

          return false;
        }

        answeredRequests += 1;
      }

      return true;
    },

    signOut,
  };
}

export type MockSession = ReturnType<typeof createMockSession>;

/**
 * Forgets sign-ins, expiries and connected repositories, so a newly picked scenario starts
 * from its defaults.
 */
export function resetMockSession(storage: MockStorage): void {
  storage.removeItem(SESSION_KEY);
  storage.removeItem(EXPIRED_KEY);
  storage.removeItem(CONNECTED_REPOSITORIES_KEY);
  storage.removeItem(DISCONNECTED_REPOSITORIES_KEY);
}

/**
 * Where "Continue with GitHub" leads in mock mode: straight to the callback with the
 * outcome the scenario prescribes, the way the backend would redirect after GitHub.
 */
export function mockSignInUrl(
  scenario: MockScenario,
  returnTo: string | null,
): string {
  const params = new URLSearchParams({ result: scenario.signInResult });

  if (returnTo !== null) {
    params.set("return_to", returnTo);
  }

  return `${CALLBACK_PATH}?${params.toString()}`;
}

const NO_STORAGE: MockStorage = {
  getItem: () => null,
  setItem: () => undefined,
  removeItem: () => undefined,
};

/** localStorage, or a no-op stand-in where the browser refuses storage (private windows). */
export function browserStorage(): MockStorage {
  try {
    return window.localStorage;
  } catch {
    return NO_STORAGE;
  }
}

import { browserStorage, resetMockSession } from "./session";
import { type MockRole } from "./state";

/**
 * Dev-only scenario switch. It decides which session and which runs the mock API serves,
 * so role guards, sign-in outcomes and empty states can be checked without editing
 * fixtures. Pick one with ?mock=owner, or from the panel in the corner.
 */
export interface MockScenario {
  readonly role: MockRole;
  readonly hasActiveRuns: boolean;
  /** False: the user belongs to no organisation with the app installed. */
  readonly hasOrganization: boolean;
  /** Whether the session cookie "exists" before the user signs in through the UI. */
  readonly startsSignedIn: boolean;
  /** The outcome the mock sign-in reports on the callback URL. */
  readonly signInResult:
    "success" | "access_denied" | "state_mismatch" | "server_error";
  /** Requests answered before the session expires; null means it never does. */
  readonly expiresAfterRequests: number | null;
  /** Whether the organisation has repositories connected (with an organisation only). */
  readonly hasRepositories: boolean;
}

const STORAGE_KEY = "mock-scenario";

const SIGNED_IN_OWNER: MockScenario = {
  role: "owner",
  hasActiveRuns: true,
  hasOrganization: true,
  startsSignedIn: true,
  signInResult: "success",
  expiresAfterRequests: null,
  hasRepositories: true,
};

export const SCENARIOS: Record<string, MockScenario> = {
  member: { ...SIGNED_IN_OWNER, role: "member" },
  owner: SIGNED_IN_OWNER,
  admin: { ...SIGNED_IN_OWNER, role: "platform-admin" },
  idle: { ...SIGNED_IN_OWNER, hasActiveRuns: false },
  "signed-out": { ...SIGNED_IN_OWNER, startsSignedIn: false },
  denied: {
    ...SIGNED_IN_OWNER,
    startsSignedIn: false,
    signInResult: "access_denied",
  },
  "no-orgs": { ...SIGNED_IN_OWNER, hasOrganization: false },
  expired: { ...SIGNED_IN_OWNER, expiresAfterRequests: 1 },
  "no-repos": { ...SIGNED_IN_OWNER, hasRepositories: false },
};

export const DEFAULT_SCENARIO_NAME = "owner";

function readStored(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function currentScenarioName(): string {
  const fromUrl = new URLSearchParams(window.location.search).get("mock");
  const stored = readStored();

  if (fromUrl !== null && fromUrl in SCENARIOS) {
    if (fromUrl !== stored) {
      // A different scenario starts from its own sign-in state.
      resetMockSession(browserStorage());
    }

    try {
      localStorage.setItem(STORAGE_KEY, fromUrl);
    } catch {
      // Private windows can refuse storage; the URL parameter still applies.
    }

    return fromUrl;
  }

  return stored !== null && stored in SCENARIOS
    ? stored
    : DEFAULT_SCENARIO_NAME;
}

export function currentScenario(): MockScenario {
  return SCENARIOS[currentScenarioName()] ?? SIGNED_IN_OWNER;
}

export function setScenario(name: string): void {
  try {
    localStorage.setItem(STORAGE_KEY, name);
  } catch {
    // Ignore: the reload below falls back to the default scenario.
  }

  resetMockSession(browserStorage());
  window.location.reload();
}

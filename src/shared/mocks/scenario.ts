import { type MockRole } from "./state";

/**
 * Dev-only scenario switch. It decides which session and which runs the mock API serves,
 * so role guards and empty states can be checked without editing fixtures.
 * Pick one with ?mock=owner, or from the panel in the corner.
 */
export interface MockScenario {
  readonly role: MockRole;
  readonly hasActiveRuns: boolean;
}

const STORAGE_KEY = "mock-scenario";

export const SCENARIOS: Record<string, MockScenario> = {
  member: { role: "member", hasActiveRuns: true },
  owner: { role: "owner", hasActiveRuns: true },
  admin: { role: "platform-admin", hasActiveRuns: true },
  idle: { role: "owner", hasActiveRuns: false },
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

  if (fromUrl !== null && fromUrl in SCENARIOS) {
    try {
      localStorage.setItem(STORAGE_KEY, fromUrl);
    } catch {
      // Private windows can refuse storage; the URL parameter still applies.
    }

    return fromUrl;
  }

  const stored = readStored();

  return stored !== null && stored in SCENARIOS
    ? stored
    : DEFAULT_SCENARIO_NAME;
}

const FALLBACK_SCENARIO: MockScenario = { role: "owner", hasActiveRuns: true };

export function currentScenario(): MockScenario {
  return SCENARIOS[currentScenarioName()] ?? FALLBACK_SCENARIO;
}

export function setScenario(name: string): void {
  try {
    localStorage.setItem(STORAGE_KEY, name);
  } catch {
    // Ignore: the reload below falls back to the default scenario.
  }

  window.location.reload();
}

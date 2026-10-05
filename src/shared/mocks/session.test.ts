import { describe, expect, it } from "vitest";

import { SCENARIOS } from "./scenario";
import {
  type MockStorage,
  createMockSession,
  mockSignInUrl,
  resetMockSession,
} from "./session";

function memoryStorage(): MockStorage {
  const values = new Map<string, string>();

  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => {
      values.set(key, value);
    },
    removeItem: (key) => {
      values.delete(key);
    },
  };
}

const AT_RUNS = { pathname: "/runs", search: "" };

function scenario(name: string) {
  const found = SCENARIOS[name];

  if (!found) {
    throw new Error(`Unknown scenario ${name}`);
  }

  return found;
}

describe("createMockSession", () => {
  it("starts signed in for the role scenarios", () => {
    const session = createMockSession({
      scenario: scenario("owner"),
      storage: memoryStorage(),
      location: AT_RUNS,
    });

    expect(session.authorize()).toBe(true);
  });

  it("stays signed out until the callback page reports a successful sign-in", () => {
    const storage = memoryStorage();
    const signedOut = createMockSession({
      scenario: scenario("signed-out"),
      storage,
      location: AT_RUNS,
    });

    expect(signedOut.authorize()).toBe(false);

    const afterCallback = createMockSession({
      scenario: scenario("signed-out"),
      storage,
      location: { pathname: "/auth/callback", search: "?result=success" },
    });

    expect(afterCallback.authorize()).toBe(true);

    // The sign-in survives a reload.
    expect(
      createMockSession({
        scenario: scenario("signed-out"),
        storage,
        location: AT_RUNS,
      }).authorize(),
    ).toBe(true);
  });

  it("does not sign in after a cancelled sign-in", () => {
    const session = createMockSession({
      scenario: scenario("denied"),
      storage: memoryStorage(),
      location: { pathname: "/auth/callback", search: "?result=access_denied" },
    });

    expect(session.authorize()).toBe(false);
  });

  it("keeps a sign-out across reloads", () => {
    const storage = memoryStorage();

    createMockSession({
      scenario: scenario("owner"),
      storage,
      location: AT_RUNS,
    }).signOut();

    expect(
      createMockSession({
        scenario: scenario("owner"),
        storage,
        location: AT_RUNS,
      }).authorize(),
    ).toBe(false);
  });

  it("expires the session on the second request, once per scenario", () => {
    const storage = memoryStorage();
    const session = createMockSession({
      scenario: scenario("expired"),
      storage,
      location: AT_RUNS,
    });

    expect(session.authorize()).toBe(true);
    expect(session.authorize()).toBe(false);
    expect(session.authorize()).toBe(false);

    const signedInAgain = createMockSession({
      scenario: scenario("expired"),
      storage,
      location: { pathname: "/auth/callback", search: "?result=success" },
    });

    expect(signedInAgain.authorize()).toBe(true);
    expect(signedInAgain.authorize()).toBe(true);
  });

  it("starts the scenario afresh after a reset", () => {
    const storage = memoryStorage();

    createMockSession({
      scenario: scenario("owner"),
      storage,
      location: AT_RUNS,
    }).signOut();
    resetMockSession(storage);

    expect(
      createMockSession({
        scenario: scenario("owner"),
        storage,
        location: AT_RUNS,
      }).authorize(),
    ).toBe(true);
  });
});

describe("mockSignInUrl", () => {
  it("skips GitHub and lands on the callback with the scenario's outcome", () => {
    expect(mockSignInUrl(scenario("denied"), "/runs")).toBe(
      "/auth/callback?result=access_denied&return_to=%2Fruns",
    );
    expect(mockSignInUrl(scenario("owner"), null)).toBe(
      "/auth/callback?result=success",
    );
  });
});

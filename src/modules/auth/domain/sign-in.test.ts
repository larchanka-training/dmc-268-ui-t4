import { describe, expect, it } from "vitest";

import { type Session } from "./session";
import {
  SIGN_IN_SUCCESS_PATH,
  parseSignInResult,
  signInDestination,
} from "./sign-in";

function session(currentOrganizationId: string | null): Session {
  return {
    user: {
      id: "u1",
      login: "octocat",
      name: "Octo Cat",
      avatarUrl: null,
      isPlatformAdmin: false,
    },
    organizations: [
      {
        id: "org1",
        login: "acme",
        name: "Acme",
        avatarUrl: null,
        role: "owner",
      },
    ],
    currentOrganizationId,
  };
}

describe("parseSignInResult", () => {
  it.each(["success", "access_denied", "state_mismatch", "server_error"])(
    "accepts %s",
    (value) => {
      expect(parseSignInResult(value)).toBe(value);
    },
  );

  it.each([undefined, null, "", "weird", 42])(
    "treats %j as a server error",
    (value) => {
      expect(parseSignInResult(value)).toBe("server_error");
    },
  );
});

describe("signInDestination", () => {
  it("returns to the page the user was trying to open", () => {
    expect(signInDestination(session("org1"), "/runs?status=failed")).toBe(
      "/runs?status=failed",
    );
  });

  it("lands on the success page when there was no return path", () => {
    expect(signInDestination(session("org1"), undefined)).toBe(
      SIGN_IN_SUCCESS_PATH,
    );
  });

  it("lands on the success page when the return path is unsafe", () => {
    expect(signInDestination(session("org1"), "//evil.example")).toBe(
      SIGN_IN_SUCCESS_PATH,
    );
  });

  it("lands on the success page when the user has no organisation", () => {
    expect(signInDestination(session(null), "/runs")).toBe(
      SIGN_IN_SUCCESS_PATH,
    );
  });

  it("lands on the success page when the current organisation is unknown", () => {
    expect(signInDestination(session("missing"), "/runs")).toBe(
      SIGN_IN_SUCCESS_PATH,
    );
  });
});

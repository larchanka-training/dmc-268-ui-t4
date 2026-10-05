import { describe, expect, it } from "vitest";

import {
  type Organization,
  type Session,
  currentOrganization,
} from "./session";

const acme: Organization = {
  id: "org1",
  login: "acme",
  name: "Acme",
  avatarUrl: null,
  role: "member",
};

function session(currentOrganizationId: string | null): Session {
  return {
    user: {
      id: "u1",
      login: "octocat",
      name: "Octo Cat",
      avatarUrl: "https://example.test/octocat.png",
      isPlatformAdmin: false,
    },
    organizations: currentOrganizationId === null ? [] : [acme],
    currentOrganizationId,
  };
}

describe("currentOrganization", () => {
  it("finds the organisation the console is showing", () => {
    expect(currentOrganization(session("org1"))).toBe(acme);
  });

  it("is null for a user whose organisations have not installed the app", () => {
    expect(currentOrganization(session(null))).toBeNull();
  });
});

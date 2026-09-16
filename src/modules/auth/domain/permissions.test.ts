import { describe, expect, it } from "vitest";

import { can } from "./permissions";
import { type Session } from "./session";

function session(overrides: {
  role?: "member" | "owner";
  isPlatformAdmin?: boolean;
}): Session {
  return {
    user: {
      id: "u1",
      login: "octocat",
      name: "Octo Cat",
      avatarUrl: "https://example.test/avatar.png",
      isPlatformAdmin: overrides.isPlatformAdmin ?? false,
    },
    organizations: [
      {
        id: "org1",
        login: "acme",
        name: "Acme",
        avatarUrl: "https://example.test/acme.png",
        role: overrides.role ?? "member",
      },
    ],
    currentOrganizationId: "org1",
  };
}

describe("can", () => {
  it("denies everything without a session", () => {
    expect(can(null, "runs:view")).toBe(false);
    expect(can(null, "admin:view")).toBe(false);
  });

  it("lets any member view runs and the current plan", () => {
    const member = session({ role: "member" });

    expect(can(member, "runs:view")).toBe(true);
    expect(can(member, "billing:view")).toBe(true);
  });

  it("restricts buying and changing a subscription to owners", () => {
    expect(can(session({ role: "member" }), "billing:manage")).toBe(false);
    expect(can(session({ role: "owner" }), "billing:manage")).toBe(true);
  });

  it("opens the admin area only to platform admins", () => {
    expect(can(session({ role: "owner" }), "admin:view")).toBe(false);
    expect(can(session({ isPlatformAdmin: true }), "admin:view")).toBe(true);
  });

  it("denies organisation actions when the current organisation is unknown", () => {
    const orphan: Session = {
      ...session({}),
      currentOrganizationId: "missing",
    };

    expect(can(orphan, "runs:view")).toBe(false);
  });
});

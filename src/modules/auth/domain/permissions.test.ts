import { describe, expect, it } from "vitest";

import { can, canManageRepositoriesOf } from "./permissions";
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

  it("lets anyone signed in connect repositories", () => {
    // GitHub asks for the account on its install page; a member can pick their own.
    expect(can(session({ role: "owner" }), "repositories:connect")).toBe(true);
    expect(can(session({ role: "member" }), "repositories:connect")).toBe(true);
    expect(
      can(
        { ...session({}), organizations: [], currentOrganizationId: null },
        "repositories:connect",
      ),
    ).toBe(true);
    expect(can(null, "repositories:connect")).toBe(false);
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

describe("canManageRepositoriesOf", () => {
  it("follows the role in that account, not in the current one", () => {
    const member: Session = {
      ...session({ role: "member" }),
      organizations: [
        ...session({ role: "member" }).organizations,
        {
          id: "acct_octocat",
          login: "octocat",
          name: "Octo Cat",
          avatarUrl: null,
          role: "owner",
        },
      ],
    };

    expect(canManageRepositoriesOf(member, "org1")).toBe(false);
    expect(canManageRepositoriesOf(member, "acct_octocat")).toBe(true);
  });

  it("falls back to the current organisation when the account is not known", () => {
    // An older backend lists only the current organisation and sends no account.
    expect(canManageRepositoriesOf(session({ role: "owner" }), null)).toBe(
      true,
    );
    expect(canManageRepositoriesOf(session({ role: "member" }), null)).toBe(
      false,
    );
  });

  it("denies an unknown account and a missing session", () => {
    expect(canManageRepositoriesOf(session({ role: "owner" }), "other")).toBe(
      false,
    );
    expect(canManageRepositoriesOf(null, "org1")).toBe(false);
    expect(canManageRepositoriesOf(null, null)).toBe(false);
  });
});

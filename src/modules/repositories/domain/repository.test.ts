import { describe, expect, it } from "vitest";

import { isSafeConnectUrl } from "./connect-url";
import {
  type Repository,
  groupByOrganization,
  recentlyReviewed,
  sidebarSlice,
  sortByFullName,
} from "./repository";

function repository(
  owner: string,
  name: string,
  lastRunAt: string | null = null,
  organizationId: string | null = null,
): Repository {
  return {
    id: `${owner}/${name}`,
    owner,
    name,
    fullName: `${owner}/${name}`,
    isPrivate: false,
    defaultBranch: "main",
    htmlUrl: null,
    connectedAt: null,
    lastRunAt,
    organizationId,
  };
}

const names = (repositories: readonly Repository[]) =>
  repositories.map((item) => item.fullName);

describe("sortByFullName", () => {
  it("orders by owner and name, ignoring case, without touching the input", () => {
    const input = [
      repository("acme", "web"),
      repository("Acme", "API"),
      repository("beta", "app"),
      repository("acme", "billing"),
    ];

    expect(names(sortByFullName(input))).toEqual([
      "Acme/API",
      "acme/billing",
      "acme/web",
      "beta/app",
    ]);
    expect(names(input)[0]).toBe("acme/web");
  });
});

describe("sidebarSlice", () => {
  const eleven = Array.from({ length: 11 }, (_, index) =>
    repository("acme", `repo-${String(index).padStart(2, "0")}`),
  );

  it("shows the first eight and says there are more", () => {
    const slice = sidebarSlice(eleven, 11);

    expect(slice.items).toHaveLength(8);
    expect(slice.items[0]?.fullName).toBe("acme/repo-00");
    expect(slice.hasMore).toBe(true);
  });

  it("knows there are more from the total even when only one page is loaded", () => {
    expect(sidebarSlice(eleven.slice(0, 5), 11).hasMore).toBe(true);
  });

  it("shows everything when it fits", () => {
    const slice = sidebarSlice(eleven.slice(0, 3), 3);

    expect(slice.items).toHaveLength(3);
    expect(slice.hasMore).toBe(false);
  });
});

describe("recentlyReviewed", () => {
  it("puts the most recent review first and leaves out unreviewed ones", () => {
    const input = [
      repository("acme", "old", "2026-09-01T00:00:00.000Z"),
      repository("acme", "never"),
      repository("acme", "newest", "2026-10-03T00:00:00.000Z"),
      repository("acme", "middle", "2026-09-20T00:00:00.000Z"),
    ];

    expect(names(recentlyReviewed(input, 2))).toEqual([
      "acme/newest",
      "acme/middle",
    ]);
  });
});

describe("isSafeConnectUrl", () => {
  it.each([
    "https://github.com/apps/review-agent/installations/new",
    "/repositories?connected=1",
  ])("accepts %s", (url) => {
    expect(isSafeConnectUrl(url)).toBe(true);
  });

  it.each([
    "http://github.com/apps/review-agent",
    "javascript:alert(1)",
    "//evil.example/install",
    "/\\evil.example",
    "repositories",
    "",
  ])("rejects %s", (url) => {
    expect(isSafeConnectUrl(url)).toBe(false);
  });
});

describe("groupByOrganization", () => {
  it("keeps the list order inside a group and orders groups by first appearance", () => {
    const groups = groupByOrganization([
      repository("acme", "api", null, "org_acme"),
      repository("acme", "web", null, "org_acme"),
      repository("octocat", "blog", null, "acct_octocat"),
      repository("octocat", "dotfiles", null, "acct_octocat"),
    ]);

    expect(
      groups.map((group) => [group.organizationId, names(group.repositories)]),
    ).toEqual([
      ["org_acme", ["acme/api", "acme/web"]],
      ["acct_octocat", ["octocat/blog", "octocat/dotfiles"]],
    ]);
  });

  it("puts repositories without an account into one group", () => {
    const groups = groupByOrganization([
      repository("acme", "api"),
      repository("acme", "web"),
    ]);

    expect(groups).toHaveLength(1);
    expect(groups[0]?.organizationId).toBeNull();
  });

  it("has no groups for an empty list", () => {
    expect(groupByOrganization([])).toEqual([]);
  });
});

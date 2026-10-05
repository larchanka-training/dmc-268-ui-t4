import { describe, expect, it } from "vitest";

import { sanitizeReturnTo } from "./return-to";

describe("sanitizeReturnTo", () => {
  it("keeps a local path together with its search and hash", () => {
    expect(sanitizeReturnTo("/runs?status=failed#top")).toBe(
      "/runs?status=failed#top",
    );
  });

  it("treats a missing or empty value as no return path", () => {
    expect(sanitizeReturnTo(undefined)).toBeNull();
    expect(sanitizeReturnTo(null)).toBeNull();
    expect(sanitizeReturnTo("")).toBeNull();
  });

  it.each([
    "https://evil.example",
    "//evil.example",
    "/\\evil.example",
    "runs",
    "javascript:alert(1)",
  ])("rejects %s, which would leave the console", (value) => {
    expect(sanitizeReturnTo(value)).toBeNull();
  });

  it.each(["/runs\n", "/r\u0000uns", "/\tevil", "/runs\u007f"])(
    "rejects a path with control characters (%j)",
    (value) => {
      expect(sanitizeReturnTo(value)).toBeNull();
    },
  );

  it.each([
    "/login",
    "/login?returnTo=/runs",
    "/auth",
    "/auth/callback?result=success",
    "/auth/success",
  ])("rejects %s, which would loop back into sign-in", (value) => {
    expect(sanitizeReturnTo(value)).toBeNull();
  });

  it("keeps paths that merely start with the same letters", () => {
    expect(sanitizeReturnTo("/authors")).toBe("/authors");
    expect(sanitizeReturnTo("/login-help")).toBe("/login-help");
  });
});

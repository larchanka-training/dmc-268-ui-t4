import { describe, expect, it } from "vitest";

import { httpsUrlOrNull } from "./url";

describe("httpsUrlOrNull", () => {
  it("keeps an https URL", () => {
    expect(httpsUrlOrNull("https://avatars.githubusercontent.com/u/1")).toBe(
      "https://avatars.githubusercontent.com/u/1",
    );
  });

  it.each([
    "http://avatars.example/u/1",
    "javascript:alert(1)",
    "data:image/png;base64,AAAA",
    "not a url",
    "",
  ])("drops %s", (value) => {
    expect(httpsUrlOrNull(value)).toBeNull();
  });
});

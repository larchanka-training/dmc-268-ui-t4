import { describe, expect, it, vi } from "vitest";

import { createUnauthorizedHandler } from "./unauthorized-handler";

function setup(pathname = "/runs", href = "/runs?status=failed") {
  let finishNavigation: () => void = () => undefined;
  const ports = {
    currentLocation: vi.fn(() => ({ pathname, href })),
    clearSession: vi.fn(),
    redirectToLogin: vi.fn(
      () =>
        new Promise<void>((resolve) => {
          finishNavigation = resolve;
        }),
    ),
  };

  return {
    ports,
    handle: createUnauthorizedHandler(ports),
    finishNavigation: () => {
      finishNavigation();
    },
  };
}

describe("createUnauthorizedHandler", () => {
  it("drops the session and sends the user to sign in, keeping their place", () => {
    const { ports, handle } = setup();

    handle();

    expect(ports.clearSession).toHaveBeenCalledOnce();
    expect(ports.redirectToLogin).toHaveBeenCalledWith("/runs?status=failed");
  });

  it("redirects once for a burst of 401s", () => {
    const { ports, handle } = setup();

    handle();
    handle();
    handle();

    expect(ports.redirectToLogin).toHaveBeenCalledOnce();
  });

  it("handles the next lost session once the redirect has finished", async () => {
    const { ports, handle, finishNavigation } = setup();

    handle();
    finishNavigation();
    await Promise.resolve();
    await Promise.resolve();
    handle();

    expect(ports.redirectToLogin).toHaveBeenCalledTimes(2);
  });

  it.each(["/login", "/auth/callback", "/auth/success"])(
    "stays put on %s, which already deals with signing in",
    (pathname) => {
      const { ports, handle } = setup(pathname, pathname);

      handle();

      expect(ports.redirectToLogin).not.toHaveBeenCalled();
      expect(ports.clearSession).not.toHaveBeenCalled();
    },
  );
});

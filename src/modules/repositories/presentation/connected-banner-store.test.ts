import { beforeEach, describe, expect, it } from "vitest";

import {
  announceRepositoriesConnected,
  useConnectedBannerStore,
} from "./connected-banner-store";

describe("the 'repositories connected' banner", () => {
  beforeEach(() => {
    useConnectedBannerStore.getState().dismiss();
  });

  it("is hidden until GitHub sends the user back", () => {
    expect(useConnectedBannerStore.getState().isVisible).toBe(false);
  });

  it("shows once announced and hides when dismissed", () => {
    announceRepositoriesConnected();
    expect(useConnectedBannerStore.getState().isVisible).toBe(true);

    useConnectedBannerStore.getState().dismiss();
    expect(useConnectedBannerStore.getState().isVisible).toBe(false);
  });
});

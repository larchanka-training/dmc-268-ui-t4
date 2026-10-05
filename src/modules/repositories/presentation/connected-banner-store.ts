import { create } from "zustand";

/**
 * Ephemeral UI state: whether to say "your repository list is up to date" after GitHub
 * sent the user back. It lives in memory, so a reload does not repeat it.
 */
interface ConnectedBannerState {
  readonly isVisible: boolean;
  show: () => void;
  dismiss: () => void;
}

export const useConnectedBannerStore = create<ConnectedBannerState>()(
  (set) => ({
    isVisible: false,
    show: () => {
      set({ isVisible: true });
    },
    dismiss: () => {
      set({ isVisible: false });
    },
  }),
);

/** Called by the route that GitHub's Setup URL leads back to. */
export function announceRepositoriesConnected(): void {
  useConnectedBannerStore.getState().show();
}

import { type AuthNotifier } from "../application/ports";

/** The part of BroadcastChannel the notifier uses, so tests can connect fake tabs. */
export interface AuthChannel {
  postMessage: (message: unknown) => void;
  addEventListener: (
    type: "message",
    listener: (event: { data: unknown }) => void,
  ) => void;
  removeEventListener: (
    type: "message",
    listener: (event: { data: unknown }) => void,
  ) => void;
}

const CHANNEL_NAME = "auth";

function isSignedOutMessage(data: unknown): boolean {
  return (
    typeof data === "object" &&
    data !== null &&
    "type" in data &&
    data.type === "signed-out"
  );
}

function openBrowserChannel(): AuthChannel | null {
  return typeof BroadcastChannel === "undefined"
    ? null
    : new BroadcastChannel(CHANNEL_NAME);
}

/**
 * Cross-tab sign-out over BroadcastChannel. A channel never receives its own messages, so
 * the tab that signs out handles itself and only the other tabs react to the broadcast.
 * Where BroadcastChannel is missing, other tabs notice on their next request (401).
 */
export function createBroadcastChannelNotifier(
  openChannel: () => AuthChannel | null = openBrowserChannel,
): AuthNotifier {
  let channel: AuthChannel | null | undefined;

  const getChannel = (): AuthChannel | null => {
    channel ??= openChannel();

    return channel;
  };

  return {
    notifySignedOut() {
      getChannel()?.postMessage({ type: "signed-out" });
    },

    onSignedOut(listener) {
      const current = getChannel();

      if (current === null) {
        return () => undefined;
      }

      const handle = (event: { data: unknown }) => {
        if (isSignedOutMessage(event.data)) {
          listener();
        }
      };

      current.addEventListener("message", handle);

      return () => {
        current.removeEventListener("message", handle);
      };
    },
  };
}

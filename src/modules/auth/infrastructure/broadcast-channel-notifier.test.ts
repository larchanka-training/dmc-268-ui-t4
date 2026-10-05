import { describe, expect, it, vi } from "vitest";

import {
  type AuthChannel,
  createBroadcastChannelNotifier,
} from "./broadcast-channel-notifier";

type Listener = (event: { data: unknown }) => void;

/** Two tabs: a message posted by one is delivered to the other, never to itself. */
function connectedChannels(): [AuthChannel, AuthChannel] {
  const listeners = new Map<AuthChannel, Set<Listener>>();

  const create = (): AuthChannel => {
    const channel: AuthChannel = {
      postMessage: (data) => {
        for (const [other, set] of listeners) {
          if (other !== channel) {
            set.forEach((listener) => {
              listener({ data });
            });
          }
        }
      },
      addEventListener: (_type, listener) => {
        listeners.get(channel)?.add(listener);
      },
      removeEventListener: (_type, listener) => {
        listeners.get(channel)?.delete(listener);
      },
    };
    listeners.set(channel, new Set());

    return channel;
  };

  return [create(), create()];
}

describe("createBroadcastChannelNotifier", () => {
  it("tells the other tabs that the user signed out", () => {
    const [first, second] = connectedChannels();
    const thisTab = createBroadcastChannelNotifier(() => first);
    const otherTab = createBroadcastChannelNotifier(() => second);
    const onSignedOut = vi.fn();

    otherTab.onSignedOut(onSignedOut);
    thisTab.notifySignedOut();

    expect(onSignedOut).toHaveBeenCalledOnce();
  });

  it("ignores unrelated messages", () => {
    const [first, second] = connectedChannels();
    const onSignedOut = vi.fn();

    createBroadcastChannelNotifier(() => second).onSignedOut(onSignedOut);
    first.postMessage({ type: "something-else" });
    first.postMessage("signed-out");

    expect(onSignedOut).not.toHaveBeenCalled();
  });

  it("stops listening once unsubscribed", () => {
    const [first, second] = connectedChannels();
    const onSignedOut = vi.fn();

    const unsubscribe = createBroadcastChannelNotifier(
      () => second,
    ).onSignedOut(onSignedOut);
    unsubscribe();
    createBroadcastChannelNotifier(() => first).notifySignedOut();

    expect(onSignedOut).not.toHaveBeenCalled();
  });

  it("does nothing where BroadcastChannel is unavailable", () => {
    const notifier = createBroadcastChannelNotifier(() => null);

    expect(() => {
      notifier.notifySignedOut();
    }).not.toThrow();
    expect(() => {
      notifier.onSignedOut(vi.fn())();
    }).not.toThrow();
  });
});

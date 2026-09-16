import { setupWorker } from "msw/browser";

import { handlers } from "./handlers";

/**
 * Starts the mock backend in the browser. Requests still go through fetch and the HTTP
 * adapters, so only the network is faked.
 */
export async function startMockServiceWorker(): Promise<void> {
  const worker = setupWorker(...handlers);

  await worker.start({
    onUnhandledRequest: "bypass",
    quiet: true,
  });
}

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { App } from "./App";
import { env } from "./config/env";
import { startThemeSync } from "./providers/theme";
import "./styles/index.css";

const container = document.getElementById("root");

if (!container) {
  throw new Error("Root container #root is missing in index.html");
}

/**
 * Statically false in a normal production build, so the bundler drops the import below
 * together with MSW and the fixtures. The demo build keeps them.
 */
const MOCKS_AVAILABLE = import.meta.env.DEV || import.meta.env.MODE === "demo";

async function startMocks(): Promise<void> {
  if (!MOCKS_AVAILABLE || !env.enableMocks) {
    return;
  }

  // Dynamic import keeps MSW and the fixtures out of the production bundle.
  const { startMockServiceWorker } = await import("@/shared/mocks/browser");

  await startMockServiceWorker();
}

startThemeSync();

void startMocks().then(() => {
  createRoot(container).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
});

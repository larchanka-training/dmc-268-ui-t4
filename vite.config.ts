import { fileURLToPath } from "node:url";

import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  // No VITE_ prefix: the backend address is dev-server config and never reaches the bundle.
  const apiProxyTarget = loadEnv(mode, process.cwd(), "")["API_PROXY_TARGET"];

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url)),
      },
    },
    server: {
      // Serves the real API from the dev origin, so the session cookie stays same-site as
      // in production. With the mocks on, MSW answers before the request reaches the proxy.
      proxy: apiProxyTarget
        ? {
            // The backend's routes carry no /api prefix (/me, /auth/github, ...),
            // so strip it here as the reverse proxy does in production.
            "/api": {
              target: apiProxyTarget,
              changeOrigin: true,
              rewrite: (path) => path.replace(/^\/api/, ""),
            },
          }
        : undefined,
    },
  };
});

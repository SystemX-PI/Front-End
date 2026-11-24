import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(async ({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const useMock =
    command === "serve" &&
    (process.env.VITE_USE_MOCK ?? env.VITE_USE_MOCK) === "true";
  const proxyTarget =
    process.env.VITE_API_PROXY_TARGET ||
    env.VITE_API_PROXY_TARGET ||
    "http://localhost:8080";

  const mock = useMock ? (await import("./dev/mock-api.ts")).devMockPlugin() : null;

  return {
    plugins: [react(), tailwindcss(), ...(mock ? [mock] : [])],
    server: {
      proxy: {
        "/api": {
          target: proxyTarget,
          changeOrigin: true,
        },
      },
    },
  };
});

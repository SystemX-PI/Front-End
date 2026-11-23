import { defineConfig } from "@playwright/test";

const target = "http://127.0.0.1:18087";
const front = "http://127.0.0.1:5177";

if (!process.env.SYSTEMX_E2E_PASSWORD) {
  throw new Error("Configure a senha efêmera da fixture no banco isolado antes de executar a suíte real.");
}

export default defineConfig({
  testDir: "./tests",
  testMatch: "live.spec.ts",
  reporter: "list",
  outputDir: "node_modules/.cache/systemx-playwright-live",
  timeout: 60000,
  workers: 1,
  use: { baseURL: front, browserName: "chromium", trace: "off" },
  webServer: {
    command: "npm run dev -- --host 127.0.0.1 --port 5177 --strictPort",
    env: { VITE_API_PROXY_TARGET: target, VITE_USE_MOCK: "false", VITE_API_URL: "", VITE_GOOGLE_CLIENT_ID: "" },
    url: front,
    reuseExistingServer: false,
    timeout: 30000,
  },
});

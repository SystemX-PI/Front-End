import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  reporter: process.env.CI ? [["list"], ["github"]] : "list",
  use: {
    baseURL: "http://127.0.0.1:5174",
    headless: true,
    channel: process.env.PLAYWRIGHT_CHANNEL || (process.env.CI ? undefined : "msedge"),
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  webServer: {
    command: "npm run dev -- --host 127.0.0.1 --port 5174 --strictPort",
    env: {
      VITE_GOOGLE_CLIENT_ID: process.env.PLAYWRIGHT_GOOGLE_CLIENT_ID || "test-google-client-id.apps.googleusercontent.com",
    },
    url: "http://127.0.0.1:5174",
    reuseExistingServer: true,
    timeout: 30000,
  },
});

import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  retries: 0,
  workers: 1,
  // The list reporter emits one completed PASS/FAIL row at a time. The
  // PowerShell verification runner streams these rows instead of buffering
  // the complete Playwright process until the end.
  reporter: [["list"]],
  use: {
    baseURL: "http://127.0.0.1:3107",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "desktop-chrome",
      use: { ...devices["Desktop Chrome"], channel: "chrome" },
    },
    {
      name: "mobile-chrome",
      use: { ...devices["Pixel 7"], channel: "chrome" },
    },
    {
      name: "reduced-motion",
      use: {
        ...devices["Desktop Chrome"],
        channel: "chrome",
        reducedMotion: "reduce",
      },
    },
  ],
  webServer: {
    command: "npm run dev:test",
    url: "http://127.0.0.1:3107",
    reuseExistingServer: false,
    timeout: 120_000,
  },
});

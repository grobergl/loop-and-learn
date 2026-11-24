import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests",
  testMatch: "**/*.spec.js",
  use: {
    headless: true,
    viewport: { width: 1440, height: 1000 },
    launchOptions: {
      executablePath: "/usr/bin/chromium",
      args: ["--no-sandbox"],
    },
  },
  workers: 1,
  reporter: "list",
});

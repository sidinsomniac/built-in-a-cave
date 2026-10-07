import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "e2e",
  timeout: 90_000,
  expect: { timeout: 15_000 },
  use: {
    baseURL: "http://localhost:4174",
    // Animations off by default, so tests never wait on motion. One test turns them back on.
    contextOptions: { reducedMotion: "reduce" },
    launchOptions: { executablePath: process.env.CHROMIUM_PATH || undefined },
  },
  webServer: {
    command: "npm run build && npx vite preview --port 4174 --strictPort",
    url: "http://localhost:4174",
    timeout: 180_000,
    reuseExistingServer: !process.env.CI,
  },
});

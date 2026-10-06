import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

// `npm run validate-content`: proves every exercise and case in content/.
// Runs in jsdom so code missions execute with the same harness as the sandbox iframe.
export default defineConfig({
  plugins: [react()],
  test: {
    include: ["scripts/validate-content.test.ts"],
    environment: "jsdom",
    testTimeout: 60_000,
  },
});

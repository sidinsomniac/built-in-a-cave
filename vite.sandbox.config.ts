import { defineConfig } from "vite";

// Builds the sandbox runtime (the test harness, React, Testing Library, axe) as one
// classic IIFE script in public/sandbox/, loaded by public/sandbox.html.
export default defineConfig({
  publicDir: false,
  define: { "process.env.NODE_ENV": JSON.stringify("production") },
  build: {
    outDir: "public/sandbox",
    emptyOutDir: true,
    chunkSizeWarningLimit: 2500,
    lib: { entry: "src/runtime/sandbox/main.ts", formats: ["iife"], name: "WorkshopSandbox", fileName: () => "sandbox.js" },
  },
});

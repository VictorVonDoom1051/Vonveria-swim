import { defineConfig } from "vitest/config";

export default defineConfig({
  esbuild: {
    jsx: "automatic",
  },
  test: {
    globals: false,
    restoreMocks: true,
    reporters: "default",
    environment: "jsdom",
    include: ["app/**/*.test.tsx", "app/**/*.test.ts", "lib/**/*.test.ts", "lib/**/*.test.tsx"],
  },
});

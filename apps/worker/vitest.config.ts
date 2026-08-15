import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: false,
    restoreMocks: true,
    reporters: "default",
    environment: "node",
    include: ["src/**/*.spec.ts"],
    setupFiles: ["./src/test-setup.ts"],
  },
});

import "dotenv/config";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    environment: "node",
    globalSetup: "./tests/global-setup.ts",
    env: { DATABASE_URL: process.env.TEST_DATABASE_URL ?? "" },
    fileParallelism: false,
    testTimeout: 20000,
    hookTimeout: 60000,
  },
});

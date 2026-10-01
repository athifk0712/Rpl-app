import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    environment: "node",
    globalSetup: "./tests/global-setup.ts",
    env: { DATABASE_URL: "file:./prisma/test.db" },
    fileParallelism: false,
  },
});

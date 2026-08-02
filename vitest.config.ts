import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "node",
    // scripts/ is covered too: the data importers are not reachable from a
    // test (they call main() on import), so their non-trivial logic lives in
    // scripts/lib/ and is tested there.
    include: ["src/**/*.test.ts", "scripts/**/*.test.ts"],
    globals: false,
  },
});

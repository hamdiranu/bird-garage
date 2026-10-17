import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

/* Unit tests live in a __tests__ folder beside the files they cover (src/lib/__tests__/fleet.test.ts tests
   src/lib/fleet.ts). They run in jsdom; the 3D stage itself is left to the browser. */
export default defineConfig({
  plugins: [react()],
  // the @/ alias from tsconfig.json
  resolve: { tsconfigPaths: true },
  test: {
    environment: "jsdom",
    include: ["src/**/__tests__/**/*.test.{ts,tsx}"],
    setupFiles: ["./vitest.setup.ts"],
    restoreMocks: true,
    unstubGlobals: true,
    unstubEnvs: true,
  },
});

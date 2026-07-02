import { defineVitestConfig } from "@nuxt/test-utils/config";

// Service and composable specs run in the lightweight happy-dom environment.
// Component specs opt into the Nuxt environment per-file via:
//   // @vitest-environment nuxt
export default defineVitestConfig({
  test: {
    environment: "happy-dom",
    setupFiles: ["./app/test/setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html", "cobertura"],
      exclude: [
        "node_modules/",
        ".nuxt/",
        ".output/",
        "app/test/",
        "**/*.spec.ts",
        "**/*.d.ts",
        "nuxt.config.ts",
        "vitest.config.ts",
      ],
    },
  },
});

import { execSync } from "child_process";

// Get git commit SHA for deployment tracking
const getGitCommitSha = () => {
  try {
    return execSync("git rev-parse HEAD").toString().trim();
  } catch {
    return "unknown";
  }
};

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },
  // TEMP (branch previews): branch builds are SPA-only + hash-routed (see
  // app/router.options.ts), so skip SSR/prerender for them. Main/local unaffected.
  ssr: !process.env.NUXT_APP_BASE_URL?.includes("/branches/"),
  modules: ["@nuxt/ui", "@nuxt/content", "@posthog/nuxt"],
  css: ["~/assets/css/main.css"],
  app: {
    // NUXT_APP_BASE_URL wins so branch-preview builds can serve from a
    // per-branch sub-path (see .github/workflows/branch-preview.yml).
    baseURL:
      process.env.NUXT_APP_BASE_URL ??
      (process.env.NODE_ENV === "production"
        ? "/cmip7-dashboard-previews/"
        : "/"),
  },
  runtimeConfig: {
    public: {
      gitCommitSha: getGitCommitSha(),
      buildTime: new Date().toISOString(),
      // CMIP7 parquet data source (previously the VITE_CMIP7_* env vars).
      cmip7ParquetSource:
        process.env.NUXT_PUBLIC_CMIP7_PARQUET_SOURCE ?? "s3://gm-tas/gm_tas.pq",
      cmip7ParquetFileName:
        process.env.NUXT_PUBLIC_CMIP7_PARQUET_FILE_NAME ?? "gm_tas.pq",
      // Payu telemetry endpoint (tracking-services API).
      payuCmip7ApiUrl: process.env.NUXT_PUBLIC_PAYU_CMIP7_API_URL ?? "",
    },
  },
  posthogConfig: {
    publicKey: process.env.NUXT_PUBLIC_POSTHOG_KEY,
    host: process.env.NUXT_PUBLIC_POSTHOG_HOST,
    clientConfig: {
      persistence: "memory",
    },
  },
  content: {
    build: {
      markdown: {
        highlight: {
          theme: {
            default: "github-light",
            dark: "github-dark",
          },
          langs: ["js", "ts", "vue", "json", "yaml", "bash", "python"],
        },
      },
    },
  },
  vite: {
    // DuckDB-WASM ships its own web workers; excluding it from pre-bundling
    // keeps Vite from rewriting the worker/wasm asset URLs.
    optimizeDeps: {
      exclude: ["@duckdb/duckdb-wasm"],
    },
  },
});

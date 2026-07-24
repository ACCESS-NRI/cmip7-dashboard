import { execSync } from "child_process";

// Get git commit SHA for deployment tracking
const getGitCommitSha = () => {
  try {
    return execSync("git rev-parse HEAD").toString().trim();
  } catch {
    return "unknown";
  }
};

// Get the build's release tag: workflow-provided version > exact tag on HEAD > "".
// An empty string means "no tag" and lets the UI fall back to the short SHA.
const getAppVersion = () => {
  if (process.env.APP_VERSION) {
    return process.env.APP_VERSION;
  }

  try {
    return execSync("git describe --tags --exact-match HEAD").toString().trim();
  } catch {
    return "";
  }
};

// Base path for the deploy: GitHub Pages serves under /cmip7-dashboard/.
// Nuxt does not rewrite head-link hrefs with app.baseURL, so the favicon href
// is prefixed manually below to avoid a 404 on the subpath deploy.
const baseURL =
  process.env.NODE_ENV === "production" ? "/cmip7-dashboard/" : "/";

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },
  modules: ["@nuxt/ui", "@nuxt/content", "@posthog/nuxt"],
  css: ["~/assets/css/main.css"],
  app: {
    baseURL,
    head: {
      link: [
        {
          rel: "icon",
          type: "image/svg+xml",
          href: `${baseURL}ACCESS-logo.svg`,
        },
      ],
    },
  },
  runtimeConfig: {
    public: {
      gitCommitSha: getGitCommitSha(),
      appVersion: getAppVersion(),
      githubRepositoryUrl: "https://github.com/ACCESS-NRI/cmip7-dashboard",
      buildTime: new Date().toISOString(),
      // CMIP7 parquet data source (previously the VITE_CMIP7_* env vars).
      // These keys serve the parked DummyClimatePlot in legacy/ (see legacy/README.md).
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

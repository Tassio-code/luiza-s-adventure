import { defineConfig } from "@lovable.dev/vite-tanstack-config";

const repositoryName = process.env["GITHUB_REPOSITORY"]?.split("/")[1];
const isGitHubActions = process.env["GITHUB_ACTIONS"] === "true";
const githubPagesBase = repositoryName
  ? repositoryName.endsWith(".github.io")
    ? "/"
    : `/${repositoryName}/`
  : "/";

export default defineConfig({
  vite: {
    base: githubPagesBase,
    build: {
      target: "esnext",
    },
  },
  nitro: isGitHubActions ? false : { preset: "cloudflare-module" },
  tanstackStart: {
    server: { entry: "server" },
    pages: [{ path: "/" }],
    prerender: {
      enabled: true,
      autoStaticPathsDiscovery: false,
    },
  },
});

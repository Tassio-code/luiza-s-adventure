import { defineConfig } from "@lovable.dev/vite-tanstack-config";

const repositoryName = process.env["GITHUB_REPOSITORY"]?.split("/")[1];
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
  nitro: {
    preset: process.env["GITHUB_ACTIONS"] === "true" ? "github-pages" : "cloudflare-module",
    static: true,
  },
  tanstackStart: process.env["GITHUB_ACTIONS"] === "true" ? {} : {
    server: { entry: "server" },
    pages: [{ path: "/" }],
    prerender: {
      enabled: true,
      autoStaticPathsDiscovery: false,
    },
  },
});

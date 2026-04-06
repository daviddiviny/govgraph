import path from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";

const repoRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), "../..");

const nextConfig: NextConfig = {
  outputFileTracingRoot: repoRoot,
  transpilePackages: ["@govgraph/domain", "@govgraph/parsers", "@govgraph/ui"],
  turbopack: {
    root: repoRoot,
  },
  typedRoutes: true,
};

export default nextConfig;

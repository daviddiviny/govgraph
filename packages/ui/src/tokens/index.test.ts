import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { buildGovGraphTokenCss } from "./index";

const currentDirectory = dirname(fileURLToPath(import.meta.url));
const generatedCssPath = resolve(currentDirectory, "generated.css");

describe("buildGovGraphTokenCss", () => {
  it("includes core token variables and legacy aliases", () => {
    const css = buildGovGraphTokenCss();

    expect(css).toContain("--gg-color-paper: #f6f1e6;");
    expect(css).toContain("--gg-font-size-3xl: 1.875rem;");
    expect(css).toContain("--gg-radius-lg: 1.75rem;");
    expect(css).toContain("--govgraph-paper: var(--gg-color-paper);");
    expect(css).toContain("@keyframes gg-shimmer");
  });

  it("matches the committed generated stylesheet", () => {
    const committedCss = readFileSync(generatedCssPath, "utf8");

    expect(committedCss).toBe(`${buildGovGraphTokenCss()}\n`);
  });
});

import { writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { buildGovGraphTokenCss } from "../src/tokens";

const currentDirectory = dirname(fileURLToPath(import.meta.url));
const outputPath = resolve(currentDirectory, "../src/tokens/generated.css");

writeFileSync(outputPath, `${buildGovGraphTokenCss()}\n`);

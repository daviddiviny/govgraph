import { animation } from "./animation";
import { colors, legacyGovGraphAliases } from "./colors";
import { generateCssCustomProperties } from "./generate-css";
import { radii } from "./radii";
import { shadows } from "./shadows";
import { spacing } from "./spacing";
import { typography } from "./typography";

export { animation } from "./animation";
export { colors, legacyGovGraphAliases } from "./colors";
export { generateCssCustomProperties } from "./generate-css";
export { radii } from "./radii";
export { shadows } from "./shadows";
export { spacing } from "./spacing";
export { typography } from "./typography";

export const govGraphTokens = {
  color: colors,
  font: typography,
  space: spacing,
  radius: radii,
  shadow: shadows,
  animation,
} as const;

export function buildGovGraphTokenCss(): string {
  return [
    "/* This file is generated from packages/ui/src/tokens. */",
    generateCssCustomProperties(govGraphTokens, { prefix: "gg" }),
    generateCssCustomProperties(legacyGovGraphAliases, {
      prefix: "govgraph",
    }),
    [
      "@keyframes gg-shimmer {",
      "  0% {",
      "    transform: translateX(-100%);",
      "  }",
      "  100% {",
      "    transform: translateX(100%);",
      "  }",
      "}",
    ].join("\n"),
  ].join("\n\n");
}

export const govGraphTokenCss = buildGovGraphTokenCss();

type TokenValue = string | TokenTree;

export type TokenTree = {
  readonly [key: string]: TokenValue;
};

function isTokenTree(value: TokenValue): value is TokenTree {
  return typeof value !== "string";
}

function toKebabCase(value: string): string {
  return value
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/_/g, "-")
    .toLowerCase();
}

function flattenTokenTree(
  tree: TokenTree,
  prefix: readonly string[],
): string[] {
  const declarations: string[] = [];

  for (const [key, value] of Object.entries(tree)) {
    const path = [...prefix, toKebabCase(key)];

    if (isTokenTree(value)) {
      declarations.push(...flattenTokenTree(value, path));
      continue;
    }

    declarations.push(`  --${path.join("-")}: ${value};`);
  }

  return declarations;
}

export function generateCssCustomProperties(
  tree: TokenTree,
  options: {
    prefix: string;
    selector?: string;
  },
): string {
  const selector = options.selector ?? ":root";
  const declarations = flattenTokenTree(tree, [options.prefix]);

  return `${selector} {\n${declarations.join("\n")}\n}`;
}

import { copyFileSync, mkdirSync, readdirSync, statSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const fontsDir = join(root, "fonts");
mkdirSync(fontsDir, { recursive: true });

const require = createRequire(import.meta.url);
const pkgs = [
  ["@fontsource/dm-sans", ["dm-sans-latin-400-normal.woff2", "dm-sans-latin-500-normal.woff2"]],
  ["@fontsource/dm-mono", ["dm-mono-latin-400-normal.woff2"]],
  [
    "@fontsource/cormorant-garamond",
    ["cormorant-garamond-latin-500-normal.woff2", "cormorant-garamond-latin-400-italic.woff2"],
  ],
];

for (const [pkg, files] of pkgs) {
  const base = dirname(require.resolve(`${pkg}/400.css`));
  const filesDir = join(base, "files");
  for (const f of files) {
    copyFileSync(join(filesDir, f), join(fontsDir, f));
    console.log("copied", f);
  }
}

let total = 0;
for (const f of readdirSync(fontsDir)) {
  total += statSync(join(fontsDir, f)).size;
}
console.log(`Total fonts: ${(total / 1024).toFixed(1)} kB`);

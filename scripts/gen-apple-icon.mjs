import { createRequire } from "module";
import { writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const require = createRequire(import.meta.url);
const sharp = require("../../Loopbaantest/node_modules/sharp");
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 180"><rect width="180" height="180" fill="#1E3552"/><path fill="#C2704C" d="M90 28c-22 0-40 18-40 40 0 30 40 58 40 58s40-28 40-58c0-22-18-40-40-40z"/><circle cx="90" cy="68" r="18" fill="#F4ECDD"/></svg>`;
const buf = await sharp(Buffer.from(svg)).resize(180, 180).png().toBuffer();
writeFileSync(join(root, "apple-touch-icon.png"), buf);
console.log("wrote apple-touch-icon.png");

import { createRequire } from "module";
import { readdirSync, mkdirSync, renameSync, existsSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const require = createRequire(import.meta.url);
const sharp = require("../../Loopbaantest/node_modules/sharp");

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const imgDir = join(root, "img");
const bronDir = join(root, "bron-afbeeldingen");

const SOURCES = [
  { match: /Omslag/i, key: "omslag", portrait: true },
  { match: /Interesses/i, key: "interesses", portrait: false },
  { match: /Werkwaarden/i, key: "werkwaarden", portrait: false },
  { match: /Werkomgeving/i, key: "werkomgeving", portrait: false },
  { match: /Competenties/i, key: "competenties", portrait: false },
];

function findSource(key) {
  const files = readdirSync(root).filter((f) => f.toLowerCase().endsWith(".jpg"));
  const row = SOURCES.find((s) => s.key === key);
  const hit = files.find((f) => row.match.test(f));
  if (!hit) throw new Error(`Geen JPG gevonden voor ${key}`);
  return join(root, hit);
}

async function writeWebpUnderMax(sharpInst, outPath, maxBytes) {
  for (let q = 78; q >= 40; q -= 4) {
    const buf = await sharpInst.webp({ quality: q, effort: 6 }).toBuffer();
    if (buf.length <= maxBytes || q <= 40) {
      await sharp(buf).toFile(outPath);
      return { bytes: buf.length, quality: q };
    }
  }
}

async function resizeCover(input) {
  const sizes = [
    { name: "omslag-1200.webp", w: 1200, h: 1600, max: 150 * 1024 },
    { name: "omslag-600.webp", w: 600, h: 800, max: 60 * 1024 },
  ];
  for (const s of sizes) {
    const pipe = sharp(input).resize(s.w, s.h, { fit: "cover", position: "centre" });
    const meta = await writeWebpUnderMax(pipe, join(imgDir, s.name), s.max);
    console.log(`${s.name}: ${(meta.bytes / 1024).toFixed(1)} kB (q${meta.quality})`);
  }
}

async function resizeModule(input, key) {
  const sizes = [
    { suffix: "1600", w: 1600, h: 900, max: 120 * 1024 },
    { suffix: "800", w: 800, h: 450, max: 50 * 1024 },
  ];
  for (const s of sizes) {
    const name = `${key}-${s.suffix}.webp`;
    const pipe = sharp(input).resize(s.w, s.h, { fit: "cover", position: "centre" });
    const meta = await writeWebpUnderMax(pipe, join(imgDir, name), s.max);
    console.log(`${name}: ${(meta.bytes / 1024).toFixed(1)} kB (q${meta.quality})`);
  }
}

mkdirSync(imgDir, { recursive: true });
mkdirSync(bronDir, { recursive: true });

for (const row of SOURCES) {
  const src = findSource(row.key);
  const dest = join(bronDir, `${row.key}.jpg`);
  if (!existsSync(dest)) {
    try {
      renameSync(src, dest);
    } catch {
      // already moved; use bron copy
    }
  }
  const input = existsSync(dest) ? dest : src;
  if (row.portrait) await resizeCover(input);
  else await resizeModule(input, row.key);
}

console.log("Klaar — WebP in /img/, bron in /bron-afbeeldingen/");

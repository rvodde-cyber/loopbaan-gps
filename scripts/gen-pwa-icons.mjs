import { writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const pinSvg = (size, pad) => {
  const s = size - pad * 2;
  const scale = s / 180;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" fill="#1E3552"/>
  <g transform="translate(${pad} ${pad}) scale(${scale})">
    <path fill="#C2704C" d="M90 28c-22 0-40 18-40 40 0 30 40 58 40 58s40-28 40-58c0-22-18-40-40-40z"/>
    <circle cx="90" cy="68" r="18" fill="#F4ECDD"/>
  </g>
</svg>`;
};

for (const [name, size, pad] of [
  ["icon-192.png", 192, 0],
  ["icon-512.png", 512, 0],
  ["icon-512-maskable.png", 512, 64],
]) {
  const buf = await sharp(Buffer.from(pinSvg(size, pad))).png().toBuffer();
  writeFileSync(join(root, name), buf);
  console.log("wrote", name);
}

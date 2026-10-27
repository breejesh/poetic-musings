// Renders the app icons (home-screen / PWA) from public/logo.svg: the script wordmark in paper-white
// on stage black, sized to sit inside the maskable safe zone.
// Usage: node tools/make-icons.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'public/icons');
const BG = '#121110';
const INK = '#f3eee5';

fs.mkdirSync(OUT, { recursive: true });
const svg = fs.readFileSync(path.join(ROOT, 'public/logo.svg'), 'utf8');

async function icon(size, file, scale) {
  // White wordmark: render the black logo, then use it as an alpha mask over a paper-white fill.
  const mark = await sharp(Buffer.from(svg))
    .resize({ width: Math.round(size * scale) })
    .ensureAlpha()
    .toBuffer();
  const { width, height } = await sharp(mark).metadata();
  const white = await sharp({ create: { width, height, channels: 4, background: INK } })
    .composite([{ input: mark, blend: 'dest-in' }])
    .png()
    .toBuffer();
  await sharp({ create: { width: size, height: size, channels: 4, background: BG } })
    .composite([{ input: white, left: Math.round((size - width) / 2), top: Math.round((size - height) / 2 - size * 0.02) }])
    .png()
    .toFile(path.join(OUT, file));
}

await icon(192, 'icon-192.png', 0.78);
await icon(512, 'icon-512.png', 0.78);
await icon(512, 'maskable-512.png', 0.62);
await icon(180, 'apple-touch-icon.png', 0.74);
console.log('icons →', path.relative(ROOT, OUT));

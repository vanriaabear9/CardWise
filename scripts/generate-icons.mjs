/**
 * Draws CardWise's app icon, Android adaptive-icon layers, and splash image as PNG files.
 * No image libraries needed: shapes are rasterized here with 4×4 anti-aliasing and encoded with
 * Node's built-in zlib.
 *
 *   node scripts/generate-icons.mjs [outputDir]     (default: ./assets)
 *
 * Design: two stacked playing cards (lavender behind, purple in front) with a white diamond
 * suit, on the CardWise background #0D0B12.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { deflateSync } from 'node:zlib';

const COLORS = {
  background: [0x0d, 0x0b, 0x12],
  primary: [0x8b, 0x5c, 0xf6],
  secondary: [0xa7, 0x8b, 0xfa],
  highlight: [0xc4, 0xb5, 0xfd],
  white: [0xff, 0xff, 0xff],
};

// ---------- Shapes (signed distance: negative = inside), in a 1024×1024 design space ----------

function rotate(px, py, cx, cy, degrees) {
  const a = (-degrees * Math.PI) / 180;
  const dx = px - cx;
  const dy = py - cy;
  return [dx * Math.cos(a) - dy * Math.sin(a), dx * Math.sin(a) + dy * Math.cos(a)];
}

function roundedRect({ cx, cy, w, h, r, angle = 0 }) {
  return (x, y) => {
    const [lx, ly] = rotate(x, y, cx, cy, angle);
    const qx = Math.abs(lx) - (w / 2 - r);
    const qy = Math.abs(ly) - (h / 2 - r);
    return Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - r;
  };
}

/** A diamond (♦) with gently curved sides. */
function diamond({ cx, cy, w, h, angle = 0 }) {
  return (x, y) => {
    const [lx, ly] = rotate(x, y, cx, cy, angle);
    const nx = Math.abs(lx) / (w / 2);
    const ny = Math.abs(ly) / (h / 2);
    return (Math.pow(nx, 0.9) + Math.pow(ny, 0.9) - 1) * Math.min(w, h) * 0.5;
  };
}

/** Outline of a shape with the given stroke width. */
const stroke = (shape, width) => (x, y) => Math.abs(shape(x, y)) - width / 2;

function cardStack() {
  const back = { cx: 440, cy: 530, w: 380, h: 520, r: 52, angle: -13 };
  const front = { cx: 584, cy: 494, w: 380, h: 520, r: 52, angle: 9 };
  const frame = { ...front, w: front.w - 64, h: front.h - 64, r: 30 };
  return [
    // Soft dark gap around the front card so the two cards read as separate.
    { shape: roundedRect({ ...front, w: front.w + 26, h: front.h + 26, r: front.r + 13 }), color: COLORS.background, cutOnly: true },
    { shape: roundedRect(back), color: COLORS.secondary },
    { shape: roundedRect({ ...front, w: front.w + 26, h: front.h + 26, r: front.r + 13 }), color: COLORS.background },
    { shape: roundedRect(front), color: COLORS.primary },
    { shape: stroke(roundedRect(frame), 9), color: COLORS.highlight, alpha: 0.85 },
    { shape: diamond({ cx: front.cx, cy: front.cy, w: 150, h: 220, angle: front.angle }), color: COLORS.white },
  ].filter((layer) => !layer.cutOnly);
}

// ---------- Rasterizer ----------

/**
 * @param {number} size     output pixels
 * @param {object} opts
 * @param {number[]|null} opts.background  solid background color, or null for transparent
 * @param {number} opts.scale  design scale around the center (1 = fill the canvas)
 * @param {boolean} opts.monochrome  draw every layer white (Android themed icon)
 */
function render(size, { background = COLORS.background, scale = 1, monochrome = false } = {}) {
  const layers = cardStack();
  const pixels = new Uint8Array(size * size * 4);
  const SS = 4; // 4×4 samples per pixel
  for (let py = 0; py < size; py += 1) {
    for (let px = 0; px < size; px += 1) {
      let r = 0;
      let g = 0;
      let b = 0;
      let a = 0;
      for (let sy = 0; sy < SS; sy += 1) {
        for (let sx = 0; sx < SS; sx += 1) {
          // Map the sample into the 1024 design space (scaled around the center).
          const x = (((px + (sx + 0.5) / SS) / size) * 1024 - 512) / scale + 512;
          const y = (((py + (sy + 0.5) / SS) / size) * 1024 - 512) / scale + 512;
          let color = background;
          let alpha = background ? 1 : 0;
          for (const layer of layers) {
            if (layer.shape(x, y) <= 0) {
              // Monochrome (Android themed icon): cards are a white silhouette; the gap, the
              // frame line, and the diamond are cut out so the shape stays readable.
              const isCutOut =
                layer.color === COLORS.background || layer.color === COLORS.white || layer.color === COLORS.highlight;
              const layerColor = monochrome ? (isCutOut ? null : COLORS.white) : layer.color;
              const la = layer.alpha ?? 1;
              if (layerColor === null) {
                // In monochrome, the dark gap becomes transparent.
                color = background;
                alpha = background ? 1 : 0;
              } else if (alpha === 0) {
                color = layerColor;
                alpha = la;
              } else {
                color = color.map((c, i) => c * (1 - la) + layerColor[i] * la);
                alpha = alpha + la * (1 - alpha);
              }
            }
          }
          if (color) {
            r += color[0] * alpha;
            g += color[1] * alpha;
            b += color[2] * alpha;
          }
          a += alpha;
        }
      }
      const i = (py * size + px) * 4;
      const n = SS * SS;
      pixels[i] = a ? Math.round(r / a) : 0;
      pixels[i + 1] = a ? Math.round(g / a) : 0;
      pixels[i + 2] = a ? Math.round(b / a) : 0;
      pixels[i + 3] = Math.round((a / n) * 255);
    }
  }
  return encodePng(size, size, pixels);
}

// ---------- PNG encoder (RGBA, 8-bit) ----------

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
function crc32(buffer) {
  let c = 0xffffffff;
  for (const byte of buffer) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const out = Buffer.alloc(12 + data.length);
  out.writeUInt32BE(data.length, 0);
  out.write(type, 4, 'ascii');
  data.copy(out, 8);
  out.writeUInt32BE(crc32(out.subarray(4, 8 + data.length)), 8 + data.length);
  return out;
}
function encodePng(width, height, rgba) {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8; // bit depth
  header[9] = 6; // RGBA
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y += 1) {
    raw[y * (width * 4 + 1)] = 0; // filter: none
    Buffer.from(rgba.buffer, y * width * 4, width * 4).copy(raw, y * (width * 4 + 1) + 1);
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', header),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// ---------- Output ----------

const outDir = process.argv[2]
  ? path.resolve(process.argv[2])
  : path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'assets');
mkdirSync(outDir, { recursive: true });

const FILES = {
  // Main icon (iOS, Expo Go, store listing): full dark square.
  'icon.png': () => render(1024, { scale: 1.05 }),
  // Android adaptive icon: Android crops it to a circle/squircle, so the art stays in the safe zone.
  'android-icon-foreground.png': () => render(1024, { background: null, scale: 0.78 }),
  'android-icon-background.png': () => render(1024, { scale: 0.0001 }), // solid #0D0B12
  'android-icon-monochrome.png': () => render(1024, { background: null, scale: 0.78, monochrome: true }),
  // Splash: the cards on a transparent background (the splash color is set in app.json).
  'splash-icon.png': () => render(1024, { background: null, scale: 0.9 }),
  'favicon.png': () => render(48, { scale: 1.05 }),
};
for (const [name, make] of Object.entries(FILES)) {
  const png = make();
  writeFileSync(path.join(outDir, name), png);
  console.log(`${name}  ${(png.length / 1024).toFixed(1)} KB`);
}

// Генератор PNG-иконок без внешних библиотек: сырые пиксели -> zlib -> чанки PNG.
// Рисунок: тёмный фон приложения, белый круг (дело на таймлайне), красная линия «сейчас».
// Запуск: node scripts/make-icons.mjs

import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const CRC_TABLE = new Int32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  CRC_TABLE[n] = c;
}

function crc32(buf) {
  let c = 0xffffffff;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const out = Buffer.alloc(data.length + 12);
  out.writeUInt32BE(data.length, 0);
  out.write(type, 4, 'ascii');
  data.copy(out, 8);
  out.writeUInt32BE(crc32(out.subarray(4, 8 + data.length)), 8 + data.length);
  return out;
}

function png(width, height, rgba) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;  // бит на канал
  ihdr[9] = 6;  // цвет: RGBA
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (width * 4 + 1)] = 0; // фильтр none
    rgba.subarray(y * width * 4, (y + 1) * width * 4).copy(raw, y * (width * 4 + 1) + 1);
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

const BG = [0x33, 0x3a, 0x45];
const WHITE = [0xff, 0xff, 0xff];
const RED = [0xd0, 0x65, 0x65];

// Сглаживание: считаем 4x4 подпикселей
function render(size) {
  const px = Buffer.alloc(size * size * 4);
  const SS = 4;
  const cy = size * 0.42;
  const r = size * 0.20;
  const halfLine = size * 0.022;
  const halfLen = size * 0.31;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let rr = 0, gg = 0, bb = 0;
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const pxs = x + (sx + 0.5) / SS;
          const pys = y + (sy + 0.5) / SS;
          const inCircle = (pxs - size / 2) ** 2 + (pys - cy) ** 2 <= r * r;
          const inLine = Math.abs(pys - cy) <= halfLine && Math.abs(pxs - size / 2) <= halfLen;
          const c = inLine ? RED : inCircle ? WHITE : BG;
          rr += c[0]; gg += c[1]; bb += c[2];
        }
      }
      const n = SS * SS;
      const i = (y * size + x) * 4;
      px[i] = rr / n;
      px[i + 1] = gg / n;
      px[i + 2] = bb / n;
      px[i + 3] = 255;
    }
  }
  return px;
}

mkdirSync(join(root, 'public'), { recursive: true });
for (const size of [192, 512]) {
  const file = join(root, 'public', `icon-${size}.png`);
  writeFileSync(file, png(size, size, render(size)));
  console.log(`${file}`);
}

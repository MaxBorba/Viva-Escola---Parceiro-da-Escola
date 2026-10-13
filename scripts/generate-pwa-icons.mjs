import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

function createCrcTable() {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c;
  }
  return table;
}

const crcTable = createCrcTable();
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function makeChunk(type, data) {
  const typeBuf = Buffer.from(type);
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);

  const crcBuf = Buffer.alloc(4);
  const toCrc = Buffer.concat([typeBuf, data]);
  crcBuf.writeUInt32BE(crc32(toCrc), 0);

  return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
}

function generatePng(width, height, isMaskable = false) {
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData.writeUInt8(8, 8); // 8 bits
  ihdrData.writeUInt8(6, 9); // RGBA
  ihdrData.writeUInt8(0, 10);
  ihdrData.writeUInt8(0, 11);
  ihdrData.writeUInt8(0, 12);

  const ihdr = makeChunk('IHDR', ihdrData);

  // Raw pixel data: each scanline has 1 filter byte (0) + width * 4 bytes
  const rowLen = 1 + width * 4;
  const rawData = Buffer.alloc(rowLen * height);

  const cx = width / 2;
  const cy = height / 2;
  const maxR = width / 2;
  const safeR = width * (isMaskable ? 0.38 : 0.44);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowLen;
    rawData[rowOffset] = 0; // Filter None

    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Background gradient: Dark Slate (#0f172a to #1e293b)
      let r = 15 + Math.floor((y / height) * 15);
      let g = 23 + Math.floor((y / height) * 20);
      let b = 42 + Math.floor((y / height) * 25);
      let a = 255;

      // Outer circular emblem / shield area
      if (dist < safeR) {
        // Emerald Green Shield (#059669 to #10b981)
        const shieldGrad = (y - (cy - safeR)) / (safeR * 2);
        r = Math.floor(5 + shieldGrad * 11);
        g = Math.floor(150 + shieldGrad * 35);
        b = Math.floor(105 + shieldGrad * 24);

        // Gold border inside shield
        if (Math.abs(dist - safeR + 8) < 4) {
          r = 251; g = 191; b = 36; // Amber gold
        }

        // Inner core building/tool badge
        if (dist < safeR * 0.55) {
          // Deep Navy center
          r = 15; g = 23; b = 42;
          // Amber highlight
          if (Math.abs(dist - safeR * 0.55 + 4) < 3) {
            r = 245; g = 158; b = 11;
          }
          // Central cross / maintenance symbol in white/gold
          if (Math.abs(dx) < safeR * 0.12 && Math.abs(dy) < safeR * 0.35) {
            r = 56; g = 189; b = 248; // Cyan
          }
          if (Math.abs(dy) < safeR * 0.12 && Math.abs(dx) < safeR * 0.35) {
            r = 56; g = 189; b = 248; // Cyan
          }
        }
      }

      rawData[pxOffset] = r;
      rawData[pxOffset + 1] = g;
      rawData[pxOffset + 2] = b;
      rawData[pxOffset + 3] = a;
    }
  }

  const deflated = zlib.deflateSync(rawData);
  const idat = makeChunk('IDAT', deflated);
  const iend = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([sig, ihdr, idat, iend]);
}

const publicDir = path.join(process.cwd(), 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Write icons
fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), generatePng(192, 192, false));
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), generatePng(512, 512, false));
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), generatePng(512, 512, true));
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), generatePng(180, 180, false));
fs.writeFileSync(path.join(publicDir, 'favicon.ico'), generatePng(48, 48, false));

console.log('PWA icons created successfully in public/');

import fs from 'node:fs';
import zlib from 'node:zlib';

function createPng(width, height) {
  // Simple uncompressed/deflated PNG generator
  const rowSize = width * 4;
  const rawData = Buffer.alloc((rowSize + 1) * height);

  const cx = width / 2;
  const cy = height / 2;
  const rOuter = width * 0.45;

  for (let y = 0; y < height; y++) {
    const rowOffset = y * (rowSize + 1);
    rawData[rowOffset] = 0; // Filter type None

    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Background midnight gradient #0D0A1A to #1A1430
      const t = Math.min(dist / (width * 0.7), 1);
      let r = Math.round(26 * (1 - t) + 13 * t);
      let g = Math.round(20 * (1 - t) + 10 * t);
      let b = Math.round(48 * (1 - t) + 26 * t);
      let a = 255;

      // Outer ring
      if (Math.abs(dist - width * 0.38) < width * 0.015) {
        r = 61; g = 46; b = 74; // #3D2E4A
      }

      // Star shape in the center (astroid / 4-pointed star)
      const nx = Math.abs(dx) / (width * 0.28);
      const ny = Math.abs(dy) / (width * 0.28);
      if (Math.pow(nx, 0.5) + Math.pow(ny, 0.5) <= 1) {
        // Glowing coral #E8825A -> peach #F5A87E
        const starDist = Math.sqrt(dx*dx + dy*dy) / (width * 0.28);
        r = Math.round(245 * (1 - starDist) + 232 * starDist);
        g = Math.round(168 * (1 - starDist) + 130 * starDist);
        b = Math.round(126 * (1 - starDist) + 90 * starDist);
      }

      rawData[pxOffset] = r;
      rawData[pxOffset + 1] = g;
      rawData[pxOffset + 2] = b;
      rawData[pxOffset + 3] = a;
    }
  }

  const deflated = zlib.deflateSync(rawData);

  // PNG Signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR
  const ihdr = Buffer.alloc(25);
  ihdr.writeUInt32BE(13, 0);
  ihdr.write('IHDR', 4);
  ihdr.writeUInt32BE(width, 8);
  ihdr.writeUInt32BE(height, 12);
  ihdr[16] = 8; // Bit depth
  ihdr[17] = 6; // RGBA
  ihdr[18] = 0; // Compression
  ihdr[19] = 0; // Filter
  ihdr[20] = 0; // Interlace
  const ihdrCrc = crc32(ihdr.subarray(4, 21));
  ihdr.writeInt32BE(ihdrCrc, 21);

  // IDAT
  const idat = Buffer.alloc(8 + deflated.length + 4);
  idat.writeUInt32BE(deflated.length, 0);
  idat.write('IDAT', 4);
  deflated.copy(idat, 8);
  const idatCrc = crc32(Buffer.concat([Buffer.from('IDAT'), deflated]));
  idat.writeInt32BE(idatCrc, 8 + deflated.length);

  // IEND
  const iend = Buffer.alloc(12);
  iend.writeUInt32BE(0, 0);
  iend.write('IEND', 4);
  const iendCrc = crc32(Buffer.from('IEND'));
  iend.writeInt32BE(iendCrc, 8);

  return Buffer.concat([signature, ihdr, idat, iend]);
}

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    const byte = buf[i];
    crc = crc ^ byte;
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (-(crc & 1) & 0xedb88320);
    }
  }
  return (crc ^ 0xffffffff) | 0;
}

if (!fs.existsSync('public')) {
  fs.mkdirSync('public');
}

fs.writeFileSync('public/pwa-192x192.png', createPng(192, 192));
fs.writeFileSync('public/pwa-512x512.png', createPng(512, 512));
fs.writeFileSync('public/apple-touch-icon.png', createPng(180, 180));
fs.writeFileSync('public/pwa-maskable-512x512.png', createPng(512, 512));
console.log('PWA icons created successfully');

const { deflateSync } = require('node:zlib');

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const name = Buffer.from(type, 'ascii');
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const checksum = Buffer.alloc(4);
  checksum.writeUInt32BE(crc32(Buffer.concat([name, data])));
  return Buffer.concat([length, name, data, checksum]);
}

function createGhostTrayPng(size = 32) {
  const pixels = Buffer.alloc(size * size * 4);
  const inside = (x, y) => {
    if (y < 2 || y > 29 || x < 4 || x > 27) return false;
    if (y < 20) return ((x - 16) ** 2) / 100 + ((y - 13) ** 2) / 121 <= 1;
    const waveBottom = 27 + Math.round(1.5 * Math.sin((x - 5) * Math.PI / 5));
    return x >= 6 && x <= 26 && y <= waveBottom;
  };

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (!inside(x, y)) continue;
      const boundary = !inside(x - 1, y) || !inside(x + 1, y) || !inside(x, y - 1) || !inside(x, y + 1);
      let color = boundary ? [113, 101, 138, 255] : [255, 255, 255, 255];
      if ((x === 11 || x === 12 || x === 19 || x === 20) && (y === 13 || y === 14)) color = [85, 70, 95, 255];
      if ((x === 9 || x === 10 || x === 21 || x === 22) && y === 17) color = [244, 169, 185, 255];
      if (y === 19 && x >= 13 && x <= 18 && Math.abs(x - 16) <= Math.abs(y - 19)) color = [85, 70, 95, 255];
      const offset = (y * size + x) * 4;
      pixels.set(color, offset);
    }
  }

  const rows = Buffer.alloc((size * 4 + 1) * size);
  for (let y = 0; y < size; y++) {
    const rowOffset = y * (size * 4 + 1);
    rows[rowOffset] = 0;
    pixels.copy(rows, rowOffset + 1, y * size * 4, (y + 1) * size * 4);
  }

  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0);
  header.writeUInt32BE(size, 4);
  header[8] = 8;
  header[9] = 6;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    pngChunk('IHDR', header),
    pngChunk('IDAT', deflateSync(rows)),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

module.exports = { createGhostTrayPng };

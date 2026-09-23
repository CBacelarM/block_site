const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// Lightweight zero-dependency standard ZIP generator
function createZip(sourceDir, outZipPath) {
  const files = [];

  function walk(dir) {
    for (const item of fs.readdirSync(dir)) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        walk(fullPath);
      } else if (stat.isFile()) {
        const relPath = path.relative(sourceDir, fullPath).split(path.sep).join('/');
        files.push({ fullPath, relPath });
      }
    }
  }

  walk(sourceDir);

  const localHeaders = [];
  const centralDirs = [];
  let offset = 0;

  function crc32(buf) {
    let crc = ~0;
    for (let i = 0; i < buf.length; i++) {
      const byte = buf[i];
      for (let j = 0; j < 8; j++) {
        const bit = (byte ^ crc) & 1;
        crc = (crc >>> 1) ^ (bit ? 0xEDB88320 : 0);
      }
    }
    return (~crc) >>> 0;
  }

  const chunks = [];

  for (const file of files) {
    const data = fs.readFileSync(file.fullPath);
    const uncompressedSize = data.length;
    const deflated = zlib.deflateRawSync(data, { level: 9 });
    const useDeflate = deflated.length < uncompressedSize;
    const compData = useDeflate ? deflated : data;
    const method = useDeflate ? 8 : 0;
    const compSize = compData.length;
    const crc = crc32(data);
    const nameBuf = Buffer.from(file.relPath, 'utf8');

    // Local file header (30 bytes + nameBuf.length)
    const lh = Buffer.alloc(30 + nameBuf.length);
    lh.writeUInt32LE(0x04034b50, 0); // Signature
    lh.writeUInt16LE(20, 4);          // Min version
    lh.writeUInt16LE(0x0800, 6);      // Flags (UTF-8)
    lh.writeUInt16LE(method, 8);      // Compression method
    lh.writeUInt16LE(0, 10);          // Mod time
    lh.writeUInt16LE(0, 12);          // Mod date
    lh.writeUInt32LE(crc, 14);        // CRC32
    lh.writeUInt32LE(compSize, 18);   // Compressed size
    lh.writeUInt32LE(uncompressedSize, 22); // Uncompressed size
    lh.writeUInt16LE(nameBuf.length, 26);   // Filename length
    lh.writeUInt16LE(0, 28);                // Extra length
    nameBuf.copy(lh, 30);

    chunks.push(lh);
    chunks.push(compData);

    // Central directory header (46 bytes + nameBuf.length)
    const cd = Buffer.alloc(46 + nameBuf.length);
    cd.writeUInt32LE(0x02014b50, 0); // Signature
    cd.writeUInt16LE(20, 4);          // Made by
    cd.writeUInt16LE(20, 6);          // Min version
    cd.writeUInt16LE(0x0800, 8);      // Flags (UTF-8)
    cd.writeUInt16LE(method, 10);     // Method
    cd.writeUInt16LE(0, 12);          // Time
    cd.writeUInt16LE(0, 14);          // Date
    cd.writeUInt32LE(crc, 16);        // CRC32
    cd.writeUInt32LE(compSize, 20);   // Compressed size
    cd.writeUInt32LE(uncompressedSize, 24); // Uncompressed size
    cd.writeUInt16LE(nameBuf.length, 28);   // Filename length
    cd.writeUInt16LE(0, 30);                // Extra length
    cd.writeUInt16LE(0, 32);                // Comment length
    cd.writeUInt16LE(0, 34);                // Disk start
    cd.writeUInt16LE(0, 36);                // Internal attrs
    cd.writeUInt32LE(0, 38);                // External attrs
    cd.writeUInt32LE(offset, 42);           // Relative offset of local header
    nameBuf.copy(cd, 46);

    centralDirs.push(cd);
    offset += lh.length + compData.length;
  }

  const cdOffset = offset;
  let cdSize = 0;
  for (const cd of centralDirs) {
    chunks.push(cd);
    cdSize += cd.length;
  }

  // End of central directory record (22 bytes)
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0); // Signature
  eocd.writeUInt16LE(0, 4);           // Disk number
  eocd.writeUInt16LE(0, 6);           // Start disk
  eocd.writeUInt16LE(files.length, 8);// Entries on this disk
  eocd.writeUInt16LE(files.length, 10);// Total entries
  eocd.writeUInt32LE(cdSize, 12);     // Central directory size
  eocd.writeUInt32LE(cdOffset, 16);   // Central directory offset
  eocd.writeUInt16LE(0, 20);          // Comment length

  chunks.push(eocd);

  fs.writeFileSync(outZipPath, Buffer.concat(chunks));
  console.log(`Created ${outZipPath} with ${files.length} files successfully!`);
}

createZip(path.resolve(__dirname, 'play'), path.resolve(__dirname, 'block-itch.zip'));

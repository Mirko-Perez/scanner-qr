/**
 * Generates a violet circle ICO file in pure JavaScript (no dependencies).
 * Produces sizes: 16, 32, 48, 256.
 */

function writeUInt32LE(buf, val, offset) {
  buf[offset]     =  val        & 0xff
  buf[offset + 1] = (val >>  8) & 0xff
  buf[offset + 2] = (val >> 16) & 0xff
  buf[offset + 3] = (val >> 24) & 0xff
}
function writeUInt16LE(buf, val, offset) {
  buf[offset]     =  val       & 0xff
  buf[offset + 1] = (val >> 8) & 0xff
}

/**
 * Creates a 32-bit BGRA BMP image (without file header) suitable for ICO.
 * Renders a violet circle on transparent background.
 */
function createBmpImage(size) {
  // Violet-700: RGB(109, 40, 217)
  const PR = 109, PG = 40, PB = 217

  const maskRowBytes = Math.ceil(size / 32) * 4
  const pixelSize    = size * size * 4
  const totalSize    = 40 + pixelSize + maskRowBytes * size

  const buf  = Buffer.alloc(totalSize, 0)
  let   off  = 0
  const half = size / 2
  const r2   = (half - 0.5) * (half - 0.5)

  // BITMAPINFOHEADER (40 bytes)
  writeUInt32LE(buf,  40,        off); off += 4 // biSize
  writeUInt32LE(buf,  size,      off); off += 4 // biWidth
  writeUInt32LE(buf,  size * 2,  off); off += 4 // biHeight × 2 (ICO convention)
  writeUInt16LE(buf,  1,         off); off += 2 // biPlanes
  writeUInt16LE(buf,  32,        off); off += 2 // biBitCount
  off += 24                                       // biCompression … biClrImportant (all 0)

  // Pixel data: BGRA, bottom row first
  for (let y = size - 1; y >= 0; y--) {
    for (let x = 0; x < size; x++) {
      const cx = x - half + 0.5
      const cy = y - half + 0.5
      if (cx * cx + cy * cy <= r2) {
        buf[off++] = PB;  buf[off++] = PG;  buf[off++] = PR;  buf[off++] = 255
      } else {
        off += 4  // transparent
      }
    }
  }

  // AND mask: 1 = transparent; row padded to 32-bit boundary
  for (let y = size - 1; y >= 0; y--) {
    for (let bi = 0; bi < maskRowBytes; bi++) {
      let byte = 0
      for (let bit = 7; bit >= 0; bit--) {
        const x  = bi * 8 + (7 - bit)
        if (x >= size) { byte |= (1 << bit); continue }
        const cx = x - half + 0.5
        const cy = y - half + 0.5
        if (cx * cx + cy * cy > r2) byte |= (1 << bit)
      }
      buf[off++] = byte
    }
  }

  return buf
}

function generateIco() {
  const sizes  = [16, 32, 48, 256]
  const images = sizes.map(createBmpImage)

  const headerSize  = 6
  const dirEntrySize = 16
  let   dataOffset  = headerSize + sizes.length * dirEntrySize

  const parts = []

  // ICO header
  const hdr = Buffer.alloc(6, 0)
  writeUInt16LE(hdr, 1, 2)               // type: 1 = ICO
  writeUInt16LE(hdr, sizes.length, 4)    // count
  parts.push(hdr)

  // Directory entries
  for (let i = 0; i < sizes.length; i++) {
    const s   = sizes[i]
    const ent = Buffer.alloc(16, 0)
    ent[0] = s >= 256 ? 0 : s            // width  (0 means 256)
    ent[1] = s >= 256 ? 0 : s            // height
    writeUInt16LE(ent, 1,              4) // planes
    writeUInt16LE(ent, 32,             6) // bit count
    writeUInt32LE(ent, images[i].length, 8)  // bytes in resource
    writeUInt32LE(ent, dataOffset,    12)    // offset
    dataOffset += images[i].length
    parts.push(ent)
  }

  parts.push(...images)
  return Buffer.concat(parts)
}

module.exports = { generateIco }
